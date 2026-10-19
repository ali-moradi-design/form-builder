import { describe, expect, it } from "vitest";
import { parseFormDocument } from "./meta.js";
import type { FormDocument } from "./types.js";

const valid: FormDocument = {
  schemaVersion: 1,
  id: "feedback",
  title: { en: "Product feedback", fa: "نظرسنجی محصول" },
  locales: { default: "en", supported: ["en", "fa"] },
  steps: [
    {
      key: "main",
      fields: [
        { type: "radio", key: "plan", required: true, settings: { options: ["free", "team"] } },
        {
          type: "number",
          key: "seats",
          visibleWhen: { op: "eq", args: [{ var: "plan" }, "team"] },
        },
        {
          type: "group",
          key: "address",
          fields: [{ type: "shortText", key: "city", width: "half" }],
        },
      ],
    },
  ],
};

const withStep = (fields: unknown[]): unknown => ({
  ...valid,
  steps: [{ key: "main", fields }],
});

const messages = (input: unknown): string[] => {
  const r = parseFormDocument(input);
  return r.success ? [] : r.issues.map((i) => i.message);
};

describe("parseFormDocument", () => {
  it("accepts a valid document and returns it", () => {
    const r = parseFormDocument(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual(valid);
  });

  it("never throws on garbage input", () => {
    for (const input of [undefined, null, 1, "x", [], {}, { steps: "no" }]) {
      expect(parseFormDocument(input).success).toBe(false);
    }
  });

  it("rejects operators outside the allow-list", () => {
    const r = parseFormDocument(
      withStep([{ type: "number", key: "a", visibleWhen: { op: "eval", args: ["alert(1)"] } }]),
    );
    expect(r.success).toBe(false);
  });

  it("rejects unknown properties", () => {
    expect(parseFormDocument({ ...valid, onSubmit: "fetch()" }).success).toBe(false);
  });

  it("rejects invalid keys", () => {
    expect(parseFormDocument(withStep([{ type: "shortText", key: "1st name" }])).success).toBe(
      false,
    );
  });

  it("reports duplicate field keys, also inside containers", () => {
    const m = messages(
      withStep([
        { type: "shortText", key: "city" },
        { type: "group", key: "g", fields: [{ type: "shortText", key: "city" }] },
      ]),
    );
    expect(m).toContain('Duplicate field key "city".');
  });

  it("reports duplicate step keys", () => {
    const m = messages({
      ...valid,
      steps: [
        { key: "a", fields: [] },
        { key: "a", fields: [] },
      ],
    });
    expect(m).toContain('Duplicate step key "a".');
  });

  it("reports expressions that read unknown fields", () => {
    const m = messages(
      withStep([
        { type: "number", key: "a", visibleWhen: { op: "gt", args: [{ var: "missing" }, 1] } },
      ]),
    );
    expect(m).toContain('Unknown field "missing" in expression.');
    const calc = messages(
      withStep([
        { type: "calculated", key: "t", calculate: { op: "mul", args: [{ var: "q" }, 2] } },
      ]),
    );
    expect(calc).toContain('Unknown field "q" in expression.');
  });

  it("requires the default locale to be supported", () => {
    const m = messages({ ...valid, locales: { default: "de", supported: ["en", "fa"] } });
    expect(m).toContain("The default locale must be one of the supported locales.");
  });

  it("requires at least one step", () => {
    expect(messages({ ...valid, steps: [] })).toContain("A form needs at least one step.");
  });

  it("gives a path to each problem", () => {
    const r = parseFormDocument(
      withStep([
        { type: "shortText", key: "a" },
        { type: "x", key: "a" },
      ]),
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.issues[0]?.path).toEqual(["steps", 0, "fields", 1, "key"]);
  });
});
