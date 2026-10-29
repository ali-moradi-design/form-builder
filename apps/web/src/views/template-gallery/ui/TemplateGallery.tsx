"use client";

import { resolveText } from "@formcanvas/engine/i18n";
import type { FormDocument } from "@formcanvas/schema";
import { Eye, FilePlus2, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { createMyForm } from "@/entities/form";
import {
  countInputs,
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
  TEMPLATES,
} from "@/shared/config";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";
import { TemplatePreview } from "./TemplatePreview";
import { TONES } from "./tones";
import { TemplateThumb } from "./TemplateThumb";

const blank = (title: string): FormDocument => ({
  schemaVersion: 1,
  id: "new",
  title,
  locales: { default: "en", supported: ["en", "fa"] },
  steps: [{ key: "main", fields: [] }],
});

/** The template gallery: filter, search, preview and create a form from a template. */
export function TemplateGallery() {
  const t = useTranslations("templates");
  const locale = useLocale();
  const router = useRouter();
  const searchId = useId();
  const [pending, start] = useTransition();
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [query, setQuery] = useState("");

  const title = (tpl: (typeof TEMPLATES)[number]) => resolveText(tpl.document.title, locale, "en");
  const needle = query.trim().toLocaleLowerCase(locale);
  const shown = TEMPLATES.filter(
    (tpl) =>
      (category === "all" || tpl.category === category) &&
      (!needle ||
        `${title(tpl)} ${t(`text.${tpl.id}` as never)}`.toLocaleLowerCase(locale).includes(needle)),
  );

  const create = (document: FormDocument) => {
    start(async () => {
      router.push(`/forms/${await createMyForm(document)}`);
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-end gap-3.5">
        <div className="grow">
          <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-ink-2">{t("subtitle")}</p>
        </div>
        <label
          htmlFor={searchId}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-[13px] focus-within:outline-3 focus-within:outline-primary-soft sm:w-[260px]"
        >
          <Search size={15} className="text-ink-3" aria-hidden />
          <span className="sr-only">{t("search")}</span>
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder={t("search")}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            className="h-full min-w-0 grow bg-transparent outline-none placeholder:text-ink-3"
          />
        </label>
      </div>

      <div
        role="group"
        aria-label={t("categories")}
        className="flex flex-wrap gap-0.5 self-start rounded-[10px] border border-line bg-surface-2 p-[3px]"
      >
        {(["all", ...TEMPLATE_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => {
              setCategory(c);
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-2 aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-xs focus-visible:outline-3 focus-visible:outline-primary-soft"
          >
            {t(`category.${c}`)}
            {c === "all" && <span className="text-ink-3">{TEMPLATES.length}</span>}
          </button>
        ))}
      </div>

      <ul className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((tpl) => {
          const name = title(tpl);
          const steps = tpl.document.steps.length;
          return (
            <li
              key={tpl.id}
              className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-xs"
            >
              <TemplateThumb document={tpl.document} />
              <div className="grid flex-1 content-start gap-1.5 px-4 pt-3.5 pb-1.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-[9px]",
                      TONES[tpl.tone],
                    )}
                  >
                    <tpl.icon size={16} aria-hidden />
                  </span>
                  <h2 className="grow text-[15px] font-semibold tracking-tight">{name}</h2>
                  <span className="text-xs text-ink-3">{t(`category.${tpl.category}`)}</span>
                </div>
                <p className="text-[13px] leading-normal text-ink-2">
                  {t(`text.${tpl.id}` as never)}
                </p>
                <ul className="mt-1 flex flex-wrap gap-1.5" aria-label={t("features")}>
                  <li className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-2">
                    {t("steps", { count: steps })}
                  </li>
                  {tpl.features.map((f) => (
                    <li
                      key={f}
                      className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-2"
                    >
                      {t(`feature.${f}`)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2 px-4 pt-3 pb-3.5">
                <span className="grow text-[12.5px] text-ink-3">
                  {t("fields", { count: countInputs(tpl.document) })}
                </span>
                <TemplatePreview
                  template={tpl}
                  pending={pending}
                  onUse={() => {
                    create(tpl.document);
                  }}
                  trigger={
                    <Button variant="ghost" aria-label={t("previewOf", { name })}>
                      <Eye size={15} aria-hidden />
                      {t("preview")}
                    </Button>
                  }
                />
                <Button
                  variant="primary"
                  disabled={pending}
                  aria-label={t("useOf", { name })}
                  onClick={() => {
                    create(tpl.document);
                  }}
                >
                  {t("use")}
                </Button>
              </div>
            </li>
          );
        })}
        <li className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-line-strong p-6 text-center">
          <span className="grid size-8 place-items-center rounded-[9px] border border-line bg-surface-2 text-ink-2">
            <FilePlus2 size={16} aria-hidden />
          </span>
          <b className="text-sm font-semibold">{t("blank")}</b>
          <span className="text-[13px] text-ink-2">{t("blankHint")}</span>
          <Button
            disabled={pending}
            onClick={() => {
              create(blank(t("blankTitle")));
            }}
          >
            {t("blankAction")}
          </Button>
        </li>
      </ul>
      {shown.length === 0 && (
        <p role="status" className="text-center text-ink-2">
          {t("none")}
        </p>
      )}
    </>
  );
}
