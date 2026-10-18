import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * An email address. Value: `string`. Issue code: `invalidEmail`.
 *
 * @since 0.1.0
 */
export const email: FieldDefinition<Record<string, never>, string> = /*#__PURE__*/ defineField({
  type: "email",
  settings: z.object({}),
  defaultValue: () => undefined,
  validator: () => z.email("invalidEmail").check(z.maxLength(254, "tooLong")),
});
