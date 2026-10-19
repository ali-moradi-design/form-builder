import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * Settings of {@link currency}.
 *
 * @since 0.6.0
 */
export interface CurrencySettings {
  /**
   * ISO 4217 code, for example `"EUR"` or `"IRR"`.
   *
   * @defaultValue `"USD"`
   */
  readonly currency?: string | undefined;
  /** Smallest allowed amount. */
  readonly min?: number | undefined;
  /** Largest allowed amount. */
  readonly max?: number | undefined;
}

/**
 * Number of digits after the decimal point that `code` uses (2 for USD, 0 for
 * JPY and IRR). Falls back to 2 for codes the runtime does not know.
 *
 * @param code - ISO 4217 currency code.
 * @returns The minor-unit digits.
 * @example
 * ```ts
 * currencyDigits("JPY"); // 0
 * ```
 * @since 0.6.0
 */
export function currencyDigits(code: string): number {
  try {
    return (
      new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/**
 * An amount of money in one currency. Value: `number` in major units (dollars,
 * not cents). Issue codes: `invalidType`, `tooSmall`, `tooBig`,
 * `tooManyDecimals`.
 *
 * @since 0.6.0
 */
export const currency: FieldDefinition<CurrencySettings, number> = /*#__PURE__*/ defineField({
  type: "currency",
  settings: z.object({
    currency: z.optional(z.string().check(z.regex(/^[A-Z]{3}$/))),
    min: z.optional(z.number()),
    max: z.optional(z.number()),
  }),
  defaultValue: () => undefined,
  validator: ({ settings }) => {
    const scale = 10 ** currencyDigits(settings.currency ?? "USD");
    const checks: z.core.$ZodCheck<number>[] = [
      z.refine(
        (v: number) => Math.abs(v * scale - Math.round(v * scale)) < 1e-6,
        "tooManyDecimals",
      ),
    ];
    if (settings.min !== undefined) checks.unshift(z.gte(settings.min, "tooSmall"));
    if (settings.max !== undefined) checks.unshift(z.lte(settings.max, "tooBig"));
    return z.number("invalidType").check(...checks);
  },
});
