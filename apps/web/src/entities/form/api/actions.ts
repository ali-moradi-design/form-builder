"use server";

import type { FormDocument } from "@formweave/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/shared/auth";
import { resolveText } from "@formweave/engine/i18n";
import { createForm, deleteForm, getDb, publishForm, saveDraft, type Published } from "@/shared/db";

async function owner(): Promise<string> {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  return user.id;
}

/** Creates a form for the signed-in user and returns its id. */
export async function createMyForm(document: FormDocument): Promise<string> {
  const id = await createForm(await getDb(), await owner(), document);
  revalidatePath("/forms");
  return id;
}

/** Saves the draft of one of the signed-in user's forms. */
export async function saveMyDraft(id: string, document: FormDocument): Promise<boolean> {
  return saveDraft(await getDb(), await owner(), id, document);
}

/** Deletes one of the signed-in user's forms. */
export async function deleteMyForm(id: string): Promise<void> {
  await deleteForm(await getDb(), await owner(), id);
  revalidatePath("/forms");
}

/** Copies drafts kept in this browser (before accounts existed) into the account. */
export async function importMyDrafts(documents: readonly FormDocument[]): Promise<number> {
  const db = await getDb();
  const id = await owner();
  let imported = 0;
  for (const document of documents.slice(0, 50)) {
    try {
      await createForm(db, id, document);
      imported++;
    } catch {
      // Skip documents that are no longer valid.
    }
  }
  revalidatePath("/forms");
  return imported;
}

/**
 * Saves the given draft and publishes it as the next immutable version.
 * Returns the version number and the public slug.
 */
export async function publishMyForm(id: string, document: FormDocument): Promise<Published | null> {
  const db = await getDb();
  const ownerId = await owner();
  if (!(await saveDraft(db, ownerId, id, document))) return null;
  const title = resolveText(document.title, "en", document.locales.default);
  const published = await publishForm(db, ownerId, id, title);
  revalidatePath("/forms");
  return published ?? null;
}
