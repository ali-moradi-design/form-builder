import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

const MAX_URL = 2000;

// http(s), a host with a dot (no user info), optional port, then path/query/hash.
// Host labels exclude ".", so matching takes linear time on any input.
const WEB_URL = /^https?:\/\/[^\s/?#:@.]+(?:\.[^\s/?#:@.]+)+(?::\d{1,5})?(?:[/?#]\S*)?$/i;

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
    z.string("invalidType").check(
      z.maxLength(MAX_URL, "tooLong"),
      // The length test first: a long value is never handed to the pattern.
      z.refine((v) => v.length <= MAX_URL && WEB_URL.test(v), "invalidUrl"),
    ),
});
