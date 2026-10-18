import type { Expression } from "@formweave/schema";
import { OPERATORS } from "@formweave/schema";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { evalExpression, MAX_EXPRESSION_DEPTH, readsFields, truthy } from "./expr.js";

const values: Record<string, unknown> = {
  plan: "team",
  seats: 12,
  price: "2.5",
  tags: ["a", "b"],
  name: "",
  none: null,
};
const read = (k: string): unknown => values[k];
const ev = (e: Expression): unknown => evalExpression(e, read);
const v = (k: string): Expression => ({ var: k });

describe("evalExpression", () => {
  it("returns literals and field values", () => {
    expect(ev(3)).toBe(3);
    expect(ev(null)).toBe(null);
    expect(ev(v("plan"))).toBe("team");
    expect(ev(v("missing"))).toBe(undefined);
  });

  it("compares with number coercion from text", () => {
    expect(ev({ op: "eq", args: [v("plan"), "team"] })).toBe(true);
    expect(ev({ op: "eq", args: [v("price"), 2.5] })).toBe(true);
    expect(ev({ op: "gt", args: [v("seats"), 10] })).toBe(true);
    expect(ev({ op: "lte", args: [v("seats"), 11] })).toBe(false);
    expect(ev({ op: "lt", args: ["a", "b"] })).toBe(true);
    expect(ev({ op: "gt", args: [true, 1] })).toBe(false);
  });

  it("treats null and a missing value as equal", () => {
    expect(ev({ op: "eq", args: [v("missing"), null] })).toBe(true);
  });

  it("checks list membership", () => {
    expect(ev({ op: "in", args: ["b", v("tags")] })).toBe(true);
    expect(ev({ op: "in", args: [v("plan"), "free", "team"] })).toBe(true);
    expect(ev({ op: "in", args: ["c", v("tags")] })).toBe(false);
  });

  it("short-circuits and, or and if", () => {
    let reads = 0;
    const counting = (k: string): unknown => {
      reads++;
      return values[k];
    };
    evalExpression({ op: "and", args: [false, v("plan")] }, counting);
    evalExpression({ op: "or", args: [true, v("plan")] }, counting);
    evalExpression({ op: "if", args: [true, 1, v("plan")] }, counting);
    expect(reads).toBe(0);
  });

  it("does math and returns null on bad input", () => {
    expect(ev({ op: "mul", args: [v("seats"), v("price")] })).toBe(30);
    expect(ev({ op: "div", args: [1, 0] })).toBe(null);
    expect(ev({ op: "add", args: [1, "x"] })).toBe(null);
    expect(ev({ op: "round", args: [2.345, 2] })).toBe(2.35);
    expect(ev({ op: "max", args: [v("seats"), 3, "x"] })).toBe(12);
  });

  it("handles text and presence", () => {
    expect(ev({ op: "concat", args: ["n=", v("seats"), v("none")] })).toBe("n=12");
    expect(ev({ op: "len", args: [v("tags")] })).toBe(2);
    expect(ev({ op: "empty", args: [v("name")] })).toBe(true);
    expect(ev({ op: "notEmpty", args: [v("tags")] })).toBe(true);
  });

  it("stops at the depth limit instead of overflowing", () => {
    let e: Expression = 1;
    for (let i = 0; i < MAX_EXPRESSION_DEPTH * 10; i++) e = { op: "not", args: [e] };
    expect(() => ev(e)).not.toThrow();
  });

  it("never throws, whatever the expression and values", () => {
    const literal = fc.oneof(fc.string(), fc.double(), fc.boolean(), fc.constant(null));
    const expr = fc.letrec<{ e: Expression }>((tie) => ({
      e: fc.oneof(
        { depthSize: "small" },
        literal,
        fc.record({ var: fc.constantFrom("plan", "seats", "price", "tags", "none", "x") }),
        fc.record({
          op: fc.constantFrom(...OPERATORS),
          args: fc.array(tie("e"), { maxLength: 4 }),
        }),
      ),
    })).e;
    fc.assert(
      fc.property(expr, fc.dictionary(fc.string(), fc.anything()), (e, vals) => {
        evalExpression(e, (k) => vals[k] ?? values[k]);
      }),
    );
  });

  it("ignores operators outside the allow-list", () => {
    expect(ev({ op: "constructor", args: [] } as unknown as Expression)).toBe(null);
  });
});

describe("readsFields", () => {
  it("lists each key once", () => {
    expect(
      readsFields({ op: "and", args: [v("a"), { op: "eq", args: [v("b"), v("a")] }] }),
    ).toEqual(["a", "b"]);
    expect(readsFields(undefined)).toEqual([]);
  });
});

describe("truthy", () => {
  it("treats empty lists as false", () => {
    expect([[], "", 0, null, undefined, Number.NaN].some(truthy)).toBe(false);
    expect([[0], "0", 1, true].every(truthy)).toBe(true);
  });
});
