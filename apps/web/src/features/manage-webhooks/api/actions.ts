"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/shared/auth";
import {
  addWebhook,
  deleteWebhook,
  getDb,
  getWebhook,
  logDelivery,
  setWebhookEnabled,
} from "@/shared/db";
import { checkWebhookUrl, deliver, newSecret, type UrlProblem } from "@/shared/webhooks";

const page = (formId: string) => `/forms/${formId}/integrations`;

/** Adds a webhook after checking its address. */
export async function addMyWebhook(
  formId: string,
  url: string,
): Promise<{ ok: true } | { ok: false; problem: UrlProblem | "limit" }> {
  const user = await getUser();
  if (!user) return { ok: false, problem: "invalid" };
  const problem = await checkWebhookUrl(url.trim());
  if (problem) return { ok: false, problem };
  const id = await addWebhook(await getDb(), user.id, formId, url.trim(), newSecret());
  revalidatePath(page(formId));
  return id ? { ok: true } : { ok: false, problem: "limit" };
}

/** Turns a webhook on or off. */
export async function setMyWebhookEnabled(
  formId: string,
  id: string,
  enabled: boolean,
): Promise<void> {
  const user = await getUser();
  if (!user) return;
  await setWebhookEnabled(await getDb(), user.id, formId, id, enabled);
  revalidatePath(page(formId));
}

/** Removes a webhook. */
export async function deleteMyWebhook(formId: string, id: string): Promise<void> {
  const user = await getUser();
  if (!user) return;
  await deleteWebhook(await getDb(), user.id, formId, id);
  revalidatePath(page(formId));
}

/** Sends a `ping` event once (no retries) and logs it. */
export async function testMyWebhook(
  formId: string,
  id: string,
): Promise<{ ok: boolean; status: number | null; error: string | null }> {
  const user = await getUser();
  const db = await getDb();
  const hook = user ? await getWebhook(db, user.id, formId, id) : undefined;
  if (!hook) return { ok: false, status: null, error: "not found" };
  const result = await deliver(
    hook,
    "ping",
    { event: "ping", form: { id: formId }, sentAt: new Date().toISOString() },
    {
      backoff: [],
      onAttempt: (a) => logDelivery(db, { webhookId: id, event: "ping", ...a }),
    },
  );
  revalidatePath(page(formId));
  return { ok: result.ok, status: result.status, error: result.error };
}
