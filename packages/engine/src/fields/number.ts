import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

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
export const number: FieldDefinition<NumberSettings, number> = /*#__PURE__*/ defineField({
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
