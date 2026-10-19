import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";
import {
  choiceSettings,
  count,
  dynamicOptions,
  oneOf,
  someOptions,
  type ChoiceSettings,
  currentOptions,
  optionSources,
} from "./shared.js";

/**
 * A drop-down list with one answer. Value: `string`. Issue code: `invalidOption`.
 *
 * @since 0.1.0
 */
export const select: FieldDefinition<ChoiceSettings, string> = /*#__PURE__*/ defineField({
  type: "select",
  reads: optionSources,
  options: currentOptions,
  settings: choiceSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) => oneOf(settings),
});

/**
 * Visible choices with one answer. Value: `string`. Issue code: `invalidOption`.
 *
 * @since 0.1.0
 */
export const radio: FieldDefinition<ChoiceSettings, string> = /*#__PURE__*/ defineField({
  type: "radio",
  reads: optionSources,
  options: currentOptions,
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

const checkboxesSettings: z.ZodMiniType<CheckboxesSettings> = /*#__PURE__*/ z
  .object({ ...dynamicOptions, minSelected: count, maxSelected: count })
  .check(z.refine(someOptions, "A choice field needs options."));

/**
 * Visible choices with several answers. Value: `string[]` without duplicates.
 * Issue codes: `invalidOption`, `duplicate`, `tooFew`, `tooMany`.
 *
 * @since 0.1.0
 */
export const checkboxes: FieldDefinition<CheckboxesSettings, string[]> = /*#__PURE__*/ defineField({
  type: "checkboxes",
  reads: optionSources,
  options: currentOptions,
  settings: checkboxesSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) =>
    z.array(oneOf(settings), "invalidType").check(
      z.minLength(settings.minSelected ?? 0, "tooFew"),
      z.maxLength(settings.maxSelected ?? Number.MAX_SAFE_INTEGER, "tooMany"),
      z.refine((v) => new Set(v).size === v.length, "duplicate"),
    ),
});
