import type { TimeSettings } from "@formweave/engine/fields";
import type { Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { controlProps, FieldShell } from "./shell.js";

const NativeInput = (p: FieldRendererProps & { type: "time" | "datetime-local" }) => {
  const { min, max } = p.field.settings as TimeSettings;
  return (
    <FieldShell props={p}>
      <input
        {...controlProps(p)}
        ref={p.inputRef as Ref<HTMLInputElement>}
        className="fw-input"
        type={p.type}
        dir="ltr"
        min={min}
        max={max}
        value={typeof p.value === "string" ? p.value : ""}
        onChange={(e) => {
          p.onChange(e.target.value || undefined);
        }}
      />
    </FieldShell>
  );
};

/**
 * Renderer for `time`: the browser's time picker.
 *
 * @since 0.6.0
 */
export const timeRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("time", (p) => (
  <NativeInput {...p} type="time" />
));

/**
 * Renderer for `dateTime`: the browser's date and time picker.
 *
 * @since 0.6.0
 */
export const dateTimeRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("dateTime", (p) => (
  <NativeInput {...p} type="datetime-local" />
));
