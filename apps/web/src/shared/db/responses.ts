import type { FormDocument } from "@formweave/schema";
import { and, count, desc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import type { Db } from "./client";
import { form, formVersion, response } from "./schema";

/** Filters for {@link listResponses}. */
export interface ResponseFilter {
  /** Only this version number. */
  readonly version?: number | undefined;
  /** Only responses at or after this time. */
  readonly from?: Date | undefined;
  /** Only responses at or before this time. */
  readonly to?: Date | undefined;
}

/** One stored response with its version number. */
export interface ResponseRow {
  readonly id: string;
  readonly version: number;
  readonly data: Record<string, unknown>;
  readonly locale: string | null;
  readonly createdAt: Date;
}

/** Published versions of one of the owner's forms, newest first. */
export async function listVersions(
  db: Db,
  ownerId: string,
  formId: string,
): Promise<{ id: string; version: number; document: FormDocument; createdAt: Date }[]> {
  return db
    .select({
      id: formVersion.id,
      version: formVersion.version,
      document: formVersion.document,
      createdAt: formVersion.createdAt,
    })
    .from(formVersion)
    .innerJoin(form, eq(form.id, formVersion.formId))
    .where(and(eq(form.id, formId), eq(form.ownerId, ownerId)))
    .orderBy(desc(formVersion.version));
}

function where(formId: string, filter: ResponseFilter): SQL | undefined {
  return and(
    eq(response.formId, formId),
    filter.version === undefined ? undefined : eq(formVersion.version, filter.version),
    filter.from ? gte(response.createdAt, filter.from) : undefined,
    filter.to ? lte(response.createdAt, filter.to) : undefined,
  );
}

/**
 * A page of one of the owner's form's responses, newest first, and the
 * number that match the filter. Returns `null` when the form is not theirs.
 */
export async function listResponses(
  db: Db,
  ownerId: string,
  formId: string,
  filter: ResponseFilter = {},
  page: { limit: number; offset: number } = { limit: 50, offset: 0 },
): Promise<{ rows: ResponseRow[]; total: number } | null> {
  const [owned] = await db
    .select({ id: form.id })
    .from(form)
    .where(and(eq(form.id, formId), eq(form.ownerId, ownerId)));
  if (!owned) return null;
  const condition = where(formId, filter);
  const [rows, [totals]] = await Promise.all([
    db
      .select({
        id: response.id,
        version: formVersion.version,
        data: response.data,
        locale: response.locale,
        createdAt: response.createdAt,
      })
      .from(response)
      .innerJoin(formVersion, eq(formVersion.id, response.versionId))
      .where(condition)
      .orderBy(desc(response.createdAt), desc(response.id))
      .limit(page.limit)
      .offset(page.offset),
    db
      .select({ total: count() })
      .from(response)
      .innerJoin(formVersion, eq(formVersion.id, response.versionId))
      .where(condition),
  ]);
  return { rows, total: totals?.total ?? 0 };
}

/** Deletes some of the owner's responses of one form. Returns how many went. */
export async function deleteResponses(
  db: Db,
  ownerId: string,
  formId: string,
  ids: readonly string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const [owned] = await db
    .select({ id: form.id })
    .from(form)
    .where(and(eq(form.id, formId), eq(form.ownerId, ownerId)));
  if (!owned) return 0;
  const gone = await db
    .delete(response)
    .where(and(eq(response.formId, formId), inArray(response.id, [...ids])))
    .returning({ id: response.id });
  return gone.length;
}
