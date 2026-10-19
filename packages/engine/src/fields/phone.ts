import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * Settings of {@link phone}.
 *
 * @since 0.6.0
 */
export interface PhoneSettings {
  /**
   * Country calling code used when a number is typed without one, for
   * example `"98"`: the renderer turns `0912…` into `+98912…`.
   */
  readonly defaultCountry?: string | undefined;
}

/**
 * A phone number in international form. Value: `string` like `+989121234567`
 * (`+`, then 7 to 15 digits, as in E.164). Issue code: `invalidPhone`.
 *
 * @since 0.6.0
 */
export const phone: FieldDefinition<PhoneSettings, string> = /*#__PURE__*/ defineField({
  type: "phone",
  settings: z.object({ defaultCountry: z.optional(z.string().check(z.regex(/^[1-9]\d{0,3}$/))) }),
  defaultValue: () => undefined,
  validator: () => z.string("invalidType").check(z.regex(/^\+[1-9]\d{6,14}$/, "invalidPhone")),
});

/**
 * Turns what a person typed into the stored phone form: native digits to
 * ASCII, spaces and punctuation removed, `00` → `+`, and a leading `0`
 * replaced by the default country code.
 *
 * @param input - The typed text.
 * @param defaultCountry - Calling code for numbers typed without one.
 * @returns The normalized number (possibly still invalid).
 * @example
 * ```ts
 * normalizePhone("۰۹۱۲ ۱۲۳ ۴۵۶۷", "98"); // "+989121234567"
 * ```
 * @since 0.6.0
 */
export function normalizePhone(input: string, defaultCountry?: string): string {
  const ascii = input.replace(/[۰-۹٠-٩]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10));
  let digits = ascii.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (!digits.startsWith("+") && defaultCountry && digits.startsWith("0")) {
    digits = `+${defaultCountry}${digits.slice(1)}`;
  }
  return digits;
}
