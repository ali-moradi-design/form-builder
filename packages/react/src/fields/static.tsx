import { defineRenderer, type FieldRenderer } from "../renderers.js";

/**
 * Renderer for `hidden`: nothing is shown; the value is still submitted.
 *
 * @since 0.6.0
 */
export const hiddenRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("hidden", () => null);

/**
 * Renderer for `heading`: the label as a section heading, with its help text.
 *
 * @since 0.6.0
 */
export const headingRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("heading", (p) => (
  <div className="fw-static" data-width="full">
    <h3 className="fw-heading">{p.label}</h3>
    {p.help && <p className="fw-help">{p.help}</p>}
  </div>
));

/**
 * Renderer for `paragraph`: the label as a paragraph of text.
 *
 * @since 0.6.0
 */
export const paragraphRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("paragraph", (p) => (
  <p className="fw-static fw-paragraph" data-width="full">
    {p.label}
  </p>
));

/**
 * Renderer for `divider`: a horizontal line.
 *
 * @since 0.6.0
 */
export const dividerRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("divider", () => (
  <hr className="fw-static fw-divider" data-width="full" />
));
