import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

const HEX = /^#[0-9a-f]{6}$/;
const hex = /*#__PURE__*/ z.string("invalidType").check(z.regex(HEX, "invalidColor"));

/**
 * Colours offered when a field has no `swatches`: the formweave palette and
 * a few neutrals.
 *
 * @since 0.6.0
 */
export const DEFAULT_SWATCHES: readonly string[] = [
  "#0f4c5c",
  "#e36414",
  "#fb8b24",
  "#5f0f40",
  "#9a031e",
  "#2f6f73",
  "#141a1c",
  "#f2ede4",
  "#76a5a1",
  "#f2c18d",
];

/**
 * Settings of {@link color}.
 *
 * @since 0.6.0
 */
export interface ColorSettings {
  /**
   * Colours to pick from with one click, as `#rrggbb`.
   *
   * @defaultValue {@link DEFAULT_SWATCHES}
   */
  readonly swatches?: readonly string[] | undefined;
}

/**
 * Settings of {@link colorSet}.
 *
 * @since 0.6.0
 */
export interface ColorSetSettings extends ColorSettings {
  /** Fewest colours. */
  readonly minColors?: number | undefined;
  /**
   * Most colours.
   *
   * @defaultValue `5`
   */
  readonly maxColors?: number | undefined;
}

const swatches = /*#__PURE__*/ z.optional(
  z.array(z.string().check(z.regex(HEX))).check(z.maxLength(24)),
);
const colorCount = /*#__PURE__*/ z.optional(z.int().check(z.gte(1), z.lte(12)));

const colorSettings: z.ZodMiniType<ColorSettings> = /*#__PURE__*/ z.object({ swatches });
const colorSetSettings: z.ZodMiniType<ColorSetSettings> = /*#__PURE__*/ z.object({
  swatches,
  minColors: colorCount,
  maxColors: colorCount,
});

/**
 * One colour. Value: `string` as lower-case `#rrggbb`. Issue code: `invalidColor`.
 *
 * @since 0.6.0
 */
export const color: FieldDefinition<ColorSettings, string> = /*#__PURE__*/ defineField({
  type: "color",
  settings: colorSettings,
  defaultValue: () => undefined,
  validator: () => hex,
});

/**
 * Several colours in the order they were picked. Value: `string[]` of
 * lower-case `#rrggbb`, no duplicates.
 * Issue codes: `invalidColor`, `duplicate`, `tooFew`, `tooMany`.
 *
 * @since 0.6.0
 */
export const colorSet: FieldDefinition<ColorSetSettings, string[]> = /*#__PURE__*/ defineField({
  type: "colorSet",
  settings: colorSetSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) =>
    z.array(hex, "invalidType").check(
      z.minLength(settings.minColors ?? 0, "tooFew"),
      z.maxLength(settings.maxColors ?? 5, "tooMany"),
      z.refine((v) => new Set(v).size === v.length, "duplicate"),
    ),
});

/**
 * Turns `#RGB`, `#RRGGBB` or `rrggbb` into lower-case `#rrggbb`, or
 * `undefined` when it isn't a hex colour.
 *
 * @param input - What a person typed or a picker returned.
 * @returns The normalized colour.
 * @example
 * ```ts
 * normalizeHex("#F80"); // "#ff8800"
 * ```
 * @since 0.6.0
 */
export function normalizeHex(input: string): string | undefined {
  const v = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(v)) return `#${v.replace(/./g, (c) => c + c)}`;
  return /^[0-9a-f]{6}$/.test(v) ? `#${v}` : undefined;
}
