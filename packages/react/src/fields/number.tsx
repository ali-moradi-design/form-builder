import type { CurrencySettings } from "@formcanvas/engine/fields";
import { normalizeDigits } from "@formcanvas/engine/i18n";
import { useState, type ReactNode, type Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { controlProps, FieldShell } from "./shell.js";

function NumberInput(p: FieldRendererProps & { readonly unit?: string }): ReactNode {
  // Keep what the person typed (for example "1." or Persian digits) while the
  // form value stays a number, or undefined when the text is not a number.
  const [text, setText] = useState(typeof p.value === "number" ? String(p.value) : "");
  const input = (
    <input
      {...controlProps(p)}
      ref={p.inputRef as Ref<HTMLInputElement>}
      className="fc-input"
      type="text"
      inputMode="decimal"
      dir="ltr"
      placeholder={p.placeholder || undefined}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const raw = normalizeDigits(e.target.value).trim();
        const n = raw === "" ? undefined : Number(raw);
        p.onChange(n === undefined || Number.isNaN(n) ? (raw === "" ? undefined : raw) : n);
      }}
    />
  );
  return (
    <FieldShell props={p}>
      {p.unit === undefined ? (
        input
      ) : (
        <div className="fc-slider" dir="ltr">
          <span className="fc-slider-value" aria-hidden>
            {p.unit}
          </span>
          {input}
        </div>
      )}
    </FieldShell>
  );
}

/** The currency's symbol as the reader's locale writes it, for example "€". */
const currencySymbol = (code: string, locale: string): string => {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
};

/**
 * Renderer for `number`. Accepts Persian and Arabic-Indic digits as typed.
 *
 * @since 0.2.0
 */
export const numberRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("number", NumberInput);

/**
 * Renderer for `currency`: a number box with the currency's symbol in front.
 * Accepts Persian and Arabic-Indic digits as typed.
 *
 * @since 0.6.0
 */
export const currencyRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("currency", (p) => {
  const code = (p.field.settings as CurrencySettings).currency ?? "USD";
  return <NumberInput {...p} unit={currencySymbol(code, p.locale)} />;
});
