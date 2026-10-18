import type { DateSettings } from "@formweave/engine/fields";
import type { Ref } from "react";
import { defineRenderer, type FieldRenderer } from "../renderers.js";
import { controlProps, FieldShell } from "./shell.js";

/**
 * Renderer for `date`: the browser's date input (Gregorian calendar), limited
 * by the field's `min` and `max`.
 *
 * @since 0.2.0
 */
export const dateRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("date", (p) => {
  const settings = p.field.settings as DateSettings;
  return (
    <FieldShell props={p}>
      <input
        {...controlProps(p)}
        ref={p.inputRef as Ref<HTMLInputElement>}
        className="fw-input"
        type="date"
        min={settings.min}
        max={settings.max}
        value={typeof p.value === "string" ? p.value : ""}
        onChange={(e) => {
          p.onChange(e.target.value || undefined);
        }}
      />
    </FieldShell>
  );
});
