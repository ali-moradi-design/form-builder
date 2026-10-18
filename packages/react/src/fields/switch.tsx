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
    className="fw-field fw-switch-field"
    data-width={p.field.node.width ?? "full"}
    data-invalid={p.error ? "" : undefined}
  >
    <label className="fw-switch" htmlFor={p.id}>
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
      <span className="fw-label">
        {p.label}
        {p.state.required && (
          <span className="fw-required" aria-hidden="true">
            *
          </span>
        )}
      </span>
    </label>
    <div id={p.describedBy} className="fw-messages">
      {p.help && <p className="fw-help">{p.help}</p>}
      {p.error && (
        <p className="fw-error" role="alert">
          {p.error}
        </p>
      )}
    </div>
  </div>
));
