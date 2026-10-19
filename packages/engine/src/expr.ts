import type { Call, Expression, Operator } from "@formweave/schema";

/**
 * Reads the current value of a field by its key. Returns `undefined` for an
 * unknown key or an empty field.
 *
 * @since 0.1.0
 */
export type ValueReader = (key: string) => unknown;

/**
 * Deepest nesting {@link evalExpression} follows. Deeper parts evaluate to
 * `null`, so a hostile document cannot overflow the stack.
 *
 * @since 0.1.0
 */
export const MAX_EXPRESSION_DEPTH = 64;

/**
 * Longest text an expression can build (`concat`). Calculated fields can read
 * each other, so without a cap a chain of them could double a text at every
 * step and exhaust memory.
 *
 * @since 0.7.0
 */
export const MAX_TEXT_LENGTH = 10_000;

/**
 * Truthiness used by `and`, `or`, `not`, `if` and conditions such as
 * `visibleWhen`: `null`, `undefined`, `false`, `0`, `NaN`, `""` and `[]` are
 * false; everything else is true.
 *
 * @param value - Any value.
 * @returns Whether the value counts as true.
 * @since 0.1.0
 */
export function truthy(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

const num = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const same = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
  const na = num(a);
  const nb = num(b);
  if (typeof a !== typeof b && na !== null && nb !== null) return na === nb;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => same(x, b[i]));
  }
  return false;
};

const order = (a: unknown, b: unknown): number | null => {
  const na = num(a);
  const nb = num(b);
  if (na !== null && nb !== null) return na - nb;
  if (typeof a === "string" && typeof b === "string") return a < b ? -1 : a > b ? 1 : 0;
  return null;
};

const arith = (vals: unknown[], f: (a: number, b: number) => number): number | null => {
  const nums = vals.map(num);
  if (nums.length === 0 || nums.some((n) => n === null)) return null;
  const out = (nums as number[]).reduce(f);
  return Number.isFinite(out) ? out : null;
};

const text = (v: unknown): string => {
  if (Array.isArray(v)) return v.map(text).join(", ").slice(0, MAX_TEXT_LENGTH);
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
};

// Arguments of a call, or an empty list when the input is malformed.
const argsOf = (call: Call): readonly Expression[] =>
  Array.isArray(call.args) ? (call.args as readonly Expression[]) : [];

type Lazy = (i: number) => unknown;

const OPS: Readonly<Record<Operator, (arg: Lazy, n: number) => unknown>> = {
  and: (arg, n) => {
    for (let i = 0; i < n; i++) if (!truthy(arg(i))) return false;
    return true;
  },
  or: (arg, n) => {
    for (let i = 0; i < n; i++) if (truthy(arg(i))) return true;
    return false;
  },
  not: (arg) => !truthy(arg(0)),
  if: (arg) => (truthy(arg(0)) ? arg(1) : arg(2)),
  eq: (arg) => same(arg(0), arg(1)),
  neq: (arg) => !same(arg(0), arg(1)),
  gt: (arg) => {
    const o = order(arg(0), arg(1));
    return o !== null && o > 0;
  },
  gte: (arg) => {
    const o = order(arg(0), arg(1));
    return o !== null && o >= 0;
  },
  lt: (arg) => {
    const o = order(arg(0), arg(1));
    return o !== null && o < 0;
  },
  lte: (arg) => {
    const o = order(arg(0), arg(1));
    return o !== null && o <= 0;
  },
  in: (arg, n) => {
    const needle = arg(0);
    const hay = n === 2 ? arg(1) : Array.from({ length: n - 1 }, (_, i) => arg(i + 1));
    if (Array.isArray(hay)) return hay.some((x) => same(x, needle));
    if (typeof hay === "string" && typeof needle === "string") return hay.includes(needle);
    return false;
  },
  empty: (arg) => isEmpty(arg(0)),
  notEmpty: (arg) => !isEmpty(arg(0)),
  add: (arg, n) => arith(all(arg, n), (a, b) => a + b),
  sub: (arg, n) => arith(all(arg, n), (a, b) => a - b),
  mul: (arg, n) => arith(all(arg, n), (a, b) => a * b),
  div: (arg, n) => arith(all(arg, n), (a, b) => a / b),
  mod: (arg, n) => arith(all(arg, n), (a, b) => a % b),
  min: (arg, n) => pick(all(arg, n), Math.min),
  max: (arg, n) => pick(all(arg, n), Math.max),
  round: (arg) => {
    const x = num(arg(0));
    const digits = Math.min(Math.max(Math.trunc(num(arg(1)) ?? 0), 0), 10);
    if (x === null) return null;
    const f = 10 ** digits;
    return Math.round(x * f) / f;
  },
  concat: (arg, n) => {
    let out = "";
    for (let i = 0; i < n && out.length < MAX_TEXT_LENGTH; i++) out += text(arg(i));
    return out.slice(0, MAX_TEXT_LENGTH);
  },
  len: (arg) => {
    const v = arg(0);
    return typeof v === "string" || Array.isArray(v) ? v.length : 0;
  },
};

function all(arg: Lazy, n: number): unknown[] {
  return Array.from({ length: n }, (_, i) => arg(i));
}

function pick(vals: unknown[], f: (...xs: number[]) => number): number | null {
  const nums = vals
    .flat()
    .map(num)
    .filter((x): x is number => x !== null);
  return nums.length ? f(...nums) : null;
}

function run(expr: Expression, read: ValueReader, depth: number): unknown {
  if (depth > MAX_EXPRESSION_DEPTH) return null;
  if (expr === null || typeof expr !== "object") return expr;
  if ("var" in expr) return read(expr.var);
  const name: string = expr.op;
  // Own properties only: a name such as "constructor" must not reach Object.prototype.
  if (!Object.hasOwn(OPS, name) || !Array.isArray(expr.args)) return null;
  const op = OPS[name as Operator];
  const args = argsOf(expr);
  const arg: Lazy = (i) =>
    i < args.length ? run(args[i] as Expression, read, depth + 1) : undefined;
  return op(arg, args.length);
}

/**
 * Evaluates an `Expression` (from `@formweave/schema`) against the current form values.
 *
 * Total and safe: it never throws and never runs code. Operators with bad
 * input return `null` (for example dividing by zero, or adding text to a
 * number), comparisons between values that cannot be ordered are `false`,
 * and `and`, `or` and `if` only evaluate the arguments they need.
 *
 * @param expr - The expression, usually from a form document.
 * @param read - Returns the value of a field by its key.
 * @returns The result: a string, number, boolean, `null`, or a value read from a field.
 * @example
 * ```ts
 * const values = { quantity: 3, price: 12.5 };
 * evalExpression({ op: "mul", args: [{ var: "quantity" }, { var: "price" }] }, (k) => values[k]);
 * // 37.5
 * ```
 * @since 0.1.0
 */
export function evalExpression(expr: Expression, read: ValueReader): unknown {
  return run(expr, read, 0);
}

/**
 * Lists the field keys an expression reads, without duplicates, in the order
 * they first appear. The engine uses this to build its dependency graph.
 *
 * @param expr - The expression to scan; `undefined` gives an empty list.
 * @returns The keys of every `{ "var": … }` in the expression.
 * @since 0.1.0
 */
export function readsFields(expr: Expression | undefined): string[] {
  const out = new Set<string>();
  const walk = (e: Expression, depth: number): void => {
    if (depth > MAX_EXPRESSION_DEPTH || e === null || typeof e !== "object") return;
    if ("var" in e) {
      out.add(e.var);
      return;
    }
    for (const a of argsOf(e)) walk(a, depth + 1);
  };
  if (expr !== undefined) walk(expr, 0);
  return [...out];
}
