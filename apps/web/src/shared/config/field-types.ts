import type { FieldNode } from "@formweave/schema";
import {
  MapPin,
  ImageUp,
  Paperclip,
  Signature,
  Grid3x3,
  Images,
  ListChecks,
  ListOrdered,
  Tags,
  TextSearch,
  AlignLeft,
  Banknote,
  Calculator,
  Calendar,
  CalendarRange,
  CalendarClock,
  ChevronDown,
  CircleDot,
  Clock,
  EyeOff,
  Gauge,
  Group,
  ListPlus,
  Hash,
  Heading,
  Link,
  Mail,
  Minus,
  Palette,
  Phone,
  Pilcrow,
  SlidersHorizontal,
  SlidersVertical,
  SquareCheck,
  SwatchBook,
  Star,
  ToggleLeft,
  Type,
  type LucideIcon,
} from "lucide-react";

/** Palette sections, in display order. */
export const FIELD_GROUPS = [
  "text",
  "numbers",
  "choice",
  "color",
  "dateTime",
  "files",
  "structure",
] as const;

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
  { type: "url", group: "text", icon: Link, keyBase: "website", create: simple("url") },
  { type: "phone", group: "text", icon: Phone, keyBase: "phone", create: simple("phone") },
  { type: "number", group: "numbers", icon: Hash, keyBase: "number", create: simple("number") },
  {
    type: "currency",
    group: "numbers",
    icon: Banknote,
    keyBase: "amount",
    create: (key, label) => ({ type: "currency", key, label, settings: { currency: "USD" } }),
  },
  { type: "rating", group: "numbers", icon: Star, keyBase: "rating", create: simple("rating") },
  { type: "nps", group: "numbers", icon: Gauge, keyBase: "nps", create: simple("nps") },
  {
    type: "slider",
    group: "numbers",
    icon: SlidersHorizontal,
    keyBase: "amount",
    create: (key, label) => ({
      type: "slider",
      key,
      label,
      settings: { min: 0, max: 10, step: 1 },
    }),
  },
  {
    type: "calculated",
    group: "numbers",
    icon: Calculator,
    keyBase: "total",
    create: simple("calculated"),
  },
  {
    type: "rangeSlider",
    group: "numbers",
    icon: SlidersVertical,
    keyBase: "between",
    create: (key, label) => ({
      type: "rangeSlider",
      key,
      label,
      settings: { min: 0, max: 100, step: 1 },
    }),
  },

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
  {
    type: "combobox",
    group: "choice",
    icon: TextSearch,
    keyBase: "pick",
    create: choice("combobox"),
  },
  {
    type: "multiSelect",
    group: "choice",
    icon: ListChecks,
    keyBase: "picks",
    create: choice("multiSelect"),
  },
  { type: "tags", group: "choice", icon: Tags, keyBase: "tags", create: simple("tags") },
  {
    type: "ranking",
    group: "choice",
    icon: ListOrdered,
    keyBase: "ranking",
    create: choice("ranking"),
  },
  {
    type: "imageChoice",
    group: "choice",
    icon: Images,
    keyBase: "picture",
    create: (key, label) => ({
      type: "imageChoice",
      key,
      label,
      settings: {
        options: [1, 2].map((n) => ({
          value: `option${String(n)}`,
          label: `Option ${String(n)}`,
          image: "/option-placeholder.svg",
        })),
      },
    }),
  },
  {
    type: "matrix",
    group: "choice",
    icon: Grid3x3,
    keyBase: "grid",
    create: (key, label) => ({
      type: "matrix",
      key,
      label,
      settings: {
        rows: [1, 2].map((n) => ({ value: `row${String(n)}`, label: `Row ${String(n)}` })),
        columns: [1, 2, 3].map((n) => ({
          value: String(n),
          label: `Column ${String(n)}`,
        })),
      },
    }),
  },
  { type: "color", group: "color", icon: Palette, keyBase: "color", create: simple("color") },
  {
    type: "colorSet",
    group: "color",
    icon: SwatchBook,
    keyBase: "colors",
    create: simple("colorSet"),
  },
  { type: "date", group: "dateTime", icon: Calendar, keyBase: "date", create: simple("date") },
  {
    type: "dateRange",
    group: "dateTime",
    icon: CalendarRange,
    keyBase: "dates",
    create: simple("dateRange"),
  },
  { type: "time", group: "dateTime", icon: Clock, keyBase: "time", create: simple("time") },
  {
    type: "dateTime",
    group: "dateTime",
    icon: CalendarClock,
    keyBase: "when",
    create: simple("dateTime"),
  },
  {
    type: "address",
    group: "text",
    icon: MapPin,
    keyBase: "address",
    create: simple("address"),
  },
  {
    type: "file",
    group: "files",
    icon: Paperclip,
    keyBase: "files",
    create: (key, label) => ({ type: "file", key, label, settings: { maxFiles: 3 } }),
  },
  {
    type: "imageUpload",
    group: "files",
    icon: ImageUp,
    keyBase: "photo",
    create: simple("imageUpload"),
  },
  {
    type: "signature",
    group: "files",
    icon: Signature,
    keyBase: "signature",
    create: simple("signature"),
  },
  {
    type: "group",
    group: "structure",
    icon: Group,
    keyBase: "group",
    create: (key, label) => ({ type: "group", key, label, fields: [] }),
  },
  {
    type: "repeater",
    group: "structure",
    icon: ListPlus,
    keyBase: "items",
    create: (key, label) => ({
      type: "repeater",
      key,
      label,
      settings: { minRows: 1, maxRows: 5 },
      fields: [],
    }),
  },
  {
    type: "heading",
    group: "structure",
    icon: Heading,
    keyBase: "heading",
    create: simple("heading"),
  },
  {
    type: "paragraph",
    group: "structure",
    icon: Pilcrow,
    keyBase: "text_block",
    create: simple("paragraph"),
  },
  {
    type: "divider",
    group: "structure",
    icon: Minus,
    keyBase: "divider",
    create: (key) => ({ type: "divider", key }),
  },
  { type: "hidden", group: "structure", icon: EyeOff, keyBase: "source", create: simple("hidden") },
];

/** Looks up a field type; `undefined` for types the builder does not know. */
export function fieldType(type: string): FieldTypeInfo | undefined {
  return FIELD_TYPES.find((t) => t.type === type);
}

/** Field types that hold other fields (the builder shows a drop area inside). */
export const CONTAINER_TYPES: ReadonlySet<string> = new Set(["group", "repeater"]);

/** Field types that show something but hold no answer (no response column). */
export const DISPLAY_TYPES: ReadonlySet<string> = new Set([
  "group",
  "heading",
  "paragraph",
  "divider",
]);

/** Field types whose answers are numbers (summarised with statistics). */
export const NUMBER_TYPES: ReadonlySet<string> = new Set([
  "number",
  "currency",
  "calculated",
  "rating",
  "nps",
  "slider",
]);

/** Field types whose answers are colours (summarised with swatches). */
export const COLOR_TYPES: ReadonlySet<string> = new Set(["color", "colorSet"]);
