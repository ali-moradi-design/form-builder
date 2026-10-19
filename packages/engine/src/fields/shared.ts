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
 * Options that depend on another field's answer, for example cities by
 * country.
 *
 * @since 0.6.0
 */
export interface OptionsBy {
  /** Key of the field whose answer picks the list. */
  readonly field: string;
  /** The options for each answer of that field. */
  readonly options: Readonly<Record<string, readonly ChoiceOption[]>>;
}

/** Settings parts shared by every choice type: static, dependent or remote options. */
export const dynamicOptions: {
  options: z.ZodMiniType<ChoiceOption[]>;
  optionsBy: z.ZodMiniOptional<z.ZodMiniType<OptionsBy>>;
  optionsUrl: z.ZodMiniOptional<z.ZodMiniType<string>>;
} = {
  options: /*#__PURE__*/ z.array(optionSchema),
  optionsBy: /*#__PURE__*/ z.optional(
    z.object({
      field: z.string().check(z.minLength(1)),
      options: z.record(z.string(), z.array(optionSchema)),
    }),
  ),
  optionsUrl: /*#__PURE__*/ z.optional(z.string().check(z.regex(/^https:\/\/\S+$/))),
};

/**
 * Whether choice settings have options from somewhere.
 *
 * @param s - The settings.
 * @param s.options - Static options.
 * @param s.optionsBy - Dependent options.
 * @param s.optionsUrl - Remote options.
 * @returns `true` when there is at least one source.
 */
export const someOptions = (s: {
  options: readonly unknown[];
  optionsBy?: unknown;
  optionsUrl?: unknown;
}): boolean => s.options.length > 0 || s.optionsBy !== undefined || s.optionsUrl !== undefined;

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
  /** The choices, in display order. Empty when they come from `optionsBy` or `optionsUrl`. */
  readonly options: readonly ChoiceOption[];
  /**
   * Options picked by another field's answer (dependent lists). Conditions,
   * the browser and the server all use the list for the current answer.
   *
   * @since 0.6.0
   */
  readonly optionsBy?: OptionsBy | undefined;
  /**
   * An `https://` address that returns the options as JSON: an array of
   * `{ value, label }` objects or of strings. The browser loads it; the
   * server cannot check these answers against the list, only that they are
   * short text.
   *
   * @since 0.6.0
   */
  readonly optionsUrl?: string | undefined;
}

/** Settings schema shared by select and radio. */
export const choiceSettings: z.ZodMiniType<ChoiceSettings> = /*#__PURE__*/ z
  .object(dynamicOptions)
  .check(z.refine(someOptions, "A choice field needs options."));

/**
 * Keys a choice field's options depend on: the `optionsBy` source field.
 *
 * @param settings - The field's settings.
 * @returns The keys.
 * @since 0.6.0
 */
export const optionSources = (settings: ChoiceSettings): readonly string[] =>
  settings.optionsBy ? [settings.optionsBy.field] : [];

const NONE: readonly ChoiceOption[] = Object.freeze([]);

/**
 * The options a choice field offers for the current answers: the dependent
 * list when there is one, otherwise the static options. `undefined` when they
 * come from a URL (unknown here).
 *
 * @param settings - The field's settings.
 * @param read - Reads another field's value.
 * @returns The options, or `undefined`.
 * @since 0.6.0
 */
export function currentOptions(
  settings: ChoiceSettings,
  read: (key: string) => unknown,
): readonly ChoiceOption[] | undefined {
  if (settings.optionsBy) {
    const by = read(settings.optionsBy.field);
    return typeof by === "string" ? (settings.optionsBy.options[by] ?? NONE) : NONE;
  }
  if (settings.optionsUrl) return undefined;
  return settings.options;
}

/**
 * Validator that accepts one of the configured option values.
 *
 * @param settings - Settings with the options.
 * @returns The validator.
 */
export const oneOf = (settings: ChoiceSettings): z.ZodMiniType<string> => {
  // Remote lists can't be known here; dependent lists are checked against the
  // other answer by `validate`, so this accepts any of their options.
  if (settings.optionsUrl)
    return z
      .string("invalidType")
      .check(z.minLength(1, "invalidOption"), z.maxLength(200, "invalidOption"));
  const all = [...settings.options, ...Object.values(settings.optionsBy?.options ?? {}).flat()];
  const allowed = new Set(all.map((o) => o.value));
  return z.string("invalidType").check(z.refine((v) => allowed.has(v), "invalidOption"));
};
