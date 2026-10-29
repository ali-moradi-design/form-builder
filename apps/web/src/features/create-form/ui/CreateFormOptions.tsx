"use client";

import type { FormDocument } from "@formcanvas/schema";
import { Braces, FilePlus2, LayoutTemplate } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createMyForm } from "@/entities/form";
import { FromJsonDialog } from "./FromJsonDialog";

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
  const card =
    "flex items-start gap-3 rounded-[14px] border border-line bg-surface p-4 text-start shadow-xs hover:border-line-strong focus-visible:outline-3 focus-visible:outline-primary-soft";
  const create = (document: FormDocument) => {
    start(async () => {
      router.push(`/forms/${await createMyForm(document)}`);
    });
  };
  return (
    <div className="grid gap-3.5 sm:grid-cols-3">
      <button
        type="button"
        className={card}
        disabled={pending}
        onClick={() => {
          create(blank(t("newBlank")));
        }}
      >
        <span className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-fg">
          <FilePlus2 size={18} aria-hidden />
        </span>
        <span>
          <b className="block text-sm font-semibold">{t("newBlank")}</b>
          <span className="text-[12.5px] text-ink-2">{t("newBlankHint")}</span>
        </span>
      </button>
      <Link href="/templates" className={card}>
        <span className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-fg">
          <LayoutTemplate size={18} aria-hidden />
        </span>
        <span>
          <b className="block text-sm font-semibold">{t("newTemplate")}</b>
          <span className="text-[12.5px] text-ink-2">{t("newTemplateHint")}</span>
        </span>
      </Link>
      <FromJsonDialog
        pending={pending}
        onCreate={create}
        trigger={
          <button type="button" className={card} disabled={pending}>
            <span className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-fg">
              <Braces size={18} aria-hidden />
            </span>
            <span>
              <b className="block text-sm font-semibold">{t("newJson")}</b>
              <span className="text-[12.5px] text-ink-2">{t("newJsonHint")}</span>
            </span>
          </button>
        }
      />
    </div>
  );
}
