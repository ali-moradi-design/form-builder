import type { FieldNode, FormDocument } from "@formcanvas/schema";
import { describe, expect, it } from "vitest";
import { compile, SchemaError } from "./compile.js";
import { evaluate } from "./evaluate.js";
import { allFields } from "./fields/all.js";
import { createRegistry } from "./registry.js";

const registry = createRegistry(allFields);
const plan = { op: "eq", args: [{ var: "plan" }, "team"] } as const;

const doc = (fields: FieldNode[], extra: Partial<FormDocument> = {}): FormDocument => ({
  schemaVersion: 1,
  id: "t",
  title: "Test",
  locales: { default: "en" },
  steps: [{ key: "main", fields }],
  ...extra,
});

const planField: FieldNode = {
  type: "radio",
  key: "plan",
  settings: { options: [{ value: "free" }, { value: "team" }] },
};

describe("compile", () => {
  it("indexes fields in document order, including nested ones", () => {
    const form = compile(
      doc([planField, { type: "group", key: "g", fields: [{ type: "shortText", key: "city" }] }]),
      { registry },
    );
    expect(form.order).toEqual(["plan", "g", "city"]);
    expect(form.fields.get("city")?.parent).toBe("g");
    expect(form.steps[0]?.fields).toEqual(["plan", "g", "city"]);
  });

  it("throws a SchemaError with a path for unknown types", () => {
    try {
      compile(doc([{ type: "nope", key: "a" }]), { registry });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError);
      expect((e as SchemaError).path).toEqual(["steps", 0, "fields", 0, "type"]);
    }
  });

  it("rejects invalid settings", () => {
    expect(() =>
      compile(doc([{ type: "radio", key: "a", settings: { options: [] } }]), { registry }),
    ).toThrow(SchemaError);
  });

  it("collects default values", () => {
    const form = compile(
      doc([
        { type: "switch", key: "terms" },
        { type: "email", key: "e" },
      ]),
      {
        registry,
      },
    );
    expect(form.defaults).toEqual({ terms: false });
  });

  it("records which fields and steps read a value", () => {
    const form = compile(
      doc([planField, { type: "number", key: "seats", visibleWhen: plan }], {
        steps: [
          { key: "a", fields: [planField] },
          {
            key: "b",
            visibleWhen: plan,
            fields: [{ type: "number", key: "seats", requiredWhen: plan }],
          },
        ],
      }),
      { registry },
    );
    expect([...(form.dependents.get("plan") ?? [])]).toEqual(["step:b", "seats"]);
  });
});

describe("evaluate", () => {
  const form = compile(
    doc([
      planField,
      { type: "number", key: "seats", visibleWhen: plan, requiredWhen: plan },
      {
        type: "group",
        key: "billing",
        visibleWhen: plan,
        disabledWhen: { op: "eq", args: [{ var: "locked" }, true] },
        fields: [{ type: "shortText", key: "vat", required: true }],
      },
      { type: "switch", key: "locked" },
      { type: "shortText", key: "note" },
    ]),
    { registry },
  );

  it("shows and requires fields from conditions", () => {
    const off = evaluate(form, { plan: "free" });
    expect(off.fields.seats).toEqual({ visible: false, required: false, disabled: false });
    const on = evaluate(form, { plan: "team" });
    expect(on.fields.seats).toEqual({ visible: true, required: true, disabled: false });
  });

  it("hides and disables children with their container", () => {
    expect(evaluate(form, { plan: "free" }).fields.vat?.visible).toBe(false);
    const s = evaluate(form, { plan: "team", locked: true });
    expect(s.fields.vat).toEqual({ visible: true, required: true, disabled: true });
    expect(s.fields.billing?.required).toBe(false);
  });

  it("hides every field of a hidden step", () => {
    const twoSteps = compile(
      doc([], {
        steps: [
          { key: "a", fields: [planField] },
          {
            key: "b",
            visibleWhen: plan,
            fields: [{ type: "shortText", key: "x", required: true }],
          },
        ],
      }),
      { registry },
    );
    const s = evaluate(twoSteps, { plan: "free" });
    expect(s.steps.b?.visible).toBe(false);
    expect(s.fields.x?.required).toBe(false);
  });

  it("updates only what changed and reuses the rest", () => {
    const a = evaluate(form, { plan: "free" });
    const b = evaluate(form, { plan: "team" }, { previous: a, changed: ["plan"] });
    expect(b).not.toBe(a);
    expect(b.fields.note).toBe(a.fields.note);
    expect(b.fields.vat?.visible).toBe(true);
    expect(b).toEqual(evaluate(form, { plan: "team" }));
  });

  it("returns the previous state when nothing depends on the change", () => {
    const a = evaluate(form, { plan: "free" });
    expect(evaluate(form, { plan: "free", note: "hi" }, { previous: a, changed: ["note"] })).toBe(
      a,
    );
  });

  it("evaluates 500 fields quickly", () => {
    const fields: FieldNode[] = [planField];
    for (let i = 0; i < 499; i++) {
      fields.push({
        type: "shortText",
        key: `f${String(i)}`,
        visibleWhen: i % 10 === 0 ? plan : undefined,
      });
    }
    const big = compile(doc(fields), { registry });
    let state = evaluate(big, { plan: "free" });
    const t0 = Date.now();
    for (let i = 0; i < 100; i++) {
      state = evaluate(
        big,
        { plan: i % 2 ? "team" : "free" },
        { previous: state, changed: ["plan"] },
      );
    }
    const perCall = (Date.now() - t0) / 100;
    expect(perCall).toBeLessThan(5);
  });
});
