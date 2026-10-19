import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * Settings of {@link hidden}.
 *
 * @since 0.6.0
 */
export interface HiddenSettings {
  /**
   * Name of a URL query parameter that fills the field on a hosted page,
   * for example `"utm_source"`. Host apps pass values with `defaultValues`.
   */
  readonly fromUrl?: string | undefined;
}

/**
 * A value people don't see: filled from the URL or by the host app and
 * submitted with the answers. Value: `string` (at most 1000 characters).
 *
 * @since 0.6.0
 */
export const hidden: FieldDefinition<HiddenSettings, string> = /*#__PURE__*/ defineField({
  type: "hidden",
  settings: z.object({ fromUrl: z.optional(z.string().check(z.regex(/^[\w.-]{1,64}$/))) }),
  defaultValue: () => undefined,
  validator: () => z.string("invalidType").check(z.maxLength(1000, "tooLong")),
});
