import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * Settings of {@link date}.
 *
 * @since 0.1.0
 */
export interface DateSettings {
  /** Earliest allowed date, as `YYYY-MM-DD`. */
  readonly min?: string | undefined;
  /** Latest allowed date, as `YYYY-MM-DD`. */
  readonly max?: string | undefined;
}

const isoDate = /*#__PURE__*/ z.iso.date();

/**
 * A calendar date (Gregorian). Value: `string` as `YYYY-MM-DD`. Issue codes:
 * `invalidDate`, `tooEarly`, `tooLate`.
 *
 * @since 0.1.0
 */
export const date: FieldDefinition<DateSettings, string> = /*#__PURE__*/ defineField({
  type: "date",
  settings: z.object({ min: z.optional(isoDate), max: z.optional(isoDate) }),
  defaultValue: () => undefined,
  validator: ({ settings }) =>
    z.iso.date("invalidDate").check(
      z.refine((v) => settings.min === undefined || v >= settings.min, "tooEarly"),
      z.refine((v) => settings.max === undefined || v <= settings.max, "tooLate"),
    ),
});
