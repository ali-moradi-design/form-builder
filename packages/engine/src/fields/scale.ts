import * as z from "zod/mini";
import type { LocalizedText } from "@formweave/schema";
import { defineField, type FieldDefinition } from "../registry.js";

const localized: z.ZodMiniType<LocalizedText> = /*#__PURE__*/ z.union([
  z.string(),
  z.record(z.string(), z.string()),
]);

const between = (min: number, max: number) =>
  z.int("notInteger").check(z.gte(min, "tooSmall"), z.lte(max, "tooBig"));

/**
 * Settings of {@link rating}.
 *
 * @since 0.6.0
 */
export interface RatingSettings {
  /**
   * Number of stars, 3 to 10.
   *
   * @defaultValue `5`
   */
  readonly max?: number | undefined;
}

/**
 * Stars from 1 to `max`. Value: `number` (whole).
 * Issue codes: `notInteger`, `tooSmall`, `tooBig`.
 *
 * @since 0.6.0
 */
export const rating: FieldDefinition<RatingSettings, number> = /*#__PURE__*/ defineField({
  type: "rating",
  settings: z.object({ max: z.optional(z.int().check(z.gte(3), z.lte(10))) }),
  defaultValue: () => undefined,
  validator: ({ settings }) => between(1, settings.max ?? 5),
});

/**
 * Settings of {@link nps}: words under the two ends of the scale.
 *
 * @since 0.6.0
 */
export interface NpsSettings {
  /** Text under 0, for example "Not likely". */
  readonly lowLabel?: LocalizedText | undefined;
  /** Text under 10, for example "Very likely". */
  readonly highLabel?: LocalizedText | undefined;
}

/**
 * Net Promoter Score question: 0 to 10. Value: `number` (whole).
 * Issue codes: `notInteger`, `tooSmall`, `tooBig`.
 *
 * @since 0.6.0
 */
export const nps: FieldDefinition<NpsSettings, number> = /*#__PURE__*/ defineField({
  type: "nps",
  settings: z.object({ lowLabel: z.optional(localized), highLabel: z.optional(localized) }),
  defaultValue: () => undefined,
  validator: () => between(0, 10),
});

/**
 * Settings of {@link slider}.
 *
 * @since 0.6.0
 */
export interface SliderSettings {
  /** Smallest value. */
  readonly min: number;
  /** Largest value. */
  readonly max: number;
  /**
   * Distance between allowed values.
   *
   * @defaultValue `1`
   */
  readonly step?: number | undefined;
}

/**
 * A number picked on a track between `min` and `max`. Value: `number`.
 * Issue codes: `tooSmall`, `tooBig`, `invalidStep`.
 *
 * @since 0.6.0
 */
export const slider: FieldDefinition<SliderSettings, number> = /*#__PURE__*/ defineField({
  type: "slider",
  settings: z.object({
    min: z.number(),
    max: z.number(),
    step: z.optional(z.number().check(z.positive())),
  }),
  defaultValue: () => undefined,
  validator: ({ settings }) => {
    const step = settings.step ?? 1;
    return z.number("invalidType").check(
      z.gte(settings.min, "tooSmall"),
      z.lte(settings.max, "tooBig"),
      z.refine((v) => {
        const n = (v - settings.min) / step;
        return Math.abs(n - Math.round(n)) < 1e-9;
      }, "invalidStep"),
    );
  },
});
