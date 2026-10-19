"use client";

import { FileText } from "lucide-react";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import Link from "next/link";
import { resolveText } from "@formweave/engine/i18n";
import { countFields, useDrafts } from "@/entities/form";
import { DeleteFormButton } from "@/features/delete-form";

/** The drafts saved in this browser. */
export function FormsList() {
  const drafts = useDrafts();
  const t = useTranslations("forms");
  const format = useFormatter();
  const locale = useLocale();
  const now = useNow({ updateInterval: 60_000 });
  if (drafts.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-line-strong p-8 text-center text-ink-2">
        {t("empty")}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface shadow-xs">
      {drafts.map((d) => {
        const title = resolveText(d.document.title, locale, d.document.locales.default);
        return (
          <li key={d.id} className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-8 place-items-center rounded-[9px] bg-primary-soft text-primary-fg">
              <FileText size={16} aria-hidden />
            </span>
            <Link href={`/forms/${d.id}`} className="min-w-0 grow">
              <span className="block truncate font-medium">{title}</span>
              <span className="text-xs text-ink-3">
                {t("fields", { count: countFields(d.document) })} ·{" "}
                {t("edited", { date: format.relativeTime(new Date(d.updatedAt), now) })}
              </span>
            </Link>
            <DeleteFormButton id={d.id} title={title} />
          </li>
        );
      })}
    </ul>
  );
}
