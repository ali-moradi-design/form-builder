"use client";

import { resolveText } from "@formcanvas/engine/i18n";
import { Eye, Inbox, PencilRuler } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import type { FormDocument } from "@formcanvas/schema";
import { saveMyDraft } from "@/entities/form";
import {
  BuilderDnd,
  BuilderProvider,
  Canvas,
  Inspector,
  JsonPanel,
  Palette,
  Toolbar,
  useBuilder,
  useBuilderApi,
  useBuilderShortcuts,
} from "@/features/edit-form";
import { PublishControls, type LiveInfo } from "@/features/publish-form";
import { LocaleSwitch } from "@/features/switch-locale";
import { LogoMark } from "@/shared/ui";

/** The builder for one form: palette, canvas and settings. */
export function FormBuilder({
  id,
  initial,
  live,
}: {
  id: string;
  initial: FormDocument;
  live: LiveInfo | null;
}) {
  return (
    <BuilderProvider
      initial={initial}
      save={(doc) => {
        saveMyDraft(id, doc).catch((error: unknown) => {
          console.error("Saving the draft failed", error);
        });
      }}
    >
      <BuilderDnd>
        <Workspace id={id} live={live} />
      </BuilderDnd>
    </BuilderProvider>
  );
}

function Workspace({ id, live }: { id: string; live: LiveInfo | null }) {
  useBuilderShortcuts();
  const t = useTranslations("builder");
  const tf = useTranslations("forms");
  const appLocale = useLocale();
  const doc = useBuilder((s) => s.doc);
  const { store } = useBuilderApi();
  const [panel, setPanel] = useState<"settings" | "json">("settings");
  const supported = doc.locales.supported ?? [doc.locales.default];
  const contentLocale = supported.includes(appLocale) ? appLocale : doc.locales.default;
  const title = resolveText(doc.title, contentLocale, doc.locales.default);
  const tab =
    "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink-2 aria-[current=page]:bg-surface aria-[current=page]:text-ink aria-[current=page]:shadow-xs";
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-3 px-4 py-2.5">
        <h1 className="sr-only">{title}</h1>
        <Link href="/forms" aria-label={tf("title")}>
          <LogoMark size={32} />
        </Link>
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2 text-[13px] text-ink-2"
        >
          <Link href="/forms">{tf("title")}</Link>
          <span className="text-ink-3">/</span>
          <span
            aria-current="page"
            className="truncate rounded-lg border border-line bg-surface px-2.5 py-1 font-medium text-primary-fg shadow-xs"
          >
            {title}
          </span>
        </nav>
        <nav
          aria-label={t("build")}
          className="mx-auto flex gap-1 rounded-[11px] border border-line bg-surface-2 p-1"
        >
          <span aria-current="page" className={tab}>
            <PencilRuler size={15} aria-hidden />
            {t("build")}
          </span>
          <Link href={`/forms/${id}/preview`} className={tab}>
            <Eye size={15} aria-hidden />
            {t("preview")}
          </Link>
          <Link href={`/forms/${id}/responses`} className={tab}>
            <Inbox size={15} aria-hidden />
            {t("responses")}
          </Link>
        </nav>
        <Toolbar />
        <PublishControls id={id} initial={live} getDocument={() => store.getState().doc} />
        <LocaleSwitch />
      </header>
      <div className="grid min-h-0 grow gap-3 px-3 pb-3 lg:grid-cols-[272px_minmax(0,1fr)_380px]">
        <aside
          aria-label={t("fields")}
          className="min-h-0 overflow-y-auto rounded-[14px] border border-line bg-surface"
        >
          <Palette />
        </aside>
        <main className="min-h-0 overflow-y-auto rounded-[14px] border border-line bg-[radial-gradient(var(--line-strong)_1px,transparent_1px)] [background-size:18px_18px] px-3">
          <Canvas locale={contentLocale} />
        </main>
        <aside
          aria-label={t("panel")}
          className="flex min-h-0 flex-col rounded-[14px] border border-line bg-surface"
        >
          <div
            role="tablist"
            aria-label={t("panel")}
            className="flex gap-1 border-b border-line px-3 pt-2"
          >
            {(["settings", "json"] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={panel === p}
                onClick={() => {
                  setPanel(p);
                }}
                className="-mb-px border-b-2 border-transparent px-2.5 pb-2 text-[13px] font-medium text-ink-2 aria-selected:border-orange aria-selected:text-ink"
              >
                {t(p)}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="min-h-0 grow overflow-y-auto">
            {panel === "settings" ? <Inspector locale={appLocale} /> : <JsonPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}
