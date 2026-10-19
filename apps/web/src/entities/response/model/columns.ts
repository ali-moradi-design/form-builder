import { resolveText } from "@formweave/engine/i18n";
import type { FieldNode, FormDocument, Locale } from "@formweave/schema";
import { DISPLAY_TYPES } from "@/shared/config";

/** One answer column of the responses table and exports. */
export interface ResponseColumn {
  /** The field key (the key in response data). */
  readonly key: string;
  /** Header text in the reader's language. */
  readonly label: string;
  /** Field type in the newest version that has the field. */
  readonly type: string;
  /** Option value → label, for choice fields (columns, for a matrix). */
  readonly options?: ReadonlyMap<string, string> | undefined;
  /** Row value → label, for a matrix. */
  readonly rows?: ReadonlyMap<string, string> | undefined;
}

function* answerFields(fields: readonly FieldNode[]): Generator<FieldNode> {
  for (const f of fields) {
    // A repeater is one answer (its rows); a group only holds other answers.
    if (f.fields && f.type !== "repeater") yield* answerFields(f.fields);
    else if (!DISPLAY_TYPES.has(f.type)) yield f;
  }
}

/**
 * Answer columns for a form: fields of the newest version first, in form
 * order, then fields that only older versions had. Groups are flattened;
 * display-only fields (headings, paragraphs, dividers) are left out.
 *
 * @param versions - Documents of the published versions, newest first.
 */
export function responseColumns(
  versions: readonly FormDocument[],
  locale: Locale,
): ResponseColumn[] {
  const seen = new Set<string>();
  const out: ResponseColumn[] = [];
  for (const doc of versions) {
    const fallback = doc.locales.default;
    for (const step of doc.steps) {
      for (const f of answerFields(step.fields)) {
        if (seen.has(f.key)) continue;
        seen.add(f.key);
        const labels = (raw: unknown) =>
          Array.isArray(raw)
            ? new Map(
                (raw as { value: string; label?: Parameters<typeof resolveText>[0] }[]).map((o) => [
                  o.value,
                  resolveText(o.label, locale, fallback) || o.value,
                ]),
              )
            : undefined;
        const options = labels(f.settings?.options ?? f.settings?.columns);
        const rows = labels(f.settings?.rows);
        out.push({
          key: f.key,
          label: resolveText(f.label, locale, fallback) || f.key,
          type: f.type,
          options,
          ...(rows ? { rows } : {}),
        });
      }
    }
  }
  return out;
}

/** Whether a value is a stored file's reference (`{ id, name, size, type }`). */
export const isFileRef = (v: unknown): v is { id: string; name: string } =>
  v !== null &&
  typeof v === "object" &&
  typeof (v as { id?: unknown }).id === "string" &&
  typeof (v as { name?: unknown }).name === "string" &&
  typeof (v as { size?: unknown }).size === "number";

/** The files of an answer, for download links. */
export const filesOf = (v: unknown): { id: string; name: string }[] =>
  (Array.isArray(v) ? v : [v]).filter(isFileRef).map((f) => ({ id: f.id, name: f.name }));

/** An answer as plain text for tables and CSV: option labels, lists joined, yes/no. */
export function formatAnswer(
  column: ResponseColumn | undefined,
  value: unknown,
  yesNo: readonly [string, string] = ["Yes", "No"],
): string {
  if (value === undefined || value === null || value === "") return "";
  const label = (v: unknown): string => {
    if (typeof v === "string") return column?.options?.get(v) ?? v;
    if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") return String(v);
    return JSON.stringify(v);
  };
  if (typeof value === "boolean") return value ? yesNo[0] : yesNo[1];
  if (isFileRef(value)) return value.name;
  if (Array.isArray(value) && value.length > 0 && value.every(isFileRef))
    return value.map((f) => f.name).join(", ");
  if (Array.isArray(value)) {
    // Repeater rows: "Sara / 34; Nima / 9".
    if (value.some((v) => v !== null && typeof v === "object" && !Array.isArray(v)))
      return value
        .map((row) =>
          Object.values(row as Record<string, unknown>)
            .map((v) => formatAnswer(undefined, v, yesNo))
            .join(" / "),
        )
        .join("; ");
    return value.map(label).join(", ");
  }
  if (typeof value === "object" && column?.rows) {
    // A matrix: "Talks: Good; Venue: Poor".
    return Object.entries(value as Record<string, unknown>)
      .map(([r, c]) => `${column.rows?.get(r) ?? r}: ${label(c)}`)
      .join("; ");
  }
  if (typeof value === "object" && ("from" in value || "to" in value)) {
    // A range: "start – end", with an empty end left blank.
    const r = value as { from?: unknown; to?: unknown };
    return `${r.from === undefined ? "" : label(r.from)} – ${r.to === undefined ? "" : label(r.to)}`;
  }
  return label(value);
}
