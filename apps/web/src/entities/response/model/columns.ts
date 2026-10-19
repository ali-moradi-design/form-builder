import { resolveText } from "@formweave/engine/i18n";
import type { FieldNode, FormDocument, Locale } from "@formweave/schema";

/** One answer column of the responses table and exports. */
export interface ResponseColumn {
  /** The field key (the key in response data). */
  readonly key: string;
  /** Header text in the reader's language. */
  readonly label: string;
  /** Field type in the newest version that has the field. */
  readonly type: string;
  /** Option value → label, for choice fields. */
  readonly options?: ReadonlyMap<string, string> | undefined;
}

function* answerFields(fields: readonly FieldNode[]): Generator<FieldNode> {
  for (const f of fields) {
    if (f.fields) yield* answerFields(f.fields);
    else yield f;
  }
}

/**
 * Answer columns for a form: fields of the newest version first, in form
 * order, then fields that only older versions had. Groups are flattened.
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
        const raw = f.settings?.options;
        const options = Array.isArray(raw)
          ? new Map(
              (raw as { value: string; label?: Parameters<typeof resolveText>[0] }[]).map((o) => [
                o.value,
                resolveText(o.label, locale, fallback) || o.value,
              ]),
            )
          : undefined;
        out.push({
          key: f.key,
          label: resolveText(f.label, locale, fallback) || f.key,
          type: f.type,
          options,
        });
      }
    }
  }
  return out;
}

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
  if (Array.isArray(value)) return value.map(label).join(", ");
  return label(value);
}
