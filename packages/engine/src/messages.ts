import type { Locale } from "@formweave/schema";
import { formatNumber, type DigitStyle } from "./i18n.js";
import type { ValidationIssue } from "./validate.js";

/**
 * Text for each issue code. `{min}` and `{max}` are replaced with the limits
 * of the check that failed.
 *
 * @since 0.1.0
 */
export type MessageCatalog = Readonly<Record<string, string>>;

/**
 * English messages for the built-in issue codes.
 *
 * @since 0.1.0
 */
export const en: MessageCatalog = {
  required: "This field is required.",
  invalid: "This value is not valid.",
  invalidType: "This value is not valid.",
  tooShort: "Use at least {min} characters.",
  tooLong: "Use at most {max} characters.",
  invalidEmail: "Enter a full email address, such as name@example.com.",
  tooSmall: "Enter {min} or more.",
  tooBig: "Enter {max} or less.",
  notInteger: "Enter a whole number.",
  invalidOption: "Choose one of the options.",
  duplicate: "Each option can be chosen once.",
  tooFew: "Choose at least {min}.",
  tooMany: "Choose at most {max}.",
  invalidDate: "Enter a valid date.",
  tooEarly: "Choose a later date.",
  tooLate: "Choose an earlier date.",
  invalidUrl: "Enter a full web address, such as https://example.com.",
  invalidPhone: "Enter the number with its country code, such as +44 20 7946 0958.",
  invalidTime: "Enter a valid time.",
  invalidStep: "Choose one of the marked values.",
  invalidColor: "Choose a colour or type a hex code such as #0f4c5c.",
  incompleteRange: "Fill in both ends of the range.",
  invalidRange: "The end must not come before the start.",
  tooManyDecimals: "Use fewer digits after the decimal point.",
  tooFewRows: "Add at least {min} rows.",
  tooManyRows: "Use at most {max} rows.",
  incompleteRanking: "Put every option in order.",
  incompleteRows: "Answer every row.",
  fileTooBig: "This file is too big.",
  fileType: "This type of file is not allowed here.",
  fileMissing: "This file was not received. Upload it again.",
};

/**
 * Persian messages for the built-in issue codes.
 *
 * @since 0.1.0
 */
export const fa: MessageCatalog = {
  required: "پاسخ به این پرسش لازم است.",
  invalid: "این مقدار درست نیست.",
  invalidType: "این مقدار درست نیست.",
  tooShort: "دست‌کم {min} نویسه بنویسید.",
  tooLong: "حداکثر {max} نویسه بنویسید.",
  invalidEmail: "نشانی ایمیل کامل را بنویسید؛ مثلاً name@example.com",
  tooSmall: "عددی برابر {min} یا بیشتر بنویسید.",
  tooBig: "عددی برابر {max} یا کمتر بنویسید.",
  notInteger: "یک عدد صحیح بنویسید.",
  invalidOption: "یکی از گزینه‌ها را انتخاب کنید.",
  duplicate: "هر گزینه را فقط یک بار می‌توانید انتخاب کنید.",
  tooFew: "دست‌کم {min} گزینه انتخاب کنید.",
  tooMany: "حداکثر {max} گزینه انتخاب کنید.",
  invalidDate: "یک تاریخ درست وارد کنید.",
  tooEarly: "تاریخ دیرتری انتخاب کنید.",
  tooLate: "تاریخ زودتری انتخاب کنید.",
  invalidUrl: "نشانی کامل وب را بنویسید؛ مثلاً https://example.com",
  invalidPhone: "شماره را با کد کشور بنویسید؛ مثلاً ‎+98 912 123 4567‎",
  invalidTime: "یک زمان درست وارد کنید.",
  invalidStep: "یکی از مقدارهای مشخص‌شده را انتخاب کنید.",
  invalidColor: "یک رنگ انتخاب کنید یا کد آن را بنویسید؛ مثلاً ‎#0f4c5c‎",
  incompleteRange: "هر دو سر بازه را پر کنید.",
  invalidRange: "پایان بازه نباید پیش از آغاز آن باشد.",
  tooManyDecimals: "رقم‌های کمتری بعد از ممیز بنویسید.",
  tooFewRows: "دست‌کم {min} ردیف اضافه کنید.",
  tooManyRows: "حداکثر {max} ردیف می‌توانید داشته باشید.",
  incompleteRanking: "همهٔ گزینه‌ها را مرتب کنید.",
  incompleteRows: "به همهٔ ردیف‌ها پاسخ دهید.",
  fileTooBig: "حجم این فایل بیش از حد مجاز است.",
  fileType: "این نوع فایل اینجا پذیرفته نمی‌شود.",
  fileMissing: "این فایل به دست ما نرسید. دوباره بارگذاری کنید.",
};

/**
 * Turns a {@link ValidationIssue} into text.
 *
 * @param issue - The issue from `validate`.
 * @param catalog - Messages to use, for example {@link en} or {@link fa}, or your own.
 * @param locale - Locale used to format numbers in the message.
 * @param digits - Digit style for numbers.
 * @returns The message; falls back to the catalog's `invalid` text, then to the code.
 * @example
 * ```ts
 * formatIssue({ key: "name", code: "tooShort", params: { min: 2 } }, fa, "fa");
 * // "دست‌کم ۲ نویسه بنویسید."
 * ```
 * @since 0.1.0
 */
export function formatIssue(
  issue: ValidationIssue,
  catalog: MessageCatalog,
  locale: Locale,
  digits: DigitStyle = "native",
): string {
  const template = catalog[issue.code] ?? catalog.invalid ?? issue.code;
  return template.replace(/\{(min|max)\}/g, (match, name: "min" | "max") => {
    const n = issue.params?.[name];
    return typeof n === "number" ? formatNumber(n, locale, digits) : match;
  });
}
