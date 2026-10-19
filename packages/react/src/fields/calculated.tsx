import type { CalculatedSettings } from "@formweave/engine/fields";
import { formatNumber, localizeDigits } from "@formweave/engine/i18n";
import { defineRenderer, type FieldRenderer } from "../renderers.js";
import { FieldShell } from "./shell.js";

/** The result as text in the reader's locale. */
const show = (value: unknown, s: CalculatedSettings, locale: string): string => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (typeof value === "string") return localizeDigits(value, locale);
  if (typeof value !== "number") return "—";
  const digits =
    s.decimals === undefined
      ? { maximumFractionDigits: 2 }
      : { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals };
  try {
    if (s.format === "currency")
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: s.currency ?? "USD",
        ...(s.decimals === undefined ? {} : digits),
      }).format(value);
    if (s.format === "percent")
      return new Intl.NumberFormat(locale, { style: "percent", ...digits }).format(value);
    return new Intl.NumberFormat(locale, digits).format(value);
  } catch {
    return formatNumber(value, locale);
  }
};

/**
 * Renderer for `calculated`: the result in an `<output>`, formatted as a
 * number, an amount of money or a percentage. It updates as people answer.
 *
 * @since 0.6.0
 */
export const calculatedRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("calculated", (p) => (
  <FieldShell props={p}>
    <output
      id={p.id}
      className="fw-input fw-calculated"
      aria-live="polite"
      aria-describedby={p.describedBy}
    >
      {show(p.value, p.field.settings as CalculatedSettings, p.locale)}
    </output>
  </FieldShell>
));
