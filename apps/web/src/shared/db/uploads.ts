import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import type { Db } from "./client";
import { form, upload } from "./schema";

/** A stored file without its bytes, as kept in response data. */
export interface StoredFile {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
}

const DAY = 24 * 60 * 60 * 1000;

/** Stores a pending file for a field of a form; also removes stale pending files. */
export async function addUpload(
  db: Db,
  file: {
    readonly formId: string;
    readonly fieldKey: string;
    readonly name: string;
    readonly type: string;
    readonly data: Uint8Array;
  },
): Promise<StoredFile> {
  await db
    .delete(upload)
    .where(and(isNull(upload.responseId), lt(upload.createdAt, new Date(Date.now() - DAY))));
  const id = crypto.randomUUID();
  await db.insert(upload).values({ id, ...file, size: file.data.byteLength });
  return { id, name: file.name, type: file.type, size: file.data.byteLength };
}

/**
 * The pending files with these ids that were uploaded for `formId`, by id.
 * Files that belong to a response already, or to another form, are missing.
 */
export async function pendingUploads(
  db: Db,
  formId: string,
  ids: readonly string[],
): Promise<Map<string, StoredFile & { readonly fieldKey: string }>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({
      id: upload.id,
      name: upload.name,
      type: upload.type,
      size: upload.size,
      fieldKey: upload.fieldKey,
    })
    .from(upload)
    .where(and(eq(upload.formId, formId), isNull(upload.responseId), inArray(upload.id, [...ids])));
  return new Map(rows.map((r) => [r.id, r]));
}

/** Ties pending files to the response that names them. */
export async function attachUploads(
  db: Db,
  responseId: string,
  ids: readonly string[],
): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(upload)
    .set({ responseId })
    .where(and(inArray(upload.id, [...ids]), isNull(upload.responseId)));
}

/** A file of one of the owner's forms, with its bytes; only files of responses. */
export async function getUpload(
  db: Db,
  ownerId: string,
  formId: string,
  fileId: string,
): Promise<(StoredFile & { readonly data: Uint8Array }) | undefined> {
  const [row] = await db
    .select({
      id: upload.id,
      name: upload.name,
      type: upload.type,
      size: upload.size,
      data: upload.data,
      responseId: upload.responseId,
    })
    .from(upload)
    .innerJoin(form, eq(form.id, upload.formId))
    .where(and(eq(upload.id, fileId), eq(upload.formId, formId), eq(form.ownerId, ownerId)));
  if (!row?.responseId) return undefined;
  return { id: row.id, name: row.name, type: row.type, size: row.size, data: row.data };
}
