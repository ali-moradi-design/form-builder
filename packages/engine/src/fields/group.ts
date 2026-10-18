import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * Groups other fields under a heading. It has no value; its `fields` are
 * shown, hidden and disabled together.
 *
 * @since 0.1.0
 */
export const group: FieldDefinition<Record<string, never>, never> = /*#__PURE__*/ defineField({
  type: "group",
  settings: z.object({}),
  defaultValue: () => undefined,
  validator: () => z.never(),
  container: true,
});
