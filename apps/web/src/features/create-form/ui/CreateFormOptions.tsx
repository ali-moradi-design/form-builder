"use client";

import type { FormDocument } from "@formweave/schema";
import { FilePlus2, LayoutTemplate } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createMyForm } from "@/entities/form";
import { feedbackTemplate } from "@/shared/config";

const blank = (title: string): FormDocument => ({
  schemaVersion: 1,
  id: "new",
  title,
  locales: { default: "en", supported: ["en", "fa"] },
  steps: [{ key: "main", fields: [] }],
});

/** The ways to start a new form. */
export function CreateFormOptions() {
  const t = useTranslations("forms");
  const router = useRouter();
  const [pending, start] = useTransition();
  const options = [
    {
      icon: FilePlus2,
      title: t("newBlank"),
      hint: t("newBlankHint"),
      make: () => blank(t("newBlank")),
    },
    {
      icon: LayoutTemplate,
      title: t("newTemplate"),
      hint: t("newTemplateHint"),
      make: () => feedbackTemplate,
    },
  ];
  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o.title}
          type="button"
          className="flex items-start gap-3 rounded-[14px] border border-line bg-surface p-4 text-start shadow-xs hover:border-line-strong focus-visible:outline-3 focus-visible:outline-primary-soft"
          disabled={pending}
          onClick={() => {
            start(async () => {
              router.push(`/forms/${await createMyForm(o.make())}`);
            });
          }}
        >
          <span className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-fg">
            <o.icon size={18} aria-hidden />
          </span>
          <span>
            <b className="block text-sm font-semibold">{o.title}</b>
            <span className="text-[12.5px] text-ink-2">{o.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
