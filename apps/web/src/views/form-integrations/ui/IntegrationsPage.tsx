import { resolveText } from "@formcanvas/engine/i18n";
import { CircleCheck, CircleX } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { WebhookList } from "@/features/manage-webhooks";
import { getUser } from "@/shared/auth";
import { getDb, getForm, listWebhooks, recentDeliveries } from "@/shared/db";
import { AppShell } from "@/widgets/app-shell";
import { ResponsesNav } from "@/widgets/responses-nav";

const VERIFY = `import { createHmac, timingSafeEqual } from "node:crypto";

// In your endpoint: reject old or unsigned requests.
const timestamp = request.headers.get("x-formcanvas-timestamp");
const signature = request.headers.get("x-formcanvas-signature") ?? "";
const body = await request.text();
const expected = "sha256=" + createHmac("sha256", process.env.FORMCANVAS_SECRET)
  .update(\`\${timestamp}.\${body}\`).digest("hex");
const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) < 300;
const valid = fresh && expected.length === signature.length &&
  timingSafeEqual(Buffer.from(expected), Buffer.from(signature));`;

/** Webhooks of one form and their recent deliveries. */
export async function IntegrationsPage({ id }: { id: string }) {
  const user = await getUser();
  const db = await getDb();
  const form = user ? await getForm(db, user.id, id) : undefined;
  if (!user || !form) notFound();
  const locale = await getLocale();
  const t = await getTranslations("integrations");
  const format = await getFormatter();
  const [hooks, deliveries] = await Promise.all([
    listWebhooks(db, user.id, id),
    recentDeliveries(db, user.id, id),
  ]);
  const title = resolveText(form.draft.title, locale, form.draft.locales.default);
  const urlOf = new Map(hooks.map((h) => [h.id, h.url]));
  return (
    <AppShell crumbs={[title, t("title")]}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grow">
          <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-ink-2">{t("subtitle")}</p>
        </div>
        <ResponsesNav formId={id} current="integrations" />
      </div>
      <section
        aria-labelledby="webhooks"
        className="grid gap-4 rounded-[14px] border border-line bg-surface p-5 shadow-xs"
      >
        <div>
          <h2 id="webhooks" className="text-[15px] font-semibold">
            {t("webhooks")}
          </h2>
          <p className="text-[13.5px] text-ink-2">{t("webhooksText")}</p>
        </div>
        <WebhookList
          formId={id}
          hooks={hooks.map((h) => ({ id: h.id, url: h.url, secret: h.secret, enabled: h.enabled }))}
        />
      </section>
      {deliveries.length > 0 && (
        <section
          aria-labelledby="deliveries"
          className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-xs"
        >
          <h2 id="deliveries" className="border-b border-line px-5 py-3 text-[15px] font-semibold">
            {t("deliveries")}
          </h2>
          <ul className="divide-y divide-line">
            {deliveries.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-[13px]">
                {d.ok ? (
                  <CircleCheck size={16} className="text-primary-fg" aria-label={t("delivered")} />
                ) : (
                  <CircleX
                    size={16}
                    className="text-carmine dark:text-[#e2566b]"
                    aria-label={t("failed")}
                  />
                )}
                <span className="font-mono text-[12.5px]">{d.event}</span>
                <span className="text-ink-2">
                  {d.status === null ? (d.error ?? "") : `HTTP ${String(d.status)}`}
                </span>
                <span className="text-ink-3">{t("attempt", { n: d.attempt })}</span>
                <span dir="ltr" className="min-w-0 grow truncate text-ink-3">
                  {urlOf.get(d.webhookId)}
                </span>
                <span className="text-ink-3">
                  {format.dateTime(d.createdAt, { dateStyle: "medium", timeStyle: "medium" })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section
        aria-labelledby="verify"
        className="grid gap-3 rounded-[14px] border border-line bg-surface p-5 shadow-xs"
      >
        <h2 id="verify" className="text-[15px] font-semibold">
          {t("verifyTitle")}
        </h2>
        <p className="text-[13.5px] text-ink-2">{t("verifyText")}</p>
        <pre
          dir="ltr"
          className="overflow-x-auto rounded-[10px] bg-surface-2 p-4 font-mono text-[12.5px] leading-relaxed"
        >
          {VERIFY}
        </pre>
      </section>
    </AppShell>
  );
}
