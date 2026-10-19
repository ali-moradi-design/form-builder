"use server";

import { headers } from "next/headers";
import { getDb } from "@/shared/db";
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
