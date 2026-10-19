import type { FieldNode } from "@formweave/schema";
import {
  AlignLeft,
  Calendar,
  ChevronDown,
  CircleDot,
  Group,
  Hash,
  Mail,
  SquareCheck,
  ToggleLeft,
  Type,
  type LucideIcon,
} from "lucide-react";

/** Palette sections, in display order. */
export const FIELD_GROUPS = ["text", "numbers", "choice", "dateTime", "structure"] as const;

/** A palette section. */
export type FieldGroup = (typeof FIELD_GROUPS)[number];

/** A field type the builder can add. Its name comes from `fieldTypes.<type>`. */
export interface FieldTypeInfo {
  readonly type: string;
  readonly group: FieldGroup;
  readonly icon: LucideIcon;
  /** Short key prefix for new fields. */
  readonly keyBase: string;
  /** Builds a new field with this key and a starting label. */
  readonly create: (key: string, label: string) => FieldNode;
}

const simple =
  (type: string) =>
  (key: string, label: string): FieldNode => ({ type, key, label });

const choice =
  (type: string) =>
  (key: string, label: string): FieldNode => ({
    type,
    key,
    label,
    settings: {
      options: [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
      ],
    },
  });

/** Field types in palette order. */
export const FIELD_TYPES: readonly FieldTypeInfo[] = [
  { type: "shortText", group: "text", icon: Type, keyBase: "text", create: simple("shortText") },
  { type: "longText", group: "text", icon: AlignLeft, keyBase: "text", create: simple("longText") },
  { type: "email", group: "text", icon: Mail, keyBase: "email", create: simple("email") },
  { type: "number", group: "numbers", icon: Hash, keyBase: "number", create: simple("number") },
  {
    type: "select",
    group: "choice",
    icon: ChevronDown,
    keyBase: "choice",
    create: choice("select"),
  },
  { type: "radio", group: "choice", icon: CircleDot, keyBase: "choice", create: choice("radio") },
  {
    type: "checkboxes",
    group: "choice",
    icon: SquareCheck,
    keyBase: "choices",
    create: choice("checkboxes"),
  },
  { type: "switch", group: "choice", icon: ToggleLeft, keyBase: "yes", create: simple("switch") },
  { type: "date", group: "dateTime", icon: Calendar, keyBase: "date", create: simple("date") },
  {
    type: "group",
    group: "structure",
    icon: Group,
    keyBase: "group",
    create: (key, label) => ({ type: "group", key, label, fields: [] }),
  },
];

/** Looks up a field type; `undefined` for types the builder does not know. */
export function fieldType(type: string): FieldTypeInfo | undefined {
  return FIELD_TYPES.find((t) => t.type === type);
}
