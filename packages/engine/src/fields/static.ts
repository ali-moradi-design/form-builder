import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

const display = (type: string): FieldDefinition<Record<string, never>, never> =>
  defineField({
    type,
    settings: z.object({}),
    defaultValue: () => undefined,
    validator: () => z.never(),
    container: true,
  });

/**
 * A section heading (its `label`) with optional `help` text. No value.
 *
 * @since 0.6.0
 */
export const heading: FieldDefinition<Record<string, never>, never> = /*#__PURE__*/ display(
  "heading",
);

/**
 * A paragraph of text (its `label`). No value.
 *
 * @since 0.6.0
 */
export const paragraph: FieldDefinition<Record<string, never>, never> = /*#__PURE__*/ display(
  "paragraph",
);

/**
 * A horizontal line between parts of a form. No value.
 *
 * @since 0.6.0
 */
export const divider: FieldDefinition<Record<string, never>, never> = /*#__PURE__*/ display(
  "divider",
);
