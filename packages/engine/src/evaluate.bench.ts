import type { FieldNode, FormDocument } from "@formweave/schema";
import { expect, test } from "vitest";
import { compile } from "./compile.js";
import { evaluate } from "./evaluate.js";
import { allFields } from "./fields/all.js";
import { createRegistry } from "./registry.js";
import { validate } from "./validate.js";

// Budgets from docs/architecture.md: compile < 5 ms, evaluate after one change < 0.5 ms.
const plan = { op: "eq", args: [{ var: "plan" }, "team"] } as const;
const fields: FieldNode[] = [
  { type: "radio", key: "plan", settings: { options: [{ value: "free" }, { value: "team" }] } },
];
for (let i = 0; i < 499; i++) {
  fields.push({
    type: i % 3 ? "shortText" : "number",
    key: `f${String(i)}`,
    visibleWhen: i % 10 === 0 ? plan : undefined,
    required: i % 7 === 0,
  });
}
const doc: FormDocument = {
  schemaVersion: 1,
  id: "bench",
  title: "Bench",
  locales: { default: "en" },
  steps: [{ key: "main", fields }],
};
const registry = createRegistry(allFields);
const form = compile(doc, { registry });
const values: Record<string, unknown> = { plan: "free" };
let state = evaluate(form, values);

test("500 fields stay within the budgets", async ({ bench }) => {
  const result = await bench.compare(
    bench("compile", () => {
      compile(doc, { registry });
    }),
    bench("evaluate, full", () => {
      evaluate(form, values);
    }),
    bench("evaluate, one changed value", () => {
      values.plan = values.plan === "team" ? "free" : "team";
      state = evaluate(form, values, { previous: state, changed: ["plan"] });
    }),
    bench("validate", () => {
      validate(form, values, { state });
    }),
  );
  // Throughput is in operations per second.
  expect(result.get("compile").throughput.mean).toBeGreaterThan(200);
  expect(result.get("evaluate, one changed value").throughput.mean).toBeGreaterThan(2000);
});
