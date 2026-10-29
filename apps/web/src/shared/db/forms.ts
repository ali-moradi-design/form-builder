import type { FormDocument } from "@formcanvas/schema";
import { parseFormDocument } from "@formcanvas/schema/meta";
import { and, count, desc, eq } from "drizzle-orm";
import type { Db } from "./client";
import { form, formVersion, response } from "./schema";

/** A form as its owner sees it in lists. */
export interface FormSummary {
  readonly id: string;
  readonly draft: FormDocument;
  readonly slug: string | null;
  readonly liveVersion: number | null;
  readonly updatedAt: Date;
  readonly responses: number;
}

const newId = (): string => crypto.randomUUID();

function valid(document: unknown): FormDocument {
  const parsed = parseFormDocument(document);
  if (!parsed.success) throw new Error(`Invalid form document: ${parsed.issues[0]?.message ?? ""}`);
  return parsed.data;
}

/** The owner's forms, newest first, with their response counts. */
export async function listForms(db: Db, ownerId: string): Promise<FormSummary[]> {
  const rows = await db
    .select({
      id: form.id,
      draft: form.draft,
      slug: form.slug,
      liveVersion: form.liveVersion,
      updatedAt: form.updatedAt,
      responses: count(response.id),
    })
    .from(form)
    .leftJoin(response, eq(response.formId, form.id))
    .where(eq(form.ownerId, ownerId))
    .groupBy(form.id)
    .orderBy(desc(form.updatedAt));
  return rows;
}

/** One of the owner's forms, or `undefined`. */
export async function getForm(db: Db, ownerId: string, id: string) {
  const [row] = await db
    .select()
    .from(form)
    .where(and(eq(form.id, id), eq(form.ownerId, ownerId)));
  return row;
}

/** Creates a form from a document and returns its id (also written into the document). */
export async function createForm(db: Db, ownerId: string, document: FormDocument): Promise<string> {
  const id = newId();
  await db.insert(form).values({ id, ownerId, draft: valid({ ...document, id }) });
  return id;
}

/** Saves the draft of one of the owner's forms. Returns `false` when the form is not theirs. */
export async function saveDraft(
  db: Db,
  ownerId: string,
  id: string,
  document: unknown,
): Promise<boolean> {
  const draft = valid(document);
  const rows = await db
    .update(form)
    .set({ draft: { ...draft, id } })
    .where(and(eq(form.id, id), eq(form.ownerId, ownerId)))
    .returning({ id: form.id });
  return rows.length > 0;
}

/** Deletes one of the owner's forms with its versions and responses. */
export async function deleteForm(db: Db, ownerId: string, id: string): Promise<void> {
  await db.delete(form).where(and(eq(form.id, id), eq(form.ownerId, ownerId)));
}

/** Turns a title into a URL slug; non-Latin titles give `""`. */
export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/, "");
}

async function freeSlug(db: Db, base: string): Promise<string> {
  const root = base || "form";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 && base ? root : `${root}-${newId().slice(0, 6)}`;
    const [taken] = await db.select({ id: form.id }).from(form).where(eq(form.slug, candidate));
    if (!taken) return candidate;
  }
  throw new Error("Could not find a free slug.");
}

/** Result of {@link publishForm}. */
export interface Published {
  readonly version: number;
  readonly slug: string;
}

/**
 * Publishes the current draft as a new immutable version. The first publish
 * also gives the form its public slug, from `title`.
 */
export async function publishForm(
  db: Db,
  ownerId: string,
  id: string,
  title: string,
): Promise<Published | undefined> {
  const current = await getForm(db, ownerId, id);
  if (!current) return undefined;
  const document = valid(current.draft);
  const version = (current.liveVersion ?? 0) + 1;
  const slug = current.slug ?? (await freeSlug(db, slugify(title)));
  await db.transaction(async (tx) => {
    await tx.insert(formVersion).values({ id: newId(), formId: id, version, document });
    await tx.update(form).set({ liveVersion: version, slug }).where(eq(form.id, id));
  });
  return { version, slug };
}

/** The live version behind a public slug, or `undefined`. */
export async function getLiveForm(db: Db, slug: string) {
  const [row] = await db
    .select({
      formId: form.id,
      versionId: formVersion.id,
      version: formVersion.version,
      document: formVersion.document,
    })
    .from(form)
    .innerJoin(
      formVersion,
      and(eq(formVersion.formId, form.id), eq(formVersion.version, form.liveVersion)),
    )
    .where(eq(form.slug, slug));
  return row;
}

/** Stores a validated submission. */
export async function addResponse(
  db: Db,
  values: {
    formId: string;
    versionId: string;
    data: Record<string, unknown>;
    locale?: string | undefined;
  },
): Promise<string> {
  const id = newId();
  await db.insert(response).values({ id, ...values, locale: values.locale ?? null });
  return id;
}

/** Number of responses a form holds. */
export async function countResponses(db: Db, formId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(response).where(eq(response.formId, formId));
  return row?.n ?? 0;
}
