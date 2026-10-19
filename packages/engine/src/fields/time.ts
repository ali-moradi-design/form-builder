import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * Settings of {@link time} and {@link dateTime}: earliest and latest values in
 * the field's own format.
 *
 * @since 0.6.0
 */
export interface TimeSettings {
  /** Earliest allowed value (`HH:MM`, or `YYYY-MM-DDTHH:MM` for date-time). */
  readonly min?: string | undefined;
  /** Latest allowed value, in the same format. */
  readonly max?: string | undefined;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const LOCAL = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d$/;

const bounded = (pattern: RegExp, invalid: string) => (settings: TimeSettings) =>
  z.string("invalidType").check(
    z.regex(pattern, invalid),
    z.refine((v) => settings.min === undefined || v >= settings.min, "tooEarly"),
    z.refine((v) => settings.max === undefined || v <= settings.max, "tooLate"),
  );

const settingsOf = (pattern: RegExp): z.ZodMiniType<TimeSettings> =>
  z.object({
    min: z.optional(z.string().check(z.regex(pattern))),
    max: z.optional(z.string().check(z.regex(pattern))),
  });

/**
 * A time of day. Value: `string` as `HH:MM` (24 hours).
 * Issue codes: `invalidTime`, `tooEarly`, `tooLate`.
 *
 * @since 0.6.0
 */
export const time: FieldDefinition<TimeSettings, string> = /*#__PURE__*/ defineField({
  type: "time",
  settings: /*#__PURE__*/ settingsOf(HHMM),
  defaultValue: () => undefined,
  validator: ({ settings }) => bounded(HHMM, "invalidTime")(settings),
});

/**
 * A date and time without a time zone. Value: `string` as `YYYY-MM-DDTHH:MM`.
 * Issue codes: `invalidDate`, `tooEarly`, `tooLate`.
 *
 * @since 0.6.0
 */
export const dateTime: FieldDefinition<TimeSettings, string> = /*#__PURE__*/ defineField({
  type: "dateTime",
  settings: /*#__PURE__*/ settingsOf(LOCAL),
  defaultValue: () => undefined,
  validator: ({ settings }) => bounded(LOCAL, "invalidDate")(settings),
});
