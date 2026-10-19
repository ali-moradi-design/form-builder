import { describe, expect, it } from "vitest";
import { parseFormula, printFormula } from "./formula";

const keys = new Set(["quantity", "price", "discount", "name"]);

describe("formula", () => {
  it("reads arithmetic with precedence, chains and parentheses", () => {
    expect(parseFormula("quantity * price + 5", keys)).toEqual({
      expr: {
        op: "add",
        args: [{ op: "mul", args: [{ var: "quantity" }, { var: "price" }] }, 5],
      },
    });
    expect(parseFormula("(1 + 2 + 3) × -price", keys)).toEqual({
      expr: {
        op: "mul",
        args: [
          { op: "add", args: [1, 2, 3] },
          { op: "sub", args: [0, { var: "price" }] },
        ],
      },
    });
    expect(parseFormula("round(price ÷ ۳, 2)", keys)).toEqual({
      expr: { op: "round", args: [{ op: "div", args: [{ var: "price" }, 3] }, 2] },
    });
  });

  it("says where a formula is wrong", () => {
    expect(parseFormula("quantity * cost", keys)).toEqual({
      error: { code: "unknownField", at: 11, name: "cost" },
    });
    expect(parseFormula("sum(price)", keys)).toEqual({
      error: { code: "unknownFunction", at: 0, name: "sum" },
    });
    expect(parseFormula("price *", keys)).toEqual({ error: { code: "syntax", at: 7 } });
    expect(parseFormula("  ", keys)).toEqual({ error: { code: "empty", at: 0 } });
  });

  it("prints what it reads", () => {
    for (const text of [
      "quantity * price + 5",
      "(quantity + 1) * price",
      "price - (discount - 1)",
      "round(price / 3, 2)",
      'concat(name, "!")',
    ]) {
      const parsed = parseFormula(text, keys);
      expect("expr" in parsed && printFormula(parsed.expr)).toBe(text);
    }
    expect(printFormula({ op: "eq", args: [1, 1] })).toBeUndefined();
  });
});
