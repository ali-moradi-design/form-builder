import type { FieldNode, FormDocument } from "@formweave/schema";

// Builds form fields from one sample record, so a form can start from the
// data it should collect. Types are guessed from values; people review and
// change them in the builder.

/**
 * Options for {@link inferFields} and {@link inferForm}.
 *
 * @since 0.7.0
 */
export interface InferOptions {
  /**
   * Text longer than this becomes a long text field.
   *
   * @defaultValue `80`
   */
  readonly longText?: number | undefined;
  /**
   * Deepest nesting of groups and repeaters to follow; deeper values are
   * left out.
   *
   * @defaultValue `4`
   */
  readonly depth?: number | undefined;
}

const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const URL_RE = /^https?:\/\/\S+$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const PHONE = /^\+\d[\d\s-]{6,}$/;

/**
 * A readable label from a key: `brandColor`, `brand_color` → "Brand color".
 *
 * @param key - The key.
 * @returns The label.
 * @since 0.7.0
 */
export function labelFromKey(key: string): string {
  const words = key
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .trim()
    .toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : key;
}

const cleanKey = (key: string): string => {
  const k = key.replace(/[^\w]/g, "_").replace(/^(\d)/, "_$1");
  return k || "field";
};

// The field type a single value suggests.
function typeOf(value: string | number | boolean, long: number): FieldNode["type"] {
  if (typeof value === "boolean") return "switch";
  if (typeof value === "number") return "number";
  const v = value.trim();
  if (EMAIL.test(v)) return "email";
  if (URL_RE.test(v)) return "url";
  if (DATE.test(v)) return "date";
  if (DATE_TIME.test(v)) return "dateTime";
  if (TIME.test(v)) return "time";
  if (HEX.test(v)) return "color";
  if (PHONE.test(v)) return "phone";
  return v.length > long || v.includes("\n") ? "longText" : "shortText";
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * Guesses form fields from one sample record:
 *
 * - text → short or long text, email, URL, phone, date, date-time, time or colour;
 * - number → number (whole numbers only when every sample is whole);
 * - `true`/`false` → switch;
 * - object → group of its fields;
 * - array of objects → repeater (fields from all rows);
 * - array of colours → colour set; other arrays of text → tags.
 *
 * Keys are kept when they are valid and unique in the form, so the data fits
 * the sample; otherwise they get the parent's key as a prefix.
 *
 * @param sample - One record, such as a row from an API.
 * @param options - See {@link InferOptions}.
 * @returns The fields, in the record's key order.
 * @example
 * ```ts
 * inferFields({ name: "Sara", joined: "2026-03-14", seats: 12 });
 * // shortText "name", date "joined", number "seats" (whole)
 * ```
 * @since 0.7.0
 */
export function inferFields(sample: unknown, options: InferOptions = {}): FieldNode[] {
  const long = options.longText ?? 80;
  // "main" is the step key of inferForm.
  const used = new Set<string>(["main"]);
  const keyFor = (raw: string, parent: string | undefined): string => {
    let key = cleanKey(raw);
    if (used.has(key) && parent) key = `${parent}_${key}`;
    let n = 2;
    const base = key;
    while (used.has(key)) key = `${base}${String(n++)}`;
    used.add(key);
    return key;
  };

  const fromRecord = (
    record: Record<string, unknown>,
    parent: string | undefined,
    depth: number,
    // For repeaters: every row, to merge keys and check number kinds.
    rows: readonly Record<string, unknown>[] = [record],
  ): FieldNode[] => {
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    const out: FieldNode[] = [];
    for (const raw of keys) {
      const values = rows.map((r) => r[raw]).filter((v) => v !== undefined && v !== null);
      const value = values[0];
      if (value === undefined) continue;
      const key = keyFor(raw, parent);
      const label = labelFromKey(raw);
      if (isRecord(value)) {
        if (depth <= 0) continue;
        const children = fromRecord(value, key, depth - 1, values.filter(isRecord));
        if (children.length) out.push({ type: "group", key, label, fields: children });
        continue;
      }
      if (Array.isArray(value)) {
        const items = values.flatMap((v) => (Array.isArray(v) ? (v as unknown[]) : []));
        const objects = items.filter(isRecord);
        if (objects.length && depth > 0) {
          const children = fromRecord(objects[0] ?? {}, key, depth - 1, objects);
          if (children.length) out.push({ type: "repeater", key, label, fields: children });
          continue;
        }
        const texts = items.filter((v): v is string => typeof v === "string");
        if (texts.length && texts.every((t) => HEX.test(t))) {
          out.push({ type: "colorSet", key, label });
        } else if (texts.length || items.length === 0) {
          out.push({ type: "tags", key, label });
        }
        continue;
      }
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        const type = typeOf(value, long);
        const node: FieldNode = { type, key, label };
        if (type === "number" && values.every((v) => Number.isInteger(v)))
          out.push({ ...node, settings: { integer: true } });
        else out.push(node);
      }
    }
    return out;
  };

  if (Array.isArray(sample)) {
    const rows = sample.filter(isRecord);
    return rows.length ? fromRecord(rows[0] ?? {}, undefined, options.depth ?? 4, rows) : [];
  }
  return isRecord(sample) ? fromRecord(sample, undefined, options.depth ?? 4) : [];
}

/**
 * A whole form document from one sample record (or an array of them), with
 * one step holding {@link inferFields}.
 *
 * @param sample - The sample data.
 * @param title - The form's title.
 * @param options - See {@link InferOptions}.
 * @returns The document.
 * @since 0.7.0
 */
export function inferForm(sample: unknown, title: string, options?: InferOptions): FormDocument {
  return {
    schemaVersion: 1,
    id: "inferred",
    title,
    locales: { default: "en" },
    steps: [{ key: "main", fields: inferFields(sample, options) }],
  };
}
