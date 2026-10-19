import type { FieldDefinition } from "../registry.js";
import {
  calculated,
  checkboxes,
  color,
  colorSet,
  currency,
  date,
  dateRange,
  dateTime,
  divider,
  email,
  group,
  heading,
  hidden,
  longText,
  nps,
  number,
  paragraph,
  phone,
  radio,
  rangeSlider,
  rating,
  repeater,
  select,
  shortText,
  slider,
  time,
  toggle,
  url,
} from "./index.js";

/**
 * Every built-in field type. Convenient for apps such as the builder that
 * offer all types; libraries that render only some forms should import the
 * types they need from `@formweave/engine/fields` to keep bundles small.
 *
 * @since 0.1.0
 */
export const allFields: readonly FieldDefinition<never>[] = [
  shortText,
  longText,
  email,
  number,
  select,
  radio,
  checkboxes,
  toggle,
  date,
  group,
  url,
  phone,
  time,
  dateTime,
  rating,
  nps,
  slider,
  hidden,
  heading,
  paragraph,
  divider,
  color,
  colorSet,
  currency,
  rangeSlider,
  dateRange,
  repeater,
  calculated,
] as unknown as readonly FieldDefinition<never>[];
