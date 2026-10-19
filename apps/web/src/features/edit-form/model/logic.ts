import type { Expression, Operator } from "@formweave/schema";

// The logic editor edits conditions as a tree of groups and comparisons and
// stores them as expressions. Only shapes the editor can show are read back;
// anything else is left to the JSON panel.

/** Comparisons the editor offers. */
export const COMPARISONS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "includes",
  "notEmpty",
  "empty",
] as const;

/** One comparison of the editor. `includes` reads "the list contains". */
export type Comparison = (typeof COMPARISONS)[number];

/** Comparisons that need no value. */
export const NO_VALUE: ReadonlySet<Comparison> = new Set(["empty", "notEmpty"]);

/** A field compared with a value. */
export interface Condition {
  readonly kind: "condition";
  readonly field: string;
  readonly op: Comparison;
  readonly value: string | number | boolean;
}

/** Conditions joined with "all" (and) or "any" (or). */
export interface Group {
  readonly kind: "group";
  readonly mode: "and" | "or";
  readonly items: readonly (Condition | Group)[];
}

const isVar = (e: Expression): e is { var: string } =>
  e !== null && typeof e === "object" && !Array.isArray(e) && "var" in e;
const isValue = (e: Expression): e is string | number | boolean =>
  typeof e === "string" || typeof e === "number" || typeof e === "boolean";

function readCondition(e: Expression): Condition | undefined {
  if (e === null || typeof e !== "object" || Array.isArray(e) || !("op" in e)) return undefined;
  const [a, b] = e.args;
  if ((e.op === "empty" || e.op === "notEmpty") && e.args.length === 1 && a && isVar(a))
    return { kind: "condition", field: a.var, op: e.op, value: "" };
  if (e.args.length !== 2 || a === undefined || b === undefined) return undefined;
  // "list contains value" is stored as { in: [value, { var }] }.
  if (e.op === "in" && isValue(a) && isVar(b))
    return { kind: "condition", field: b.var, op: "includes", value: a };
  if (["eq", "neq", "gt", "gte", "lt", "lte"].includes(e.op) && isVar(a) && isValue(b))
    return { kind: "condition", field: a.var, op: e.op as Comparison, value: b };
  return undefined;
}

/**
 * Reads an expression into an editor tree: always a group at the top.
 * Returns `undefined` for shapes the editor cannot show.
 */
export function fromExpression(expr: Expression | undefined): Group | undefined {
  if (expr === undefined) return { kind: "group", mode: "and", items: [] };
  const read = (e: Expression): Condition | Group | undefined => {
    if (e !== null && typeof e === "object" && !Array.isArray(e) && "op" in e) {
      if (e.op === "and" || e.op === "or") {
        const items = e.args.map(read);
        if (items.some((i) => i === undefined)) return undefined;
        return { kind: "group", mode: e.op, items: items as (Condition | Group)[] };
      }
    }
    return readCondition(e);
  };
  const top = read(expr);
  if (!top) return undefined;
  return top.kind === "group" ? top : { kind: "group", mode: "and", items: [top] };
}

/**
 * Turns an editor tree into an expression. Empty groups disappear; a group
 * of one item becomes that item. Returns `undefined` when nothing is left.
 */
export function toExpression(node: Condition | Group): Expression | undefined {
  if (node.kind === "condition") {
    if (!node.field) return undefined;
    const v = { var: node.field };
    if (node.op === "empty" || node.op === "notEmpty") return { op: node.op, args: [v] };
    if (node.op === "includes") return { op: "in", args: [node.value, v] };
    return { op: node.op as Operator, args: [v, node.value] };
  }
  const args = node.items.map(toExpression).filter((e): e is Expression => e !== undefined);
  if (args.length === 0) return undefined;
  if (args.length === 1) return args[0];
  return { op: node.mode, args };
}

/** Replaces the item at `path` (indexes from the top group) with `next`, or removes it. */
export function setAt(
  group: Group,
  path: readonly number[],
  next: Condition | Group | undefined,
): Group {
  const [head, ...rest] = path;
  if (head === undefined) return group;
  const items = [...group.items];
  if (rest.length === 0) {
    if (next === undefined) items.splice(head, 1);
    else items[head] = next;
  } else {
    const child = items[head];
    if (child?.kind !== "group") return group;
    items[head] = setAt(child, rest, next);
  }
  return { ...group, items };
}
