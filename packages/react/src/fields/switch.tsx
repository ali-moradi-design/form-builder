import type { Ref } from "react";
import { defineRenderer, type FieldRenderer } from "../renderers.js";
import { controlProps } from "./shell.js";

/**
 * Renderer for `switch`: a checkbox drawn as a switch, with the label beside it.
 *
 * @since 0.2.0
 */
export const switchRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("switch", (p) => (
  <div
    className="fc-field fc-switch-field"
    data-width={p.field.node.width ?? "full"}
    data-invalid={p.error ? "" : undefined}
  >
    <label className="fc-switch" htmlFor={p.id}>
      <input
        {...controlProps(p)}
        ref={p.inputRef as Ref<HTMLInputElement>}
        type="checkbox"
        role="switch"
        checked={p.value === true}
        onChange={(e) => {
          p.onChange(e.target.checked);
        }}
      />
      <span className="fc-label">
        {p.label}
        {p.state.required && (
          <span className="fc-required" aria-hidden="true">
            *
          </span>
        )}
      </span>
    </label>
    <div id={p.describedBy} className="fc-messages">
      {p.help && <p className="fc-help">{p.help}</p>}
      {p.error && (
        <p className="fc-error" role="alert">
          {p.error}
        </p>
      )}
    </div>
  </div>
));
