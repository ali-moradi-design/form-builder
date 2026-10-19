import { compile, createRegistry, validate, type ValidationIssue } from "@formweave/engine";
import { allFields } from "@formweave/engine/fields/all";
import { addResponse, getLiveForm, type Db } from "@/shared/db";

const registry = createRegistry(allFields);

/** Outcome of {@link acceptResponse}. */
export type AcceptResult =
  | { readonly ok: true; readonly id: string; readonly version: number }
  | { readonly ok: false; readonly reason: "notFound" }
  | { readonly ok: false; readonly reason: "invalid"; readonly issues: readonly ValidationIssue[] };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

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
  const id = await addResponse(db, {
    formId: live.formId,
    versionId: live.versionId,
    data: { ...result.data },
    locale: locale && supported.includes(locale) ? locale : live.document.locales.default,
  });
  return { ok: true, id, version: live.version };
}
