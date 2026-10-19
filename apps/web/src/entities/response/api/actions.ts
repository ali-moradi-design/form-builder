"use server";

import { getDb } from "@/shared/db";
import { acceptResponse, type AcceptResult } from "../model/accept";

/** Submits answers to a published form (used by the hosted page). */
export async function submitResponse(
  slug: string,
  values: unknown,
  locale?: string,
): Promise<AcceptResult> {
  return acceptResponse(await getDb(), slug, values, locale);
}
