import type { LocalizedText } from "@formweave/schema";
import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";
import type { CheckboxesSettings } from "./choice.js";
import {
  choiceSettings,
  count,
  oneOf,
  options,
  type ChoiceOption,
  type ChoiceSettings,
} from "./shared.js";

const localized: z.ZodMiniType<LocalizedText> = /*#__PURE__*/ z.union([
  z.string(),
  z.record(z.string(), z.string()),
]);

const unique = (v: readonly unknown[]): boolean => new Set(v).size === v.length;

const manyOf = (settings: CheckboxesSettings): z.ZodMiniType<string[]> =>
  z
    .array(oneOf(settings), "invalidType")
    .check(
      z.minLength(settings.minSelected ?? 0, "tooFew"),
      z.maxLength(settings.maxSelected ?? settings.options.length, "tooMany"),
      z.refine(unique, "duplicate"),
    );

const manySettings: z.ZodMiniType<CheckboxesSettings> = /*#__PURE__*/ z.object({
  options,
  minSelected: count,
  maxSelected: count,
});

/**
 * A searchable list with one answer, for long lists such as cities.
 * Value: `string`. Issue code: `invalidOption`.
 *
 * @since 0.6.0
 */
export const combobox: FieldDefinition<ChoiceSettings, string> = /*#__PURE__*/ defineField({
  type: "combobox",
  settings: choiceSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) => oneOf(settings),
});

/**
 * A searchable list with several answers. Value: `string[]` without
 * duplicates. Issue codes: `invalidOption`, `duplicate`, `tooFew`, `tooMany`.
 *
 * @since 0.6.0
 */
export const multiSelect: FieldDefinition<CheckboxesSettings, string[]> = /*#__PURE__*/ defineField(
  {
    type: "multiSelect",
    settings: manySettings,
    defaultValue: () => undefined,
    validator: ({ settings }) => manyOf(settings),
  },
);

/**
 * Settings of {@link tags}.
 *
 * @since 0.6.0
 */
export interface TagsSettings {
  /**
   * Most tags.
   *
   * @defaultValue `20`
   */
  readonly maxTags?: number | undefined;
  /**
   * Longest tag, in characters.
   *
   * @defaultValue `40`
   */
  readonly maxLength?: number | undefined;
  /** Tags offered while typing; people may still add their own. */
  readonly suggestions?: readonly string[] | undefined;
}

const tagsSettings: z.ZodMiniType<TagsSettings> = /*#__PURE__*/ z.object({
  maxTags: z.optional(z.int().check(z.gte(1), z.lte(100))),
  maxLength: z.optional(z.int().check(z.gte(1), z.lte(200))),
  suggestions: z.optional(z.array(z.string()).check(z.maxLength(200))),
});

/**
 * Free words or short phrases. Value: `string[]` of trimmed, distinct tags.
 * Issue codes: `invalidType`, `tooMany`, `tooLong`, `duplicate`.
 *
 * @since 0.6.0
 */
export const tags: FieldDefinition<TagsSettings, string[]> = /*#__PURE__*/ defineField({
  type: "tags",
  settings: tagsSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) =>
    z
      .array(
        z.string("invalidType").check(
          z.refine((v) => v.trim() === v && v !== "", "invalidType"),
          z.maxLength(settings.maxLength ?? 40, "tooLong"),
        ),
        "invalidType",
      )
      .check(
        z.maxLength(settings.maxTags ?? 20, "tooMany"),
        z.refine((v) => unique(v.map((t) => t.toLowerCase())), "duplicate"),
      ),
});

/**
 * Options put in order by preference. Value: `string[]` holding every option
 * value once, first is best. Issue codes: `invalidType`, `invalidOption`,
 * `incompleteRanking`.
 *
 * @since 0.6.0
 */
export const ranking: FieldDefinition<ChoiceSettings, string[]> = /*#__PURE__*/ defineField({
  type: "ranking",
  settings: choiceSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) =>
    z
      .array(oneOf(settings), "invalidType")
      .check(
        z.refine((v) => unique(v) && v.length === settings.options.length, "incompleteRanking"),
      ),
});

/**
 * One picture choice.
 *
 * @since 0.6.0
 */
export interface ImageOption extends ChoiceOption {
  /** Picture URL: `https://…` or a path on the same site such as `/img/a.jpg`. */
  readonly image: string;
  /** Text for people who cannot see the picture; the label is used when missing. */
  readonly alt?: LocalizedText | undefined;
}

/**
 * Settings of {@link imageChoice}.
 *
 * @since 0.6.0
 */
export interface ImageChoiceSettings {
  /** The choices, in display order. */
  readonly options: readonly ImageOption[];
  /**
   * Allow several answers.
   *
   * @defaultValue `false`
   */
  readonly multiple?: boolean | undefined;
  /** Fewest choices, when `multiple`. */
  readonly minSelected?: number | undefined;
  /** Most choices, when `multiple`. */
  readonly maxSelected?: number | undefined;
}

const imageUrl = /*#__PURE__*/ z.string().check(z.regex(/^(https:\/\/|\/(?!\/))\S+$/));

const imageChoiceSettings: z.ZodMiniType<ImageChoiceSettings> = /*#__PURE__*/ z.object({
  options: z
    .array(
      z.object({
        value: z.string().check(z.minLength(1)),
        label: z.optional(localized),
        image: imageUrl,
        alt: z.optional(localized),
      }),
    )
    .check(z.minLength(1)),
  multiple: z.optional(z.boolean()),
  minSelected: count,
  maxSelected: count,
});

/**
 * Choices shown as pictures. Value: `string`, or `string[]` with `multiple`.
 * Issue codes as for radio or checkboxes.
 *
 * @since 0.6.0
 */
export const imageChoice: FieldDefinition<ImageChoiceSettings, string | string[]> =
  /*#__PURE__*/ defineField({
    type: "imageChoice",
    settings: imageChoiceSettings,
    defaultValue: () => undefined,
    validator: ({ settings }) =>
      settings.multiple ? manyOf(settings) : (oneOf(settings) as z.ZodMiniType<string | string[]>),
  });

/**
 * Settings of {@link matrix}.
 *
 * @since 0.6.0
 */
export interface MatrixSettings {
  /** Statements or items, one per row. */
  readonly rows: readonly ChoiceOption[];
  /** The scale, one choice per column, for example Poor … Great. */
  readonly columns: readonly ChoiceOption[];
  /**
   * Every row needs an answer once any row has one (and always when the
   * field is required).
   *
   * @defaultValue `true`
   */
  readonly everyRow?: boolean | undefined;
}

const matrixSettings: z.ZodMiniType<MatrixSettings> = /*#__PURE__*/ z.object({
  rows: options,
  columns: options,
  everyRow: z.optional(z.boolean()),
});

/**
 * A grid of rows and columns with one choice per row (a Likert table).
 * Value: an object from row value to column value. Issue codes:
 * `invalidType`, `invalidOption`, `incompleteRows`.
 *
 * @since 0.6.0
 */
export const matrix: FieldDefinition<
  MatrixSettings,
  Record<string, string>
> = /*#__PURE__*/ defineField({
  type: "matrix",
  settings: matrixSettings,
  defaultValue: () => undefined,
  isEmpty: (v) =>
    v === undefined ||
    v === null ||
    (typeof v === "object" && Object.values(v).every((x) => x === undefined || x === "")),
  validator: ({ settings }) => {
    const rows = new Set(settings.rows.map((r) => r.value));
    const columns = new Set(settings.columns.map((c) => c.value));
    return z.record(z.string(), z.string(), "invalidType").check(
      z.refine(
        (v) => Object.entries(v).every(([r, c]) => rows.has(r) && columns.has(c)),
        "invalidOption",
      ),
      z.refine(
        (v) => settings.everyRow === false || [...rows].every((r) => v[r] !== undefined),
        "incompleteRows",
      ),
    );
  },
});
