"use client";

import { resolveText } from "@formweave/engine/i18n";
import { Eye, PencilRuler } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { saveDraft, useDraft } from "@/entities/form";
import {
  BuilderProvider,
  Canvas,
  Inspector,
  Palette,
  Toolbar,
  useBuilder,
  useBuilderShortcuts,
} from "@/features/edit-form";
import { LocaleSwitch } from "@/features/switch-locale";
import { useHydrated } from "@/shared/lib";
import { LogoMark } from "@/shared/ui";

/** The builder for one draft: palette, canvas and settings. */
export function FormBuilder({ id }: { id: string }) {
  const draft = useDraft(id);
  const hydrated = useHydrated();
  const t = useTranslations("preview");
  if (!hydrated) return null;
  if (!draft) return <p className="p-8 text-ink-2">{t("notFound")}</p>;
  return (
    <BuilderProvider
      initial={draft.document}
      save={(doc) => {
        saveDraft(id, doc);
      }}
    >
      <Workspace id={id} />
    </BuilderProvider>
  );
}

function Workspace({ id }: { id: string }) {
  useBuilderShortcuts();
  const t = useTranslations("builder");
  const tf = useTranslations("forms");
  const appLocale = useLocale();
  const doc = useBuilder((s) => s.doc);
  const supported = doc.locales.supported ?? [doc.locales.default];
  const contentLocale = supported.includes(appLocale) ? appLocale : doc.locales.default;
  const title = resolveText(doc.title, contentLocale, doc.locales.default);
  const tab =
    "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink-2 aria-[current=page]:bg-surface aria-[current=page]:text-ink aria-[current=page]:shadow-xs";
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-3 px-4 py-2.5">
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
        </nav>
        <Toolbar />
        <LocaleSwitch />
      </header>
      <div className="grid min-h-0 grow gap-3 px-3 pb-3 lg:grid-cols-[272px_minmax(0,1fr)_340px]">
        <aside className="min-h-0 overflow-y-auto rounded-[14px] border border-line bg-surface">
          <Palette />
        </aside>
        <main className="min-h-0 overflow-y-auto rounded-[14px] border border-line bg-[radial-gradient(var(--line-strong)_1px,transparent_1px)] [background-size:18px_18px] px-3">
          <Canvas locale={contentLocale} />
        </main>
        <aside className="min-h-0 overflow-y-auto rounded-[14px] border border-line bg-surface">
          <Inspector locale={appLocale} />
        </aside>
      </div>
    </div>
  );
}
