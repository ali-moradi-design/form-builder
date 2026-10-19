import type { CompiledForm } from "./compile.js";
import { evalExpression } from "./expr.js";

// Drops float noise such as 0.30000000000000004.
const tidy = (v: unknown): unknown => {
  if (typeof v !== "number") return v ?? undefined;
  return Number.isFinite(v) ? Math.round(v * 1e9) / 1e9 : undefined;
};

/**
 * Returns the values with every calculated field (a field with `calculate`)
 * set from its expression. A result that is not a finite number, text or
 * yes/no leaves the field empty. The input is not changed; when the form has
 * no calculated fields it is returned as is.
 *
 * `evaluate` and `validate` call this themselves, so a value sent for a
 * calculated field is always replaced.
 *
 * @param form - A compiled form.
 * @param values - Current values by field key.
 * @returns The values with calculated fields filled in.
 * @example
 * ```ts
 * calculateValues(form, { quantity: 3, price: 2.5 }).total; // 7.5
 * ```
 * @since 0.6.0
 */
export function calculateValues(
  form: CompiledForm,
  values: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  if (form.calculated.length === 0) return values;
  const out: Record<string, unknown> = { ...values };
  for (const key of form.calculated) {
    const expr = form.fields.get(key)?.node.calculate;
    if (expr === undefined) continue;
    out[key] = tidy(evalExpression(expr, (k) => out[k]));
  }
  return out;
}
