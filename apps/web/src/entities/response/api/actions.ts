"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getUser } from "@/shared/auth";
import { deleteResponses, getDb } from "@/shared/db";
import { clientIp, submit, type SubmitResult } from "../model/submit";

/** Submits answers to a published form (used by the hosted page). */
export async function submitResponse(
  slug: string,
  values: unknown,
  locale: string | undefined,
  honeypot: string,
): Promise<SubmitResult> {
  return submit(await getDb(), { slug, values, locale, honeypot, ip: clientIp(await headers()) });
}

/** Deletes some responses of one of the signed-in user's forms. */
export async function deleteMyResponses(formId: string, ids: readonly string[]): Promise<number> {
  const user = await getUser();
  if (!user) return 0;
  const deleted = await deleteResponses(await getDb(), user.id, formId, ids.slice(0, 500));
  revalidatePath(`/forms/${formId}/responses`);
  return deleted;
}
