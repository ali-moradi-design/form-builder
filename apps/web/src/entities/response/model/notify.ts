import { enabledWebhooks, logDelivery, type Db } from "@/shared/db";
import { deliver } from "@/shared/webhooks";
import type { SubmitResult } from "./submit";

/** The JSON body webhooks receive for a new response. */
export interface ResponseEvent {
  readonly event: "response.created";
  readonly form: { readonly id: string; readonly slug: string; readonly version: number };
  readonly response: {
    readonly id: string;
    readonly submittedAt: string;
    readonly locale: string;
    readonly data: Readonly<Record<string, unknown>>;
  };
}

/**
 * Sends a stored response to the form's enabled webhooks and logs every
 * attempt. Meant to run after the reply was sent (Next's `after`).
 */
export async function notifyWebhooks(db: Db, result: SubmitResult, at = new Date()): Promise<void> {
  if (!result.ok || result.formId === null) return;
  const hooks = await enabledWebhooks(db, result.formId);
  if (hooks.length === 0) return;
  const payload: ResponseEvent = {
    event: "response.created",
    form: { id: result.formId, slug: result.slug, version: result.version },
    response: {
      id: result.id,
      submittedAt: at.toISOString(),
      locale: result.locale,
      data: result.data,
    },
  };
  await Promise.all(
    hooks.map((hook) =>
      deliver(hook, payload.event, payload, {
        onAttempt: (a) =>
          logDelivery(db, { webhookId: hook.id, event: payload.event, ...a }).catch(
            () => undefined,
          ),
      }),
    ),
  );
}
