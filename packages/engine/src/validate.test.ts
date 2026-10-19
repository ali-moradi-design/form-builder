import type { FormDocument } from "@formweave/schema";
import { describe, expect, it } from "vitest";
import { compile } from "./compile.js";
import { allFields } from "./fields/all.js";
import { createRegistry } from "./registry.js";
import { calculateValues } from "./calculate.js";
import { evaluate } from "./evaluate.js";
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

  it("passes the limits of refinements on to the message", () => {
    const ranged = compile(
      {
        ...doc,
        steps: [
          {
            key: "a",
            fields: [{ type: "rangeSlider", key: "r", settings: { min: 5, max: 50 } }],
          },
        ],
      },
      { registry: createRegistry(allFields) },
    );
    const r = validate(ranged, { r: { from: 1, to: 10 } });
    expect(r.success ? [] : r.issues).toEqual([{ key: "r", code: "tooSmall", params: { min: 5 } }]);
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

describe("repeater", () => {
  const trip = compile(
    {
      ...doc,
      steps: [
        {
          key: "a",
          fields: [
            {
              type: "repeater",
              key: "people",
              required: true,
              settings: { minRows: 1, maxRows: 3 },
              fields: [
                { type: "shortText", key: "name", required: true },
                { type: "number", key: "age", settings: { min: 0 } },
                {
                  type: "shortText",
                  key: "school",
                  visibleWhen: { op: "lt", args: [{ var: "age" }, 18] },
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
    { registry: createRegistry(allFields) },
  );

  it("starts with the fewest rows and keeps children out of the outer form", () => {
    expect(trip.defaults).toEqual({ people: [{}] });
    expect(trip.order).toEqual(["people"]);
    expect(trip.fields.get("people")?.rows?.order).toEqual(["name", "age", "school"]);
  });

  it("checks every row with conditions read inside the row", () => {
    const r = validate(trip, {
      people: [
        { name: "Sara", age: 34, school: "ignored" },
        { name: "", age: 9 },
      ],
    });
    expect(r.success ? [] : r.issues).toEqual([
      { key: "people.1.name", code: "required" },
      { key: "people.1.school", code: "required" },
    ]);
    const ok = validate(trip, {
      people: [
        { name: "Sara", age: 34, school: "ignored" },
        { name: "Nima", age: 9, school: "Saadi" },
      ],
    });
    expect(ok).toEqual({
      success: true,
      data: {
        people: [
          { name: "Sara", age: 34 },
          { name: "Nima", age: 9, school: "Saadi" },
        ],
      },
    });
  });

  it("checks the number of rows", () => {
    const r = validate(trip, {
      people: [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }],
    });
    expect(r.success ? [] : r.issues).toEqual([
      { key: "people", code: "tooManyRows", params: { max: 3 } },
    ]);
    const none = validate(trip, { people: [] });
    expect(none.success ? [] : none.issues).toEqual([{ key: "people", code: "required" }]);
  });
});

describe("calculated fields", () => {
  const order = compile(
    {
      ...doc,
      steps: [
        {
          key: "a",
          fields: [
            { type: "number", key: "quantity" },
            { type: "number", key: "price" },
            {
              type: "calculated",
              key: "total",
              calculate: { op: "mul", args: [{ var: "subtotal" }, 1.1] },
            },
            {
              type: "calculated",
              key: "subtotal",
              calculate: { op: "mul", args: [{ var: "quantity" }, { var: "price" }] },
            },
            {
              type: "shortText",
              key: "approver",
              requiredWhen: { op: "gt", args: [{ var: "total" }, 100] },
            },
          ],
        },
      ],
    },
    { registry: createRegistry(allFields) },
  );

  it("works out values in dependency order and ignores sent values", () => {
    expect(order.calculated).toEqual(["subtotal", "total"]);
    expect(calculateValues(order, { quantity: 3, price: 0.1 })).toMatchObject({
      subtotal: 0.3,
      total: 0.33,
    });
    const r = validate(order, { quantity: 2, price: 5, total: 999 });
    expect(r).toEqual({
      success: true,
      data: { quantity: 2, price: 5, subtotal: 10, total: 11 },
    });
  });

  it("lets conditions read results and updates them incrementally", () => {
    const first = evaluate(order, { quantity: 1, price: 5 });
    expect(first.fields.approver?.required).toBe(false);
    expect(first.fields.total?.disabled).toBe(true);
    const next = evaluate(
      order,
      { quantity: 100, price: 5 },
      { previous: first, changed: ["quantity"] },
    );
    expect(next.fields.approver?.required).toBe(true);
  });

  it("rejects fields calculated from themselves", () => {
    expect(() =>
      compile(
        {
          ...doc,
          steps: [
            {
              key: "a",
              fields: [
                { type: "calculated", key: "x", calculate: { op: "add", args: [{ var: "y" }, 1] } },
                { type: "calculated", key: "y", calculate: { op: "add", args: [{ var: "x" }, 1] } },
              ],
            },
          ],
        },
        { registry: createRegistry(allFields) },
      ),
    ).toThrow(/calculated from itself/);
  });
});
