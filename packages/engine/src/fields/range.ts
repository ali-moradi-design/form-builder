import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";
import type { DateSettings } from "./date.js";
import type { SliderSettings } from "./scale.js";

/**
 * Value of a range field: where it starts and where it ends.
 *
 * @since 0.6.0
 */
export interface Range<T> {
  /** Start of the range. */
  readonly from: T;
  /** End of the range; never before `from`. */
  readonly to: T;
}

// A range with neither end counts as empty, so `required` works on it.
const rangeIsEmpty = (v: unknown): boolean => {
  if (v === undefined || v === null) return true;
  if (typeof v !== "object") return false;
  const r = v as Partial<Record<"from" | "to", unknown>>;
  return (r.from === undefined || r.from === "") && (r.to === undefined || r.to === "");
};

const isoDate = /*#__PURE__*/ z.iso.date();

/**
 * Two calendar dates (Gregorian). Value: {@link Range} of `YYYY-MM-DD`
 * strings. `min` and `max` limit both ends. Issue codes: `incompleteRange`,
 * `invalidDate`, `invalidRange` (end before start), `tooEarly`, `tooLate`.
 *
 * @since 0.6.0
 */
export const dateRange: FieldDefinition<DateSettings, Range<string>> = /*#__PURE__*/ defineField({
  type: "dateRange",
  settings: z.object({ min: z.optional(isoDate), max: z.optional(isoDate) }),
  defaultValue: () => undefined,
  isEmpty: rangeIsEmpty,
  validator: ({ settings }) => {
    const end = z.optional(z.iso.date("invalidDate"));
    return z.object({ from: end, to: end }, "invalidType").check(
      z.refine((r) => r.from !== undefined && r.to !== undefined, "incompleteRange"),
      z.refine((r) => !r.from || !r.to || r.from <= r.to, "invalidRange"),
      z.refine((r) => settings.min === undefined || !r.from || r.from >= settings.min, "tooEarly"),
      z.refine((r) => settings.max === undefined || !r.to || r.to <= settings.max, "tooLate"),
    ) as unknown as z.ZodMiniType<Range<string>>;
  },
});

/**
 * Two handles on one track between `min` and `max`. Value: {@link Range} of
 * numbers. Issue codes: `incompleteRange`, `invalidRange`, `tooSmall`,
 * `tooBig`, `invalidStep`.
 *
 * @since 0.6.0
 */
export const rangeSlider: FieldDefinition<
  SliderSettings,
  Range<number>
> = /*#__PURE__*/ defineField({
  type: "rangeSlider",
  settings: z.object({
    min: z.number(),
    max: z.number(),
    step: z.optional(z.number().check(z.positive())),
  }),
  defaultValue: () => undefined,
  isEmpty: rangeIsEmpty,
  validator: ({ settings }) => {
    const step = settings.step ?? 1;
    const onStep = (v: number) => {
      const n = (v - settings.min) / step;
      return Math.abs(n - Math.round(n)) < 1e-9;
    };
    const end = z.optional(z.number("invalidType"));
    const both = (r: { from?: number | undefined; to?: number | undefined }) =>
      [r.from, r.to].filter((v) => v !== undefined);
    return z.object({ from: end, to: end }, "invalidType").check(
      z.refine((r) => r.from !== undefined && r.to !== undefined, "incompleteRange"),
      z.refine((r) => r.from === undefined || r.to === undefined || r.from <= r.to, "invalidRange"),
      z.refine((r) => both(r).every((v) => v >= settings.min), {
        message: "tooSmall",
        params: { min: settings.min },
      }),
      z.refine((r) => both(r).every((v) => v <= settings.max), {
        message: "tooBig",
        params: { max: settings.max },
      }),
      z.refine((r) => both(r).every(onStep), "invalidStep"),
    ) as unknown as z.ZodMiniType<Range<number>>;
  },
});
