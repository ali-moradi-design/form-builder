import {
  compile,
  createRegistry,
  validate,
  type CompiledForm,
  type ValidationIssue,
} from "@formweave/engine";
import { allFields } from "@formweave/engine/fields/all";
import { addResponse, attachUploads, getLiveForm, pendingUploads, type Db } from "@/shared/db";

const registry = createRegistry(allFields);

/** Outcome of {@link acceptResponse}. */
export type AcceptResult =
  | {
      readonly ok: true;
      readonly id: string;
      readonly version: number;
      readonly formId: string;
      readonly slug: string;
      readonly locale: string;
      readonly data: Readonly<Record<string, unknown>>;
    }
  | { readonly ok: false; readonly reason: "notFound" }
  | { readonly ok: false; readonly reason: "invalid"; readonly issues: readonly ValidationIssue[] };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Field types whose values are references to uploaded files. */
export const FILE_TYPES: ReadonlySet<string> = new Set(["file", "imageUpload", "signature"]);

interface FileUse {
  /** Key of the file field (inside a row, the child key). */
  readonly field: string;
  /** Issue path, such as `people.0.photo`. */
  readonly path: string;
  readonly ref: Record<string, unknown>;
}

/** Every file reference in clean data, repeater rows included. */
function fileUses(form: CompiledForm, data: Record<string, unknown>, prefix = ""): FileUse[] {
  const out: FileUse[] = [];
  for (const [key, field] of form.fields) {
    const value = data[key];
    if (value === undefined) continue;
    if (FILE_TYPES.has(field.node.type)) {
      for (const ref of Array.isArray(value) ? value : [value])
        if (isRecord(ref)) out.push({ field: key, path: prefix + key, ref });
    } else if (field.rows && Array.isArray(value)) {
      value.forEach((row, i) => {
        if (isRecord(row) && field.rows)
          out.push(...fileUses(field.rows, row, `${prefix}${key}.${String(i)}.`));
      });
    }
  }
  return out;
}

/**
 * Validates answers against the live version of a form, on the server, and
 * stores only the clean data (visible fields, known keys).
 */
export async function acceptResponse(
  db: Db,
  slug: string,
  values: unknown,
  locale?: string,
): Promise<AcceptResult> {
  const live = await getLiveForm(db, slug);
  if (!live) return { ok: false, reason: "notFound" };
  const form = compile(live.document, { registry });
  const result = validate(form, isRecord(values) ? values : {});
  if (!result.success) return { ok: false, reason: "invalid", issues: result.issues };
  const supported = live.document.locales.supported ?? [live.document.locales.default];
  const stored = locale && supported.includes(locale) ? locale : live.document.locales.default;
  const data = { ...result.data };
  // Each file must be one uploaded for this form and field, not used yet.
  // Its name, size and type are taken from storage, not from the sender.
  const uses = fileUses(form, data);
  const pending = await pendingUploads(
    db,
    live.formId,
    uses.map((u) => String(u.ref.id)),
  );
  const seen = new Set<string>();
  const missing: ValidationIssue[] = [];
  for (const use of uses) {
    const file = pending.get(String(use.ref.id));
    if (!file || file.fieldKey !== use.field || seen.has(file.id)) {
      missing.push({ key: use.path, code: "fileMissing" });
      continue;
    }
    seen.add(file.id);
    Object.assign(use.ref, { name: file.name, size: file.size, type: file.type });
  }
  if (missing.length) return { ok: false, reason: "invalid", issues: missing };
  const id = await addResponse(db, {
    formId: live.formId,
    versionId: live.versionId,
    data,
    locale: stored,
  });
  await attachUploads(db, id, [...seen]);
  return { ok: true, id, version: live.version, formId: live.formId, slug, locale: stored, data };
}
