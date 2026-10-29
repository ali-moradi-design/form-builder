"use client";

import { resolveText } from "@formcanvas/engine/i18n";
import type { FormDocument } from "@formcanvas/schema";
import { FileText } from "lucide-react";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import Link from "next/link";
import { countFields } from "@/entities/form";
import { DeleteFormButton } from "@/features/delete-form";

/** One row of the forms list (dates as ISO strings, so it can cross to the client). */
export interface FormRow {
  readonly id: string;
  readonly draft: FormDocument;
  readonly updatedAt: string;
  readonly liveVersion: number | null;
  readonly responses: number;
}

/** The signed-in user's forms. */
export function FormsList({ forms }: { forms: readonly FormRow[] }) {
  const t = useTranslations("forms");
  const format = useFormatter();
  const locale = useLocale();
  const now = useNow({ updateInterval: 60_000 });
  if (forms.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-line-strong p-8 text-center text-ink-2">
        {t("empty")}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface shadow-xs">
      {forms.map((f) => {
        const title = resolveText(f.draft.title, locale, f.draft.locales.default);
        return (
          <li key={f.id} className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-8 place-items-center rounded-[9px] bg-primary-soft text-primary-fg">
              <FileText size={16} aria-hidden />
            </span>
            <Link href={`/forms/${f.id}`} className="min-w-0 grow">
              <span className="block truncate font-medium">{title}</span>
              <span className="text-xs text-ink-3">
                {t("fields", { count: countFields(f.draft) })} ·{" "}
                {t("edited", { date: format.relativeTime(new Date(f.updatedAt), now) })}
              </span>
            </Link>
            {f.liveVersion !== null && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11.5px] font-medium text-primary-fg">
                {t("live", { version: f.liveVersion })}
              </span>
            )}
            <Link
              href={`/forms/${f.id}/responses`}
              className="hidden text-xs text-ink-2 underline-offset-2 hover:underline sm:inline"
            >
              {t("responses", { count: f.responses })}
            </Link>
            <DeleteFormButton id={f.id} title={title} />
          </li>
        );
      })}
    </ul>
  );
}
