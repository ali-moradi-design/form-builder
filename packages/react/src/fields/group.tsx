import { defineRenderer, type FieldRenderer } from "../renderers.js";

/**
 * Renderer for `group`: a titled section around its child fields.
 *
 * @since 0.2.0
 */
export const groupRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("group", (p) => (
  <fieldset
    className="fc-group"
    data-width={p.field.node.width ?? "full"}
    disabled={p.state.disabled}
    aria-describedby={p.help ? p.describedBy : undefined}
  >
    {p.label && <legend className="fc-group-title">{p.label}</legend>}
    {p.help && (
      <p id={p.describedBy} className="fc-help">
        {p.help}
      </p>
    )}
    <div className="fc-fields">{p.children}</div>
  </fieldset>
));
