import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * An on/off switch. Value: `boolean`, starting as `false`. When required, it
 * must be on (useful for "I accept the terms").
 *
 * @since 0.1.0
 */
export const toggle: FieldDefinition<Record<string, never>, boolean> = /*#__PURE__*/ defineField({
  type: "switch",
  settings: z.object({}),
  defaultValue: () => false,
  validator: () => z.boolean("invalidType"),
  isEmpty: (v) => v !== true,
});
