import type { FieldRenderer } from "../renderers.js";
import { checkboxesRenderer, radioRenderer, selectRenderer } from "./choice.js";
import { dateRenderer } from "./date.js";
import { groupRenderer } from "./group.js";
import { numberRenderer } from "./number.js";
import { switchRenderer } from "./switch.js";
import { emailRenderer, longTextRenderer, shortTextRenderer } from "./text.js";

export { checkboxesRenderer, radioRenderer, selectRenderer } from "./choice.js";
export { dateRenderer } from "./date.js";
export { groupRenderer } from "./group.js";
export { numberRenderer } from "./number.js";
export { controlProps, FieldShell } from "./shell.js";
export type { FieldShellProps } from "./shell.js";
export { switchRenderer } from "./switch.js";
export { emailRenderer, longTextRenderer, shortTextRenderer } from "./text.js";

/**
 * Renderers for every built-in field type of version 0.1.
 *
 * @since 0.2.0
 */
export const basicRenderers: readonly FieldRenderer[] = [
  shortTextRenderer,
  longTextRenderer,
  emailRenderer,
  numberRenderer,
  selectRenderer,
  radioRenderer,
  checkboxesRenderer,
  switchRenderer,
  dateRenderer,
  groupRenderer,
];
