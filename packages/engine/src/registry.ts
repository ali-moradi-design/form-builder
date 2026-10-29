import type * as z from "zod/mini";
import type { ChoiceOption } from "./fields/shared.js";

/**
 * What a field definition receives when it builds the validator for a value.
 *
 * @typeParam S - The field's settings type.
 * @since 0.1.0
 */
export interface ValidatorContext<S> {
  /** The field's settings, already checked against {@link FieldDefinition.settings}. */
  readonly settings: S;
}

/**
 * Describes one field type: its settings, its default value and how its value
 * is validated. Register definitions with {@link createRegistry}; the core
 * never needs to change to add a type.
 *
 * Validators report problems with a message that is an issue code such as
 * `"required"` or `"tooLong"`, not a sentence. The renderer turns codes into
 * text in the reader's language.
 *
 * @typeParam S - Settings stored in the field's `settings` object.
 * @typeParam V - The value the field produces.
 * @since 0.1.0
 */
export interface FieldDefinition<S = unknown, V = unknown> {
  /** The `type` string used in form documents, for example `"shortText"`. */
  readonly type: string;
  /** Schema for the field's `settings`. An empty object is passed when a field has none. */
  readonly settings: z.ZodMiniType<S>;
  /**
   * Value of a new, untouched field.
   *
   * @param settings - The field's settings.
   * @returns The starting value, or `undefined` for an empty field.
   */
  readonly defaultValue: (settings: S) => V | undefined;
  /**
   * Builds the validator for a non-empty value. Emptiness and the `required`
   * rule are handled by the engine, so this only checks values that exist.
   *
   * @param ctx - Settings of the field.
   * @returns A Zod schema for the value.
   */
  readonly validator: (ctx: ValidatorContext<S>) => z.ZodMiniType<V>;
  /**
   * Whether a value counts as empty for the `required` rule.
   *
   * @defaultValue `undefined`, `null`, `""` and `[]` are empty.
   */
  readonly isEmpty?: ((value: unknown) => boolean) | undefined;
  /**
   * `true` for types that only hold other fields (for example a group). They
   * have no value of their own.
   *
   * @defaultValue `false`
   */
  readonly container?: boolean | undefined;
  /**
   * `true` for types whose value is a list of rows, each row holding the
   * values of the field's child `fields` (for example a repeater). The engine
   * checks every row against the children; the type's own validator only
   * checks the list (for example the number of rows).
   *
   * @defaultValue `false`
   * @since 0.6.0
   */
  readonly rows?: boolean | undefined;
  /**
   * Keys of other fields that this field's settings read, for example the
   * field that picks a dependent list. Used for the dependency graph.
   *
   * @param settings - The field's settings.
   * @returns The keys.
   * @since 0.6.0
   */
  readonly reads?: ((settings: S) => readonly string[]) | undefined;
  /**
   * The choices offered for the current answers, for types whose options
   * can change (dependent lists). `undefined` means "not known here" (for
   * example loaded from a URL). `evaluate` puts them in the field state and
   * `validate` checks answers against them.
   *
   * @param settings - The field's settings.
   * @param read - Reads another field's value.
   * @returns The choices, or `undefined`.
   * @since 0.6.0
   */
  readonly options?:
    | ((settings: S, read: (key: string) => unknown) => readonly ChoiceOption[] | undefined)
    | undefined;
}

/**
 * Identity helper that keeps the settings and value types of a definition
 * connected, so `defaultValue` and `validator` are checked against `settings`.
 *
 * @param definition - The field definition.
 * @returns The same definition.
 * @example
 * ```ts
 * const rating = defineField({
 *   type: "rating",
 *   settings: z.object({ max: z._default(z.number(), 5) }),
 *   defaultValue: () => undefined,
 *   validator: ({ settings }) => z.number().check(z.gte(1), z.lte(settings.max)),
 * });
 * ```
 * @since 0.1.0
 */
export function defineField<S, V>(definition: FieldDefinition<S, V>): FieldDefinition<S, V> {
  return definition;
}

/**
 * A {@link FieldDefinition} with any settings and value types. Definitions
 * are invariant in their settings, so this is the type that every
 * definition, built-in or custom, can be passed as.
 *
 * @since 0.7.0
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the only type every definition is assignable to
export type AnyFieldDefinition = FieldDefinition<any, any>;

/**
 * Field definitions available to {@link compile}, looked up by `type`.
 *
 * @since 0.1.0
 */
export type FieldRegistry = ReadonlyMap<string, FieldDefinition>;

/**
 * Builds a {@link FieldRegistry} from field definitions. Only the types passed
 * here are bundled, which keeps forms that use few types small.
 *
 * @param definitions - Field definitions; a later one replaces an earlier one with the same `type`.
 * @returns The registry.
 * @example
 * ```ts
 * import { shortText, email } from "@formcanvas/engine/fields";
 * const registry = createRegistry([shortText, email]);
 * ```
 * @since 0.1.0
 */
export function createRegistry(
  definitions: Iterable<AnyFieldDefinition | FieldDefinition<never>>,
): FieldRegistry {
  const map = new Map<string, FieldDefinition>();
  for (const d of definitions) map.set(d.type, d as FieldDefinition);
  return map;
}
