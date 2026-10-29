import type { LocalizedText } from "@formcanvas/schema";
import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * Settings of {@link repeater}.
 *
 * @since 0.6.0
 */
export interface RepeaterSettings {
  /**
   * Fewest rows. A new form starts with this many empty rows.
   *
   * @defaultValue `0`
   */
  readonly minRows?: number | undefined;
  /**
   * Most rows.
   *
   * @defaultValue `10`
   */
  readonly maxRows?: number | undefined;
  /** Name of one row, for example "Traveller"; used in row titles and the add button. */
  readonly rowLabel?: LocalizedText | undefined;
}

const localized: z.ZodMiniType<LocalizedText> = /*#__PURE__*/ z.union([
  z.string(),
  z.record(z.string(), z.string()),
]);
const count = /*#__PURE__*/ z.optional(z.int().check(z.gte(0), z.lte(100)));

/**
 * A list of rows; each row holds the values of the field's child `fields`.
 * Value: an array of objects keyed by the child keys. Conditions inside a row
 * read the values of the same row. Rows can hold other repeaters.
 *
 * Issue codes of the list: `invalidType`, `tooFewRows`, `tooManyRows`. Issues inside
 * a row are reported with paths such as `people.0.name`.
 *
 * @since 0.6.0
 */
export const repeater: FieldDefinition<RepeaterSettings, readonly Record<string, unknown>[]> =
  /*#__PURE__*/ defineField({
    type: "repeater",
    settings: z.object({ minRows: count, maxRows: count, rowLabel: z.optional(localized) }),
    defaultValue: () => [],
    rows: true,
    validator: ({ settings }) =>
      z
        .array(z.record(z.string(), z.unknown()), "invalidType")
        .check(
          z.minLength(settings.minRows ?? 0, "tooFewRows"),
          z.maxLength(settings.maxRows ?? 10, "tooManyRows"),
        ),
  });
