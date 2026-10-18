import { normalizeDigits } from "@formweave/engine/i18n";
import { useState, type ReactNode, type Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { controlProps, FieldShell } from "./shell.js";

function NumberInput(p: FieldRendererProps): ReactNode {
  // Keep what the person typed (for example "1." or Persian digits) while the
  // form value stays a number, or undefined when the text is not a number.
  const [text, setText] = useState(typeof p.value === "number" ? String(p.value) : "");
  return (
    <FieldShell props={p}>
      <input
        {...controlProps(p)}
        ref={p.inputRef as Ref<HTMLInputElement>}
        className="fw-input"
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
    </FieldShell>
  );
}

/**
 * Renderer for `number`. Accepts Persian and Arabic-Indic digits as typed.
 *
 * @since 0.2.0
 */
export const numberRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("number", NumberInput);
