import type { Expression } from "@formweave/schema";
import { describe, expect, it } from "vitest";
import { fromExpression, setAt, toExpression, type Group } from "./logic";

const nested: Expression = {
  op: "and",
  args: [
    { op: "eq", args: [{ var: "type" }, "contract"] },
    {
      op: "or",
      args: [
        { op: "gte", args: [{ var: "years" }, 3] },
        { op: "notEmpty", args: [{ var: "portfolio" }] },
        { op: "in", args: ["logic", { var: "features" }] },
      ],
    },
  ],
};

describe("logic tree", () => {
  it("round-trips nested groups", () => {
    const tree = fromExpression(nested);
    expect(tree?.items).toHaveLength(2);
    expect(tree && toExpression(tree)).toEqual(nested);
  });

  it("wraps a single condition and unwraps groups of one", () => {
    const one = { op: "eq", args: [{ var: "plan" }, "team"] } as const;
    const tree = fromExpression(one) as Group;
    expect(tree).toEqual({
      kind: "group",
      mode: "and",
      items: [{ kind: "condition", field: "plan", op: "eq", value: "team" }],
    });
    expect(toExpression(tree)).toEqual(one);
    expect(toExpression({ kind: "group", mode: "or", items: [] })).toBeUndefined();
  });

  it("leaves shapes it cannot show to the JSON panel", () => {
    expect(fromExpression({ op: "gt", args: [{ op: "add", args: [1, 2] }, 2] })).toBeUndefined();
  });

  it("edits and removes items by path", () => {
    const tree = fromExpression(nested) as Group;
    const without = setAt(tree, [1, 0], undefined);
    expect((without.items[1] as Group).items).toHaveLength(2);
    expect(setAt(tree, [0], undefined).items).toHaveLength(1);
  });
});
