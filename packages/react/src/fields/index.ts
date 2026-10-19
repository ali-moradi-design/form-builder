import type { FieldRenderer } from "../renderers.js";
import { calculatedRenderer } from "./calculated.js";
import { checkboxesRenderer, radioRenderer, selectRenderer } from "./choice.js";
import {
  comboboxRenderer,
  imageChoiceRenderer,
  matrixRenderer,
  multiSelectRenderer,
  rankingRenderer,
  tagsRenderer,
} from "./choice-more.js";
import { colorRenderer, colorSetRenderer } from "./color.js";
import { dateRenderer } from "./date.js";
import { groupRenderer } from "./group.js";
import { currencyRenderer, numberRenderer } from "./number.js";
import { dateRangeRenderer, rangeSliderRenderer } from "./range.js";
import { repeaterRenderer } from "./repeater.js";
import { npsRenderer, ratingRenderer, sliderRenderer } from "./scale.js";
import { dividerRenderer, headingRenderer, hiddenRenderer, paragraphRenderer } from "./static.js";
import { switchRenderer } from "./switch.js";
import { emailRenderer, longTextRenderer, shortTextRenderer } from "./text.js";
import { dateTimeRenderer, timeRenderer } from "./time.js";
import { phoneRenderer, urlRenderer } from "./web.js";

export { calculatedRenderer } from "./calculated.js";
export { checkboxesRenderer, radioRenderer, selectRenderer } from "./choice.js";
export {
  comboboxRenderer,
  imageChoiceRenderer,
  matrixRenderer,
  multiSelectRenderer,
  rankingRenderer,
  tagsRenderer,
} from "./choice-more.js";
export { colorRenderer, colorSetRenderer } from "./color.js";
export { dateRenderer } from "./date.js";
export { groupRenderer } from "./group.js";
export { currencyRenderer, numberRenderer } from "./number.js";
export { dateRangeRenderer, rangeSliderRenderer } from "./range.js";
export { repeaterRenderer } from "./repeater.js";
export { npsRenderer, ratingRenderer, sliderRenderer } from "./scale.js";
export { controlProps, FieldShell } from "./shell.js";
export type { FieldShellProps } from "./shell.js";
export { dividerRenderer, headingRenderer, hiddenRenderer, paragraphRenderer } from "./static.js";
export { switchRenderer } from "./switch.js";
export { emailRenderer, longTextRenderer, shortTextRenderer } from "./text.js";
export { dateTimeRenderer, timeRenderer } from "./time.js";
export { phoneRenderer, urlRenderer } from "./web.js";

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

/**
 * Renderers for the field types added in version 0.6: URL, phone, time,
 * date-time, rating, NPS, slider, hidden, heading, paragraph, divider,
 * colour, colour set, currency, range slider, date range, repeater,
 * calculated, combobox, multi-select, tags, ranking, image choice and matrix.
 *
 * @since 0.6.0
 */
export const richRenderers: readonly FieldRenderer[] = [
  urlRenderer,
  phoneRenderer,
  timeRenderer,
  dateTimeRenderer,
  ratingRenderer,
  npsRenderer,
  sliderRenderer,
  hiddenRenderer,
  headingRenderer,
  paragraphRenderer,
  dividerRenderer,
  colorRenderer,
  colorSetRenderer,
  currencyRenderer,
  rangeSliderRenderer,
  dateRangeRenderer,
  repeaterRenderer,
  calculatedRenderer,
  comboboxRenderer,
  multiSelectRenderer,
  tagsRenderer,
  rankingRenderer,
  imageChoiceRenderer,
  matrixRenderer,
];

/**
 * Renderers for every built-in field type. Pair it with `allFields` from
 * `@formweave/engine/fields/all`.
 *
 * @since 0.6.0
 */
export const allRenderers: readonly FieldRenderer[] = [
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
  urlRenderer,
  phoneRenderer,
  timeRenderer,
  dateTimeRenderer,
  ratingRenderer,
  npsRenderer,
  sliderRenderer,
  hiddenRenderer,
  headingRenderer,
  paragraphRenderer,
  dividerRenderer,
  colorRenderer,
  colorSetRenderer,
  currencyRenderer,
  rangeSliderRenderer,
  dateRangeRenderer,
  repeaterRenderer,
  calculatedRenderer,
  comboboxRenderer,
  multiSelectRenderer,
  tagsRenderer,
  rankingRenderer,
  imageChoiceRenderer,
  matrixRenderer,
];
