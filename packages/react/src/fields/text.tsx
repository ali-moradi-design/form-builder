import type { ReactNode, Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { controlProps, FieldShell } from "./shell.js";

const str = (v: unknown): string => (typeof v === "string" ? v : "");

function Input(p: FieldRendererProps & { type: string; autoComplete?: string }): ReactNode {
  return (
    <FieldShell props={p}>
      <input
        {...controlProps(p)}
        ref={p.inputRef as Ref<HTMLInputElement>}
        className="fw-input"
        type={p.type}
        autoComplete={p.autoComplete}
        placeholder={p.placeholder || undefined}
        value={str(p.value)}
        onChange={(e) => {
          p.onChange(e.target.value);
        }}
      />
    </FieldShell>
  );
}

/**
 * Renderer for `shortText`: a single-line text input.
 *
 * @since 0.2.0
 */
export const shortTextRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("shortText", (p) => (
  <Input {...p} type="text" />
));

/**
 * Renderer for `email`: an email input with the right keyboard on phones.
 *
 * @since 0.2.0
 */
export const emailRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("email", (p) => (
  <Input {...p} type="email" autoComplete="email" />
));

/**
 * Renderer for `longText`: a text area.
 *
 * @since 0.2.0
 */
export const longTextRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("longText", (p) => (
  <FieldShell props={p}>
    <textarea
      {...controlProps(p)}
      ref={p.inputRef as Ref<HTMLTextAreaElement>}
      className="fw-input fw-textarea"
      rows={4}
      placeholder={p.placeholder || undefined}
      value={str(p.value)}
      onChange={(e) => {
        p.onChange(e.target.value);
      }}
    />
  </FieldShell>
));
