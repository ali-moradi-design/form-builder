/**
 * A BCP 47 language tag, for example `"en"` or `"fa"`.
 *
 * @since 0.1.0
 */
export type Locale = string;

/**
 * Text shown to people who fill in the form.
 *
 * Either one string used for every language, or one string per locale:
 *
 * ```json
 * { "en": "Your name", "fa": "نام شما" }
 * ```
 *
 * When a locale is missing, the form's default locale is used.
 *
 * @since 0.1.0
 */
export type LocalizedText = string | Readonly<Record<Locale, string>>;

/**
 * A constant value inside an {@link Expression}.
 *
 * @since 0.1.0
 */
export type Literal = string | number | boolean | null;

/**
 * Reads the current value of another field inside an {@link Expression}.
 *
 * @example
 * ```json
 * { "var": "employment_type" }
 * ```
 * @since 0.1.0
 */
export interface VarRef {
  /** The `key` of the field whose value is read. */
  readonly var: string;
}

/**
 * Every operator an {@link Expression} may use. Anything else is rejected, so
 * a form document can never run arbitrary code.
 *
 * - Logic: `and`, `or`, `not`, `if` (`[condition, then, else]`).
 * - Comparison: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in` (value is in a list).
 * - Presence: `empty`, `notEmpty`.
 * - Math: `add`, `sub`, `mul`, `div`, `mod`, `min`, `max`, `round`.
 * - Text and lists: `concat`, `len`.
 *
 * @since 0.1.0
 */
export const OPERATORS = [
  "and",
  "or",
  "not",
  "if",
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "empty",
  "notEmpty",
  "add",
  "sub",
  "mul",
  "div",
  "mod",
  "min",
  "max",
  "round",
  "concat",
  "len",
] as const;

/**
 * Name of an operator from {@link OPERATORS}.
 *
 * @since 0.1.0
 */
export type Operator = (typeof OPERATORS)[number];

/**
 * Applies an {@link Operator} to its arguments.
 *
 * @example
 * ```json
 * { "op": "eq", "args": [{ "var": "plan" }, "team"] }
 * ```
 * @since 0.1.0
 */
export interface Call {
  /** The operator to apply. */
  readonly op: Operator;
  /** The operator's arguments, in order. Each one is itself an expression. */
  readonly args: readonly Expression[];
}

/**
 * Logic stored as data: a {@link Literal}, a field reference ({@link VarRef})
 * or an operator call ({@link Call}). Used for conditions and calculated
 * values. The engine evaluates it with a small interpreter; nothing in a form
 * document is executed as code.
 *
 * @since 0.1.0
 */
export type Expression = Literal | VarRef | Call;

/**
 * How much of a row a field takes on wide screens. On narrow screens every
 * field takes the full row.
 *
 * @since 0.1.0
 */
export type FieldWidth = "full" | "half";

/**
 * One field of a form. The engine's field registry decides which `type`
 * values exist and what their `settings` may contain.
 *
 * @since 0.1.0
 */
export interface FieldNode {
  /** Field type, for example `"shortText"` or `"rating"`. Must exist in the registry. */
  readonly type: string;
  /**
   * Name of the value in submitted data. Unique within the whole form; starts
   * with a letter and contains only letters, digits and `_`.
   */
  readonly key: string;
  /** Question or label shown above the field. */
  readonly label?: LocalizedText | undefined;
  /** Extra guidance shown under the field. */
  readonly help?: LocalizedText | undefined;
  /** Text shown inside an empty input. */
  readonly placeholder?: LocalizedText | undefined;
  /**
   * Whether an answer is needed before the form can be submitted.
   *
   * @defaultValue `false`
   */
  readonly required?: boolean | undefined;
  /** Shows the field only while this expression is true. Hidden fields are not validated or submitted. */
  readonly visibleWhen?: Expression | undefined;
  /** Makes the field required while this expression is true, in addition to `required`. */
  readonly requiredWhen?: Expression | undefined;
  /** Makes the field read-only while this expression is true. */
  readonly disabledWhen?: Expression | undefined;
  /**
   * Width on wide screens.
   *
   * @defaultValue `"full"`
   */
  readonly width?: FieldWidth | undefined;
  /** Options that only this field type understands, checked by the field registry. */
  readonly settings?: Readonly<Record<string, unknown>> | undefined;
  /** Child fields, for container types such as groups and repeaters. */
  readonly fields?: readonly FieldNode[] | undefined;
}

/**
 * One page of a form. A form with a single step shows all its fields at once.
 *
 * @since 0.1.0
 */
export interface Step {
  /** Identifier of the step, unique within the form. */
  readonly key: string;
  /** Title shown at the top of the step and in the progress indicator. */
  readonly title?: LocalizedText | undefined;
  /** Short text under the title. */
  readonly description?: LocalizedText | undefined;
  /** Shows the step only while this expression is true. */
  readonly visibleWhen?: Expression | undefined;
  /** Fields of the step, in display order. */
  readonly fields: readonly FieldNode[];
}

/**
 * Languages a form is written in.
 *
 * @since 0.1.0
 */
export interface FormLocales {
  /** Locale used when a text has no entry for the reader's locale. */
  readonly default: Locale;
  /**
   * All locales the form offers, including the default one.
   *
   * @defaultValue `[default]`
   */
  readonly supported?: readonly Locale[] | undefined;
}

/**
 * A complete form: the JSON document that the builder edits, the API stores
 * and the renderer draws.
 *
 * @example
 * ```json
 * {
 *   "schemaVersion": 1,
 *   "id": "feedback",
 *   "title": { "en": "Product feedback", "fa": "نظرسنجی محصول" },
 *   "locales": { "default": "en", "supported": ["en", "fa"] },
 *   "steps": [
 *     { "key": "main", "fields": [{ "type": "shortText", "key": "name", "required": true }] }
 *   ]
 * }
 * ```
 * @since 0.1.0
 */
export interface FormDocument {
  /** Version of this document format. See {@link SCHEMA_VERSION}. */
  readonly schemaVersion: 1;
  /** Identifier of the form, unique per account. */
  readonly id: string;
  /** Name of the form, shown at the top and in the browser tab. */
  readonly title: LocalizedText;
  /** Introduction shown under the title. */
  readonly description?: LocalizedText | undefined;
  /** Languages of the form. */
  readonly locales: FormLocales;
  /** Pages of the form, in order. At least one. */
  readonly steps: readonly Step[];
}

/**
 * Version of the form document format that this package describes.
 *
 * Every form document stores the version it was written with in its
 * `schemaVersion` field. Documents with an older version are upgraded by
 * `migrate` from `@formweave/engine` before they are used.
 *
 * @since 0.1.0
 */
export const SCHEMA_VERSION = 1 as const;
