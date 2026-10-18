import type { LocalizedText } from "@formweave/schema";
import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

// Issue codes used as Zod messages. The renderer maps them to text.
const count = z.optional(z.int().check(z.gte(0)));
const localized: z.ZodMiniType<LocalizedText> = z.union([
  z.string(),
  z.record(z.string(), z.string()),
]);
const optionSchema = z.object({
  value: z.string().check(z.minLength(1)),
  label: z.optional(localized),
});
const options = z.array(optionSchema).check(z.minLength(1));

const text = (min: number | undefined, max: number): z.ZodMiniType<string> =>
  z.string("invalidType").check(z.minLength(min ?? 0, "tooShort"), z.maxLength(max, "tooLong"));

/**
 * One choice of a {@link select}, {@link radio} or {@link checkboxes} field.
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
 * Settings of {@link shortText} and {@link longText}.
 *
 * @since 0.1.0
 */
export interface TextSettings {
  /** Fewest characters allowed. */
  readonly minLength?: number | undefined;
  /**
   * Most characters allowed.
   *
   * @defaultValue `500` for short text, `5000` for long text
   */
  readonly maxLength?: number | undefined;
}

const textSettings: z.ZodMiniType<TextSettings> = z.object({
  minLength: count,
  maxLength: count,
});

/**
 * One line of text. Value: `string`. Issue codes: `tooShort`, `tooLong`.
 *
 * @since 0.1.0
 */
export const shortText: FieldDefinition<TextSettings, string> = defineField({
  type: "shortText",
  settings: textSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) => text(settings.minLength, settings.maxLength ?? 500),
});

/**
 * Several lines of text. Value: `string`. Issue codes: `tooShort`, `tooLong`.
 *
 * @since 0.1.0
 */
export const longText: FieldDefinition<TextSettings, string> = defineField({
  type: "longText",
  settings: textSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) => text(settings.minLength, settings.maxLength ?? 5000),
});

/**
 * An email address. Value: `string`. Issue code: `invalidEmail`.
 *
 * @since 0.1.0
 */
export const email: FieldDefinition<Record<string, never>, string> = defineField({
  type: "email",
  settings: z.object({}),
  defaultValue: () => undefined,
  validator: () => z.email("invalidEmail").check(z.maxLength(254, "tooLong")),
});

/**
 * Settings of {@link number}.
 *
 * @since 0.1.0
 */
export interface NumberSettings {
  /** Smallest allowed value. */
  readonly min?: number | undefined;
  /** Largest allowed value. */
  readonly max?: number | undefined;
  /**
   * Allow whole numbers only.
   *
   * @defaultValue `false`
   */
  readonly integer?: boolean | undefined;
}

/**
 * A number. Value: `number`. Issue codes: `invalidType`, `notInteger`,
 * `tooSmall`, `tooBig`.
 *
 * @since 0.1.0
 */
export const number: FieldDefinition<NumberSettings, number> = defineField({
  type: "number",
  settings: z.object({
    min: z.optional(z.number()),
    max: z.optional(z.number()),
    integer: z.optional(z.boolean()),
  }),
  defaultValue: () => undefined,
  validator: ({ settings }) => {
    const checks = [];
    if (settings.min !== undefined) checks.push(z.gte(settings.min, "tooSmall"));
    if (settings.max !== undefined) checks.push(z.lte(settings.max, "tooBig"));
    const base = settings.integer ? z.int("notInteger") : z.number("invalidType");
    return checks.length ? base.check(...checks) : base;
  },
});

/**
 * Settings of {@link select} and {@link radio}.
 *
 * @since 0.1.0
 */
export interface ChoiceSettings {
  /** The choices, in display order. At least one. */
  readonly options: readonly ChoiceOption[];
}

const choiceSettings: z.ZodMiniType<ChoiceSettings> = z.object({ options });

const oneOf = (settings: ChoiceSettings): z.ZodMiniType<string> => {
  const allowed = new Set(settings.options.map((o) => o.value));
  return z.string("invalidType").check(z.refine((v) => allowed.has(v), "invalidOption"));
};

/**
 * A drop-down list with one answer. Value: `string`. Issue code: `invalidOption`.
 *
 * @since 0.1.0
 */
export const select: FieldDefinition<ChoiceSettings, string> = defineField({
  type: "select",
  settings: choiceSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) => oneOf(settings),
});

/**
 * Visible choices with one answer. Value: `string`. Issue code: `invalidOption`.
 *
 * @since 0.1.0
 */
export const radio: FieldDefinition<ChoiceSettings, string> = defineField({
  type: "radio",
  settings: choiceSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) => oneOf(settings),
});

/**
 * Settings of {@link checkboxes}.
 *
 * @since 0.1.0
 */
export interface CheckboxesSettings extends ChoiceSettings {
  /** Fewest choices to pick. */
  readonly minSelected?: number | undefined;
  /** Most choices to pick. */
  readonly maxSelected?: number | undefined;
}

const checkboxesSettings: z.ZodMiniType<CheckboxesSettings> = z.object({
  options,
  minSelected: count,
  maxSelected: count,
});

/**
 * Visible choices with several answers. Value: `string[]` without duplicates.
 * Issue codes: `invalidOption`, `duplicate`, `tooFew`, `tooMany`.
 *
 * @since 0.1.0
 */
export const checkboxes: FieldDefinition<CheckboxesSettings, string[]> = defineField({
  type: "checkboxes",
  settings: checkboxesSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) =>
    z.array(oneOf(settings), "invalidType").check(
      z.minLength(settings.minSelected ?? 0, "tooFew"),
      z.maxLength(settings.maxSelected ?? settings.options.length, "tooMany"),
      z.refine((v) => new Set(v).size === v.length, "duplicate"),
    ),
});

/**
 * An on/off switch. Value: `boolean`, starting as `false`. When required, it
 * must be on (useful for "I accept the terms").
 *
 * @since 0.1.0
 */
export const toggle: FieldDefinition<Record<string, never>, boolean> = defineField({
  type: "switch",
  settings: z.object({}),
  defaultValue: () => false,
  validator: () => z.boolean("invalidType"),
  isEmpty: (v) => v !== true,
});

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

const isoDate = z.iso.date();

/**
 * A calendar date (Gregorian). Value: `string` as `YYYY-MM-DD`. Issue codes:
 * `invalidDate`, `tooEarly`, `tooLate`.
 *
 * @since 0.1.0
 */
export const date: FieldDefinition<DateSettings, string> = defineField({
  type: "date",
  settings: z.object({ min: z.optional(isoDate), max: z.optional(isoDate) }),
  defaultValue: () => undefined,
  validator: ({ settings }) =>
    z.iso.date("invalidDate").check(
      z.refine((v) => settings.min === undefined || v >= settings.min, "tooEarly"),
      z.refine((v) => settings.max === undefined || v <= settings.max, "tooLate"),
    ),
});

/**
 * Groups other fields under a heading. It has no value; its `fields` are
 * shown, hidden and disabled together.
 *
 * @since 0.1.0
 */
export const group: FieldDefinition<Record<string, never>, never> = defineField({
  type: "group",
  settings: z.object({}),
  defaultValue: () => undefined,
  validator: () => z.never(),
  container: true,
});
