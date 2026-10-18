import type { FormDocument } from "@formweave/schema";
import { describe, expect, it } from "vitest";
import { compile } from "./compile.js";
import { allFields } from "./fields/all.js";
import { createRegistry } from "./registry.js";
import { toStandardSchema, validate } from "./validate.js";

const doc: FormDocument = {
  schemaVersion: 1,
  id: "t",
  title: "Test",
  locales: { default: "en" },
  steps: [
    {
      key: "a",
      fields: [
        { type: "shortText", key: "name", required: true, settings: { minLength: 2 } },
        { type: "email", key: "email" },
        {
          type: "radio",
          key: "plan",
          settings: { options: [{ value: "free" }, { value: "team" }] },
        },
      ],
    },
    {
      key: "b",
      fields: [
        {
          type: "number",
          key: "seats",
          visibleWhen: { op: "eq", args: [{ var: "plan" }, "team"] },
          required: true,
          settings: { min: 2 },
        },
        { type: "switch", key: "terms", required: true },
      ],
    },
  ],
};
const form = compile(doc, { registry: createRegistry(allFields) });

describe("validate", () => {
  it("returns only visible, non-empty values", () => {
    const r = validate(form, { name: "Sara", email: "", plan: "free", seats: 9, terms: true });
    expect(r).toEqual({ success: true, data: { name: "Sara", plan: "free", terms: true } });
  });

  it("reports required, type rules and limits once per field", () => {
    const r = validate(form, { name: "S", email: "x", plan: "team", seats: 1, terms: false });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues).toEqual([
        { key: "name", code: "tooShort", params: { min: 2 } },
        { key: "email", code: "invalidEmail", params: {} },
        { key: "seats", code: "tooSmall", params: { min: 2 } },
        { key: "terms", code: "required" },
      ]);
    }
  });

  it("can check one step", () => {
    const r = validate(form, { name: "Sara" }, { step: "a" });
    expect(r.success).toBe(true);
  });

  it("ignores values for hidden fields", () => {
    const r = validate(form, { name: "Sara", plan: "free", seats: "not a number", terms: true });
    expect(r.success).toBe(true);
  });
});

describe("toStandardSchema", () => {
  it("speaks the Standard Schema protocol", () => {
    const schema = toStandardSchema(form)["~standard"];
    expect(schema.version).toBe(1);
    const bad = schema.validate({ name: "" });
    expect(bad.issues?.[0]).toEqual({ message: "required", path: ["name"] });
    const good = schema.validate({ name: "Sara", terms: true });
    expect(good.issues).toBeUndefined();
  });
});
