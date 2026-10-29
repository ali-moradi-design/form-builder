import { normalizeDigits } from "@formcanvas/engine/i18n";
import type { Expression, Operator } from "@formcanvas/schema";

// A small infix syntax for calculated fields, so people can type
// `quantity * price + 5` instead of writing expression JSON:
//
//   sum     := product (("+" | "-") product)*
//   product := unary (("*" | "/" | "%") unary)*
//   unary   := "-" unary | atom
//   atom    := number | "text" | key | fn "(" sum ("," sum)* ")" | "(" sum ")"
//
// × and ÷ work as * and /; Persian and Arabic-Indic digits are accepted.

/** Functions a formula may call, mapped to expression operators. */
const FUNCTIONS: Readonly<Record<string, Operator>> = {
  min: "min",
  max: "max",
  round: "round",
  len: "len",
  concat: "concat",
};

const BINARY: Readonly<Record<string, Operator>> = {
  "+": "add",
  "-": "sub",
  "*": "mul",
  "/": "div",
  "%": "mod",
};

/** Why a formula could not be read, with the position of the problem. */
export interface FormulaError {
  readonly code: "syntax" | "unknownField" | "unknownFunction" | "empty";
  /** Offset in the text where the problem starts. */
  readonly at: number;
  /** The field or function name, for unknown names. */
  readonly name?: string;
}

type Token =
  | { kind: "num"; value: number; at: number }
  | { kind: "str"; value: string; at: number }
  | { kind: "name"; value: string; at: number }
  | { kind: "op"; value: string; at: number };

function tokenize(source: string): Token[] | FormulaError {
  const text = normalizeDigits(source).replaceAll("×", "*").replaceAll("÷", "/");
  const out: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text.charAt(i);
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    const num = /^\d+(\.\d+)?/.exec(text.slice(i));
    if (num) {
      out.push({ kind: "num", value: Number(num[0]), at: i });
      i += num[0].length;
      continue;
    }
    const name = /^[A-Za-z_]\w*/.exec(text.slice(i));
    if (name) {
      out.push({ kind: "name", value: name[0], at: i });
      i += name[0].length;
      continue;
    }
    if (c === '"') {
      const end = text.indexOf('"', i + 1);
      if (end < 0) return { code: "syntax", at: i };
      out.push({ kind: "str", value: text.slice(i + 1, end), at: i });
      i = end + 1;
      continue;
    }
    if ("+-*/%(),".includes(c)) {
      out.push({ kind: "op", value: c, at: i });
      i++;
      continue;
    }
    return { code: "syntax", at: i };
  }
  return out;
}

class Fail extends Error {
  constructor(readonly error: FormulaError) {
    super(error.code);
  }
}

/**
 * Reads a formula such as `quantity * price` into an expression.
 *
 * @param source - The formula text.
 * @param keys - Field keys the formula may read.
 * @returns The expression, or where and why it could not be read.
 */
export function parseFormula(
  source: string,
  keys: ReadonlySet<string>,
): { readonly expr: Expression } | { readonly error: FormulaError } {
  const tokens = tokenize(source);
  if (!Array.isArray(tokens)) return { error: tokens };
  if (tokens.length === 0) return { error: { code: "empty", at: 0 } };
  let pos = 0;
  const peek = (): Token | undefined => tokens[pos];
  const end = source.length;
  const fail = (code: FormulaError["code"], at = peek()?.at ?? end, name?: string): never => {
    throw new Fail(name === undefined ? { code, at } : { code, at, name });
  };
  const isOp = (value: string): boolean => {
    const t = peek();
    return t?.kind === "op" && t.value === value;
  };
  const expect = (value: string): void => {
    if (!isOp(value)) fail("syntax");
    pos++;
  };

  // Joins a chain of the same operator into one call: a + b + c → add(a, b, c).
  const chain = (ops: string, next: () => Expression): Expression => {
    let left = next();
    for (;;) {
      const t = peek();
      if (t?.kind !== "op" || !ops.includes(t.value)) return left;
      pos++;
      const op = BINARY[t.value] as Operator;
      const right = next();
      left =
        left !== null && typeof left === "object" && "op" in left && left.op === op
          ? { op, args: [...left.args, right] }
          : { op, args: [left, right] };
    }
  };
  const sum = (): Expression => chain("+-", product);
  const product = (): Expression => chain("*/%", unary);
  const unary = (): Expression => {
    if (isOp("-")) {
      pos++;
      const inner = unary();
      return typeof inner === "number" ? -inner : { op: "sub", args: [0, inner] };
    }
    return atom();
  };
  const atom = (): Expression => {
    const t = peek();
    if (!t) return fail("syntax");
    pos++;
    if (t.kind === "num" || t.kind === "str") return t.value;
    if (t.kind === "op") {
      if (t.value !== "(") return fail("syntax", t.at);
      const inner = sum();
      expect(")");
      return inner;
    }
    if (isOp("(")) {
      const op = FUNCTIONS[t.value];
      if (!op) return fail("unknownFunction", t.at, t.value);
      pos++;
      const args = [sum()];
      while (isOp(",")) {
        pos++;
        args.push(sum());
      }
      expect(")");
      return { op, args };
    }
    if (!keys.has(t.value)) return fail("unknownField", t.at, t.value);
    return { var: t.value };
  };

  try {
    const expr = sum();
    if (pos < tokens.length) fail("syntax");
    return { expr };
  } catch (e) {
    if (e instanceof Fail) return { error: e.error };
    throw e;
  }
}

const PRECEDENCE: Partial<Record<Operator, number>> = { add: 1, sub: 1, mul: 2, div: 2, mod: 2 };
const SYMBOL: Partial<Record<Operator, string>> = {
  add: "+",
  sub: "-",
  mul: "*",
  div: "/",
  mod: "%",
};

/**
 * Writes an expression back as formula text. Expressions that the formula
 * syntax cannot show (conditions, for example) return `undefined`.
 *
 * @param expr - The expression.
 * @returns The formula, or `undefined`.
 */
export function printFormula(expr: Expression): string | undefined {
  const print = (e: Expression, outer: number): string | undefined => {
    if (typeof e === "number") return e < 0 && outer > 0 ? `(${String(e)})` : String(e);
    if (typeof e === "string") return e.includes('"') ? undefined : `"${e}"`;
    if (e === null || typeof e === "boolean" || Array.isArray(e)) return undefined;
    if ("var" in e) return e.var;
    const level = PRECEDENCE[e.op];
    const symbol = SYMBOL[e.op];
    if (level !== undefined && symbol !== undefined) {
      const parts = e.args.map((a, i) => print(a, i === 0 ? level : level + 0.5));
      if (parts.some((p) => p === undefined)) return undefined;
      const text = parts.join(` ${symbol} `);
      return level < outer ? `(${text})` : text;
    }
    if (Object.values(FUNCTIONS).includes(e.op)) {
      const parts = e.args.map((a) => print(a, 0));
      if (parts.some((p) => p === undefined)) return undefined;
      return `${e.op}(${parts.join(", ")})`;
    }
    return undefined;
  };
  return print(expr, 0);
}
