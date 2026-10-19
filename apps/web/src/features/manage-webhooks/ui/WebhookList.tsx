"use client";

import { Copy, Eye, EyeOff, Plus, Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/shared/ui";
import { addMyWebhook, deleteMyWebhook, setMyWebhookEnabled, testMyWebhook } from "../api/actions";

/** A webhook as the page passes it in. */
export interface WebhookItem {
  readonly id: string;
  readonly url: string;
  readonly secret: string;
  readonly enabled: boolean;
}

function Secret({ value }: { value: string }) {
  const t = useTranslations("integrations");
  const [shown, setShown] = useState(false);
  return (
    <span className="flex items-center gap-1">
      <code dir="ltr" className="truncate rounded-md bg-surface-2 px-2 py-1 font-mono text-[12px]">
        {shown ? value : `${value.slice(0, 10)}••••••••`}
      </code>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t(shown ? "hide" : "show")}
        onClick={() => {
          setShown(!shown);
        }}
      >
        {shown ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("copySecret")}
        onClick={() => void navigator.clipboard.writeText(value)}
      >
        <Copy size={15} aria-hidden />
      </Button>
    </span>
  );
}

/** Webhooks of one form: add, test, switch off, delete. */
export function WebhookList({ formId, hooks }: { formId: string; hooks: readonly WebhookItem[] }) {
  const t = useTranslations("integrations");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-3">
      {hooks.length === 0 && <p className="text-[13.5px] text-ink-2">{t("none")}</p>}
      {hooks.map((h) => (
        <div key={h.id} className="grid gap-2 rounded-[12px] border border-line p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span dir="ltr" className="min-w-0 grow truncate font-mono text-[13px]">
              {h.url}
            </span>
            <label className="flex items-center gap-2 text-[13px] text-ink-2">
              <input
                type="checkbox"
                role="switch"
                checked={h.enabled}
                onChange={(e) => {
                  const on = e.target.checked;
                  start(async () => {
                    await setMyWebhookEnabled(formId, h.id, on);
                  });
                }}
              />
              {t("enabled")}
            </label>
            <Button
              disabled={pending}
              onClick={() => {
                setNotice(null);
                start(async () => {
                  const r = await testMyWebhook(formId, h.id);
                  setNotice(
                    r.ok
                      ? t("testOk", { status: r.status ?? 0 })
                      : t("testFailed", { error: r.error ?? "" }),
                  );
                });
              }}
            >
              <Send size={15} aria-hidden />
              {t("test")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("delete", { url: h.url })}
              disabled={pending}
              onClick={() => {
                if (!window.confirm(t("confirmDelete"))) return;
                start(async () => {
                  await deleteMyWebhook(formId, h.id);
                });
              }}
            >
              <Trash2 size={15} aria-hidden />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-ink-2">
            {t("secret")}
            <Secret value={h.secret} />
          </div>
        </div>
      ))}
      {notice && (
        <p role="status" className="text-[13px] text-ink-2">
          {notice}
        </p>
      )}
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            const r = await addMyWebhook(formId, url);
            if (r.ok) setUrl("");
            else setError(t(`problem.${r.problem}`));
          });
        }}
      >
        <label className="grid min-w-[260px] grow gap-1.5 text-[13px] font-medium">
          {t("url")}
          <input
            dir="ltr"
            type="url"
            required
            value={url}
            placeholder="https://example.com/hooks/formweave"
            onChange={(e) => {
              setUrl(e.target.value);
            }}
            className="h-10 rounded-[10px] border border-line-strong bg-surface px-3 font-mono text-[13px] font-normal outline-none focus:border-primary"
          />
        </label>
        <Button type="submit" variant="primary" disabled={pending} className="self-end">
          <Plus size={15} aria-hidden />
          {t("add")}
        </Button>
        {error && (
          <p role="alert" className="basis-full text-[13px] text-carmine dark:text-[#e2566b]">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
