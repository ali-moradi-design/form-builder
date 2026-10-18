import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";
import { count, text } from "./shared.js";

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

const textSettings: z.ZodMiniType<TextSettings> = /*#__PURE__*/ z.object({
  minLength: count,
  maxLength: count,
});

/**
 * One line of text. Value: `string`. Issue codes: `tooShort`, `tooLong`.
 *
 * @since 0.1.0
 */
export const shortText: FieldDefinition<TextSettings, string> = /*#__PURE__*/ defineField({
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
export const longText: FieldDefinition<TextSettings, string> = /*#__PURE__*/ defineField({
  type: "longText",
  settings: textSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) => text(settings.minLength, settings.maxLength ?? 5000),
});
