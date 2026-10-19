import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

// http(s), a host with a dot (no user info), optional port, then path/query/hash.
const WEB_URL = /^https?:\/\/[^\s/?#:@]+\.[^\s/?#:@]+(:\d{1,5})?([/?#]\S*)?$/i;

/**
 * A web address. Value: `string`, an absolute `http:` or `https:` URL.
 * Issue code: `invalidUrl`.
 *
 * @since 0.6.0
 */
export const url: FieldDefinition<Record<string, never>, string> = /*#__PURE__*/ defineField({
  type: "url",
  settings: z.object({}),
  defaultValue: () => undefined,
  validator: () =>
    z.string("invalidType").check(z.maxLength(2000, "tooLong"), z.regex(WEB_URL, "invalidUrl")),
});
