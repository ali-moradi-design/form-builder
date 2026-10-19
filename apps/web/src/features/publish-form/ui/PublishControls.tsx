"use client";

import type { FormDocument } from "@formweave/schema";
import {
  Check,
  Code,
  Copy,
  ExternalLink,
  Globe,
  History,
  Package,
  Rocket,
  Send,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useState, useTransition } from "react";
import { publishMyForm } from "@/entities/form";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";

/** Where a form is published: its newest version and public slug. */
export interface LiveInfo {
  readonly version: number;
  readonly slug: string;
}

/** Status pill, Publish button and the "version is live" dialog. */
export function PublishControls({
  id,
  initial,
  getDocument,
}: {
  id: string;
  initial: LiveInfo | null;
  getDocument: () => FormDocument;
}) {
  const t = useTranslations("publish");
  const [live, setLive] = useState(initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const url =
    live && typeof window !== "undefined" ? `${window.location.origin}/f/${live.slug}` : "";

  return (
    <>
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-[12px] font-medium",
          live
            ? "bg-primary-soft text-primary-fg"
            : "bg-[color-mix(in_oklab,var(--amber)_14%,transparent)] text-[#9c3d07] dark:text-amber",
        )}
      >
        {live ? t("live", { version: live.version }) : t("draft")}
      </span>
      <Button
        variant="primary"
        disabled={pending}
        onClick={() => {
          setError(false);
          start(async () => {
            const result = await publishMyForm(id, getDocument());
            if (!result) {
              setError(true);
              return;
            }
            setLive(result);
            setCopied(false);
            setOpen(true);
          });
        }}
      >
        <Send size={15} aria-hidden />
        {t("publish")}
      </Button>
      {error && (
        <span role="alert" className="text-[13px] text-carmine">
          {t("failed")}
        </span>
      )}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgb(20_26_28/0.45)] backdrop-blur-[2px]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(760px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-line bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.35)] focus:outline-none">
            <div className="flex items-start gap-3 px-6 pt-5">
              <span className="grid size-10 place-items-center rounded-[10px] bg-primary-soft text-primary-fg">
                <Rocket size={18} aria-hidden />
              </span>
              <div className="grow">
                <Dialog.Title className="text-lg font-semibold tracking-tight">
                  {t("liveTitle", { version: live?.version ?? 1 })}
                </Dialog.Title>
                <Dialog.Description className="text-[13.5px] text-ink-2">
                  {t("liveText")}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label={t("close")}>
                  <X size={16} aria-hidden />
                </Button>
              </Dialog.Close>
            </div>
            <div className="grid gap-3.5 px-6 py-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    {
                      key: "hosted",
                      icon: Globe,
                      tone: "bg-primary-soft text-primary-fg",
                      on: true,
                    },
                    {
                      key: "embed",
                      icon: Code,
                      tone: "bg-[color-mix(in_oklab,var(--amber)_18%,transparent)] text-accent-text",
                      on: false,
                    },
                    {
                      key: "react",
                      icon: Package,
                      tone: "bg-[color-mix(in_oklab,var(--plum)_12%,transparent)] text-plum dark:text-[#e7a3c8]",
                      on: false,
                    },
                  ] as const
                ).map((c) => (
                  <div
                    key={c.key}
                    className={cn(
                      "grid gap-1.5 rounded-[12px] border p-4",
                      c.on ? "border-primary outline-2 outline-primary-soft" : "border-line",
                    )}
                  >
                    <span className={cn("grid size-9 place-items-center rounded-[9px]", c.tone)}>
                      <c.icon size={17} aria-hidden />
                    </span>
                    <b className="text-sm font-semibold">{t(`${c.key}.title`)}</b>
                    <span className="text-[13px] text-ink-2">{t(`${c.key}.text`)}</span>
                    {!c.on && (
                      <span className="text-[11.5px] font-medium text-ink-3">{t("soon")}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-[10px] border border-line bg-surface-2 py-1.5 ps-3.5 pe-1.5">
                <span dir="ltr" className="grow truncate font-mono text-[13px]">
                  {url}
                </span>
                <Button
                  onClick={() => {
                    void navigator.clipboard.writeText(url).then(() => {
                      setCopied(true);
                    });
                  }}
                >
                  {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                  {t(copied ? "copied" : "copy")}
                </Button>
              </div>
              <div className="flex items-center gap-3 rounded-[12px] bg-[color-mix(in_oklab,var(--plum)_8%,transparent)] p-3.5 text-[13px]">
                <span className="grid size-8 place-items-center rounded-lg bg-surface text-plum dark:text-[#e7a3c8]">
                  <History size={16} aria-hidden />
                </span>
                {t("versionNote", { next: (live?.version ?? 1) + 1 })}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-line px-6 py-4">
              <Button asChild>
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} aria-hidden />
                  {t("open")}
                </a>
              </Button>
              <Dialog.Close asChild>
                <Button variant="primary">{t("done")}</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
