import { normalizePhone, type PhoneSettings } from "@formweave/engine/fields";
import { useState, type ReactNode, type Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { controlProps, FieldShell } from "./shell.js";

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * Renderer for `url`: a URL input (left-to-right in every language).
 *
 * @since 0.6.0
 */
export const urlRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("url", (p) => (
  <FieldShell props={p}>
    <input
      {...controlProps(p)}
      ref={p.inputRef as Ref<HTMLInputElement>}
      className="fw-input"
      type="url"
      dir="ltr"
      inputMode="url"
      autoComplete="url"
      placeholder={p.placeholder || "https://"}
      value={str(p.value)}
      onChange={(e) => {
        p.onChange(e.target.value.trim() || undefined);
      }}
    />
  </FieldShell>
));

function PhoneInput(p: FieldRendererProps): ReactNode {
  // Show what was typed; store the normalized international form.
  const [text, setText] = useState(str(p.value));
  const { defaultCountry } = p.field.settings as PhoneSettings;
  return (
    <FieldShell props={p}>
      <input
        {...controlProps(p)}
        ref={p.inputRef as Ref<HTMLInputElement>}
        className="fw-input"
        type="tel"
        dir="ltr"
        inputMode="tel"
        autoComplete="tel"
        placeholder={p.placeholder || (defaultCountry ? `+${defaultCountry}` : "+")}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          p.onChange(normalizePhone(e.target.value, defaultCountry) || undefined);
        }}
      />
    </FieldShell>
  );
}

/**
 * Renderer for `phone`. Accepts Persian digits, spaces and `0…` numbers
 * (with the field's default country) and stores `+<digits>`.
 *
 * @since 0.6.0
 */
export const phoneRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("phone", PhoneInput);
