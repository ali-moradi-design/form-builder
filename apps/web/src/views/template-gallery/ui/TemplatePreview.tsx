"use client";

import { Form } from "@formweave/react";
import { resolveText } from "@formweave/engine/i18n";
import { CircleCheck, Languages, ListOrdered, PencilLine, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { countInputs, type GalleryTemplate } from "@/shared/config";
import { previewUpload, registry, renderers } from "@/shared/formweave";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";
import { TONES } from "./tones";

/** Fills in a template with the real renderer; nothing is saved or sent. */
export function TemplatePreview({
  template,
  trigger,
  onUse,
  pending,
}: {
  template: GalleryTemplate;
  trigger: React.ReactNode;
  onUse: () => void;
  pending: boolean;
}) {
  const t = useTranslations("templates");
  const tl = useTranslations("languages");
  const appLocale = useLocale();
  const { document } = template;
  const languages = document.locales.supported ?? [document.locales.default];
  const [locale, setLocale] = useState(
    languages.includes(appLocale) ? appLocale : document.locales.default,
  );
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  const name = resolveText(document.title, appLocale, "en");

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) {
          setDone(false);
          setRun((r) => r + 1);
        }
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgb(20_26_28/0.45)] backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 grid max-h-[92dvh] w-[min(980px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_1fr] overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.35)]">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
            <span
              className={cn("grid size-10 place-items-center rounded-[10px]", TONES[template.tone])}
            >
              <template.icon size={18} aria-hidden />
            </span>
            <div className="grow">
              <Dialog.Title className="text-lg font-semibold tracking-tight">{name}</Dialog.Title>
              <Dialog.Description className="text-[13.5px] text-ink-2">
                {t("previewText")}
              </Dialog.Description>
            </div>
            {languages.length > 1 && (
              <div
                role="group"
                aria-label={t("previewLanguage")}
                className="flex gap-0.5 rounded-[10px] border border-line bg-surface-2 p-[3px]"
              >
                {languages.map((l) => (
                  <button
                    key={l}
                    type="button"
                    lang={l}
                    aria-pressed={locale === l}
                    onClick={() => {
                      setLocale(l);
                    }}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-2 aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-xs focus-visible:outline-3 focus-visible:outline-primary-soft"
                  >
                    {tl(l as never)}
                  </button>
                ))}
              </div>
            )}
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label={t("close")}>
                <X size={16} aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <div className="grid min-h-0 overflow-y-auto md:grid-cols-[minmax(0,1fr)_290px] md:overflow-hidden">
            <div className="bg-frame p-5 md:overflow-y-auto md:border-e md:border-line">
              {done ? (
                <div
                  role="status"
                  className="grid justify-items-center gap-3 rounded-[14px] border border-line bg-surface p-8 text-center"
                >
                  <CircleCheck size={28} className="text-primary-fg" aria-hidden />
                  <p className="text-[14px]">{t("previewDone")}</p>
                  <Button
                    onClick={() => {
                      setDone(false);
                      setRun((r) => r + 1);
                    }}
                  >
                    {t("previewAgain")}
                  </Button>
                </div>
              ) : (
                <section className="rounded-[14px] border border-line bg-surface p-5 shadow-xs">
                  <Form
                    key={`${String(run)}-${locale}`}
                    schema={document}
                    registry={registry}
                    renderers={renderers}
                    locale={locale}
                    upload={previewUpload}
                    onSubmit={() => {
                      setDone(true);
                    }}
                  />
                </section>
              )}
            </div>
            <aside className="grid content-start gap-4 p-5">
              <div>
                <h3 className="mb-2 text-[13px] font-medium">{t("inside")}</h3>
                <ul className="grid gap-2 text-[13px] text-ink-2">
                  <li className="flex items-center gap-2">
                    <ListOrdered size={15} aria-hidden />
                    {t("stepsFields", {
                      steps: document.steps.length,
                      fields: countInputs(document),
                    })}
                  </li>
                  {template.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CircleCheck size={15} aria-hidden />
                      {t(`feature.${f}`)}
                    </li>
                  ))}
                  <li className="flex items-center gap-2">
                    <Languages size={15} aria-hidden />
                    {languages.map((l) => tl(l as never)).join(t("and"))}
                  </li>
                </ul>
              </div>
              <p className="flex items-start gap-2.5 rounded-[12px] bg-plum/8 p-3 text-[13px] dark:bg-plum/25">
                <PencilLine
                  size={16}
                  className="mt-0.5 shrink-0 text-plum dark:text-[#f0c6dc]"
                  aria-hidden
                />
                {t("copyNote")}
              </p>
              <Button variant="primary" size="lg" disabled={pending} onClick={onUse}>
                {t("useThis")}
              </Button>
            </aside>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
