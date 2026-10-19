import type { FormDocument } from "@formweave/schema";
import { parseFormDocument, type DocumentIssue } from "@formweave/schema/meta";

/** Result of reading the JSON editor's text. */
export type JsonRead =
  | { readonly kind: "ok"; readonly doc: FormDocument }
  | { readonly kind: "syntax"; readonly message: string }
  | { readonly kind: "invalid"; readonly issues: readonly DocumentIssue[] };

/** Parses editor text into a valid form document, or says what is wrong. */
export function readJson(text: string): JsonRead {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    return { kind: "syntax", message: e instanceof Error ? e.message : String(e) };
  }
  const parsed = parseFormDocument(value);
  return parsed.success
    ? { kind: "ok", doc: parsed.data }
    : { kind: "invalid", issues: parsed.issues };
}

/** The text the editor shows for a document. */
export const toJson = (doc: FormDocument): string => `${JSON.stringify(doc, null, 2)}\n`;

/** A path like `steps[0].fields[2].key`. */
export function formatPath(path: readonly (string | number)[]): string {
  return path
    .map((p, i) => (typeof p === "number" ? `[${String(p)}]` : i === 0 ? p : `.${p}`))
    .join("");
}
