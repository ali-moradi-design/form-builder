import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "./client";
import { form, webhook, webhookDelivery } from "./schema";

/** A webhook as its owner sees it. */
export interface WebhookInfo {
  readonly id: string;
  readonly url: string;
  readonly secret: string;
  readonly enabled: boolean;
  readonly createdAt: Date;
}

async function owns(db: Db, ownerId: string, formId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: form.id })
    .from(form)
    .where(and(eq(form.id, formId), eq(form.ownerId, ownerId)));
  return row !== undefined;
}

/** The owner's webhooks of one form, oldest first. */
export async function listWebhooks(
  db: Db,
  ownerId: string,
  formId: string,
): Promise<WebhookInfo[]> {
  if (!(await owns(db, ownerId, formId))) return [];
  return db
    .select({
      id: webhook.id,
      url: webhook.url,
      secret: webhook.secret,
      enabled: webhook.enabled,
      createdAt: webhook.createdAt,
    })
    .from(webhook)
    .where(eq(webhook.formId, formId))
    .orderBy(webhook.createdAt);
}

/** Adds a webhook; returns its id, or null when the form isn't the owner's or has 5 already. */
export async function addWebhook(
  db: Db,
  ownerId: string,
  formId: string,
  url: string,
  secret: string,
): Promise<string | null> {
  if (!(await owns(db, ownerId, formId))) return null;
  if ((await listWebhooks(db, ownerId, formId)).length >= 5) return null;
  const id = crypto.randomUUID();
  await db.insert(webhook).values({ id, formId, url, secret });
  return id;
}

/** Turns a webhook on or off. */
export async function setWebhookEnabled(
  db: Db,
  ownerId: string,
  formId: string,
  id: string,
  enabled: boolean,
): Promise<void> {
  if (!(await owns(db, ownerId, formId))) return;
  await db
    .update(webhook)
    .set({ enabled })
    .where(and(eq(webhook.id, id), eq(webhook.formId, formId)));
}

/** Removes a webhook and its delivery log. */
export async function deleteWebhook(
  db: Db,
  ownerId: string,
  formId: string,
  id: string,
): Promise<void> {
  if (!(await owns(db, ownerId, formId))) return;
  await db.delete(webhook).where(and(eq(webhook.id, id), eq(webhook.formId, formId)));
}

/** Enabled webhooks of a form, for delivery (no owner check: called after a submission). */
export async function enabledWebhooks(
  db: Db,
  formId: string,
): Promise<{ id: string; url: string; secret: string }[]> {
  return db
    .select({ id: webhook.id, url: webhook.url, secret: webhook.secret })
    .from(webhook)
    .where(and(eq(webhook.formId, formId), eq(webhook.enabled, true)));
}

/** One webhook by id, for a test delivery (owner checked). */
export async function getWebhook(db: Db, ownerId: string, formId: string, id: string) {
  if (!(await owns(db, ownerId, formId))) return undefined;
  const [row] = await db
    .select({ id: webhook.id, url: webhook.url, secret: webhook.secret })
    .from(webhook)
    .where(and(eq(webhook.id, id), eq(webhook.formId, formId)));
  return row;
}

/** Records one delivery attempt. */
export async function logDelivery(
  db: Db,
  values: {
    webhookId: string;
    event: string;
    ok: boolean;
    status: number | null;
    error: string | null;
    attempt: number;
    durationMs: number;
  },
): Promise<void> {
  await db.insert(webhookDelivery).values({ id: crypto.randomUUID(), ...values });
}

/** The newest delivery attempts of a form's webhooks. */
export async function recentDeliveries(db: Db, ownerId: string, formId: string, limit = 20) {
  const hooks = await listWebhooks(db, ownerId, formId);
  if (hooks.length === 0) return [];
  return db
    .select({
      id: webhookDelivery.id,
      webhookId: webhookDelivery.webhookId,
      event: webhookDelivery.event,
      ok: webhookDelivery.ok,
      status: webhookDelivery.status,
      error: webhookDelivery.error,
      attempt: webhookDelivery.attempt,
      createdAt: webhookDelivery.createdAt,
    })
    .from(webhookDelivery)
    .where(
      inArray(
        webhookDelivery.webhookId,
        hooks.map((h) => h.id),
      ),
    )
    .orderBy(desc(webhookDelivery.createdAt))
    .limit(limit);
}
