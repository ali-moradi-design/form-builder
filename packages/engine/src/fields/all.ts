import type { FieldDefinition } from "../registry.js";
import {
  checkboxes,
  date,
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
  rating,
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
] as unknown as readonly FieldDefinition<never>[];
