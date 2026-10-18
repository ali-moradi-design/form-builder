import type { FieldDefinition } from "../registry.js";
import {
  checkboxes,
  date,
  email,
  group,
  longText,
  number,
  radio,
  select,
  shortText,
  toggle,
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
] as unknown as readonly FieldDefinition<never>[];
