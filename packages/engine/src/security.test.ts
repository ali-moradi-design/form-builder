import type { FormDocument } from "@formcanvas/schema";
import { describe, expect, it } from "vitest";
import { allFields } from "./fields/all.js";
import { compile, createRegistry, evalExpression, MAX_TEXT_LENGTH, validate } from "./index.js";
import { inferFields } from "./infer.js";

const registry = createRegistry(allFields);
const form = (fields: FormDocument["steps"][number]["fields"]) =>
  compile(
    {
      schemaVersion: 1,
      id: "x",
      title: "x",
      locales: { default: "en" },
      steps: [{ key: "s", fields }],
    },
    { registry },
  );
const quick = (fn: () => unknown, ms = 250) => {
  const t = Date.now();
  fn();
  expect(Date.now() - t).toBeLessThan(ms);
};

describe("hostile documents and values", () => {
  it("caps text built by chained calculated fields", () => {
    const chain = form([
      { type: "shortText", key: "a" },
      ...Array.from({ length: 40 }, (_, i) => ({
        type: "calculated",
        key: `c${String(i)}`,
        calculate: {
          op: "concat" as const,
          args: [{ var: i ? `c${String(i - 1)}` : "a" }, { var: i ? `c${String(i - 1)}` : "a" }],
        },
      })),
    ]);
    quick(() => {
      const result = validate(chain, { a: "xxxxxxxx" });
      expect(result.success).toBe(true);
      if (result.success) expect(String(result.data.c39)).toHaveLength(MAX_TEXT_LENGTH);
    });
  });

  it("caps concat of long lists", () => {
    const long = Array.from({ length: 50_000 }, () => "word");
    const out = evalExpression({ op: "concat", args: [{ var: "t" }, { var: "t" }] }, () => long);
    expect(String(out).length).toBeLessThanOrEqual(MAX_TEXT_LENGTH);
  });

  it("checks long URLs in linear time", () => {
    const f = form([{ type: "url", key: "u" }]);
    for (const value of [
      `http://${"a.".repeat(40_000)} `,
      `https://${"a".repeat(60_000)}`,
      `http://a.${"b.".repeat(30_000)}c:${"1".repeat(1000)}`,
    ])
      quick(() => {
        expect(validate(f, { u: value }).success).toBe(false);
      });
    expect(validate(f, { u: "https://example.com/a?b=1#c" }).success).toBe(true);
    expect(validate(f, { u: "http://127.0.0.1:8080" }).success).toBe(true);
  });

  it("checks long emails and phones in linear time", () => {
    const f = form([
      { type: "email", key: "e" },
      { type: "phone", key: "p" },
    ]);
    quick(() => {
      validate(f, { e: `a@${"a.".repeat(30_000)}!`, p: `+1${"2".repeat(60_000)}` });
    });
  });

  it("infers from hostile sample values in linear time", () => {
    quick(() =>
      inferFields({ a: `a@${"a.".repeat(40_000)}!`, b: `http://${"x".repeat(60_000)} ` }),
    );
  });

  it("never reaches Object.prototype through keys or operators", () => {
    expect(evalExpression({ op: "constructor" as never, args: [] }, () => 1)).toBeNull();
    expect(evalExpression({ op: "__proto__" as never, args: [] }, () => 1)).toBeNull();
    const f = form([{ type: "shortText", key: "name" }]);
    const values = JSON.parse('{"name":"Sara","__proto__":{"polluted":true}}') as Record<
      string,
      unknown
    >;
    const result = validate(f, values);
    expect(result.success && Object.keys(result.data)).toEqual(["name"]);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("choice values", () => {
  it("accepts numbers and booleans as their option text", () => {
    const f = form([
      {
        type: "select",
        key: "c",
        settings: {
          options: [
            { value: "2", label: "Two" },
            { value: "true", label: "Yes" },
          ],
        },
      },
    ]);
    expect(validate(f, { c: 2 })).toEqual({ success: true, data: { c: "2" } });
    expect(validate(f, { c: true })).toEqual({ success: true, data: { c: "true" } });
    expect(validate(f, { c: 3 }).success).toBe(false);
    expect(validate(f, { c: { toString: "2" } }).success).toBe(false);
  });
});
