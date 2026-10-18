import type { Locale, LocalizedText } from "@formweave/schema";

/**
 * Picks the text for a locale from a {@link LocalizedText}.
 *
 * Tries the exact locale (`"fa-IR"`), then its language (`"fa"`), then the
 * fallback locale, then any available text.
 *
 * @param text - A plain string or a map from locale to string.
 * @param locale - The reader's locale.
 * @param fallback - Usually the form's default locale.
 * @returns The text, or `""` when there is none.
 * @example
 * ```ts
 * resolveText({ en: "Name", fa: "نام" }, "fa-IR", "en"); // "نام"
 * ```
 * @since 0.1.0
 */
export function resolveText(
  text: LocalizedText | undefined,
  locale: Locale,
  fallback?: Locale,
): string {
  if (text === undefined) return "";
  if (typeof text === "string") return text;
  const language = locale.split("-")[0] ?? locale;
  for (const key of [locale, language, fallback]) {
    if (key !== undefined && Object.hasOwn(text, key)) return text[key] ?? "";
  }
  for (const value of Object.values(text)) return value;
  return "";
}

const RTL = new Set(["ar", "fa", "he", "ps", "ur", "ckb", "dv", "yi"]);

/**
 * Whether a locale is written right to left.
 *
 * @param locale - A BCP 47 tag such as `"fa"` or `"en-US"`.
 * @returns `true` for right-to-left scripts.
 * @since 0.1.0
 */
export function isRtl(locale: Locale): boolean {
  return RTL.has((locale.split("-")[0] ?? "").toLowerCase());
}

/**
 * Which digits to show in numbers.
 *
 * - `"native"`: the locale's own digits (Persian shows ۰–۹).
 * - `"latin"`: always 0–9.
 *
 * @since 0.1.0
 */
export type DigitStyle = "native" | "latin";

/**
 * Formats a number for a locale.
 *
 * @param value - The number.
 * @param locale - The reader's locale.
 * @param digits - Digit style.
 * @returns The formatted number, for example `"۱٬۲۸۴"` in Persian.
 * @defaultValue digits: `"native"`
 * @since 0.1.0
 */
export function formatNumber(value: number, locale: Locale, digits: DigitStyle = "native"): string {
  return new Intl.NumberFormat(
    locale,
    digits === "latin" ? { numberingSystem: "latn" } : {},
  ).format(value);
}

const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Replaces 0–9 in a text with the locale's digits. Only Persian has its own
 * digits so far; other locales are returned unchanged.
 *
 * @param text - Any text.
 * @param locale - The reader's locale.
 * @returns The text with converted digits.
 * @since 0.1.0
 */
export function localizeDigits(text: string, locale: Locale): string {
  if ((locale.split("-")[0] ?? "") !== "fa") return text;
  return text.replace(/[0-9]/g, (d) => PERSIAN[Number(d)] ?? d);
}

/**
 * Turns Persian and Arabic-Indic digits typed by a user into 0–9, so `"۱۲"`
 * can be read as a number.
 *
 * @param text - Text typed by a user.
 * @returns The text with 0–9 digits.
 * @since 0.1.0
 */
export function normalizeDigits(text: string): string {
  return text.replace(/[۰-۹٠-٩]/g, (d) => {
    const code = d.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}
