import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * Settings of {@link calculated}: how the result is shown.
 *
 * @since 0.6.0
 */
export interface CalculatedSettings {
  /**
   * `"number"`, `"currency"` (with {@link CalculatedSettings.currency}) or
   * `"percent"` (0.25 shows as 25%). Text and yes/no results are shown as they are.
   *
   * @defaultValue `"number"`
   */
  readonly format?: "number" | "currency" | "percent" | undefined;
  /** ISO 4217 code for the `"currency"` format, for example `"EUR"`. */
  readonly currency?: string | undefined;
  /** Digits after the decimal point; by default as many as needed (up to 2). */
  readonly decimals?: number | undefined;
}

/**
 * A read-only result worked out from other fields with the field's
 * `calculate` expression, for example a total. Value: a number, text or
 * yes/no. It is computed again on the server, so a sent value is ignored.
 *
 * @since 0.6.0
 */
export const calculated: FieldDefinition<CalculatedSettings, number | string | boolean> =
  /*#__PURE__*/ defineField({
    type: "calculated",
    settings: z.object({
      format: z.optional(z.enum(["number", "currency", "percent"])),
      currency: z.optional(z.string().check(z.regex(/^[A-Z]{3}$/))),
      decimals: z.optional(z.int().check(z.gte(0), z.lte(6))),
    }),
    defaultValue: () => undefined,
    validator: () => z.union([z.number(), z.string(), z.boolean()], "invalidType"),
  });
