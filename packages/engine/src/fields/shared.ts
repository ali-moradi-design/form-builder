import type { LocalizedText } from "@formweave/schema";
import * as z from "zod/mini";

// Issue codes are used as Zod messages; the renderer maps them to text.
/** Optional whole number of zero or more, used for length and count limits. */
export const count: z.ZodMiniType<number | undefined> = /*#__PURE__*/ z.optional(
  z.int().check(z.gte(0)),
);
const localized: z.ZodMiniType<LocalizedText> = /*#__PURE__*/ z.union([
  z.string(),
  z.record(z.string(), z.string()),
]);
const optionSchema = /*#__PURE__*/ z.object({
  value: z.string().check(z.minLength(1)),
  label: z.optional(localized),
});
/** A non-empty list of choices. */
export const options: z.ZodMiniType<ChoiceOption[]> = /*#__PURE__*/ z
  .array(optionSchema)
  .check(z.minLength(1));

/**
 * Validator for text with length limits.
 *
 * @param min - Fewest characters.
 * @param max - Most characters.
 * @returns The validator.
 */
export const text = (min: number | undefined, max: number): z.ZodMiniType<string> =>
  z.string("invalidType").check(z.minLength(min ?? 0, "tooShort"), z.maxLength(max, "tooLong"));

/**
 * One choice of a select, radio or checkboxes field.
 *
 * @since 0.1.0
 */
export interface ChoiceOption {
  /** Value stored in the submitted data. */
  readonly value: string;
  /** Text shown for the choice; the value is shown when missing. */
  readonly label?: LocalizedText | undefined;
}

/**
 * Settings of select and radio fields.
 *
 * @since 0.1.0
 */
export interface ChoiceSettings {
  /** The choices, in display order. At least one. */
  readonly options: readonly ChoiceOption[];
}

/** Settings schema shared by select and radio. */
export const choiceSettings: z.ZodMiniType<ChoiceSettings> = /*#__PURE__*/ z.object({ options });

/**
 * Validator that accepts one of the configured option values.
 *
 * @param settings - Settings with the options.
 * @returns The validator.
 */
export const oneOf = (settings: ChoiceSettings): z.ZodMiniType<string> => {
  const allowed = new Set(settings.options.map((o) => o.value));
  return z.string("invalidType").check(z.refine((v) => allowed.has(v), "invalidOption"));
};
