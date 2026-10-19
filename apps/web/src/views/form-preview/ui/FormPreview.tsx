"use client";

import { createRegistry } from "@formweave/engine";
import { allFields } from "@formweave/engine/fields/all";
import { createRenderers, Form, type Values } from "@formweave/react";
import { basicRenderers } from "@formweave/react/fields";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useDraft } from "@/entities/form";

const registry = createRegistry(allFields);
const renderers = createRenderers(basicRenderers);

/** Fills in a draft with the real renderer and shows the submitted data. */
export function FormPreview({ id }: { id: string }) {
  const draft = useDraft(id);
  const locale = useLocale();
  const t = useTranslations("preview");
  const [data, setData] = useState<Values | null>(null);
  if (!draft) return <p className="text-ink-2">{t("notFound")}</p>;
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="rounded-[14px] border border-line bg-surface p-6 shadow-xs">
        <Form
          schema={draft.document}
          registry={registry}
          renderers={renderers}
          locale={draft.document.locales.supported?.includes(locale) ? locale : undefined}
          layout="focus"
          onSubmit={(values) => {
            setData(values);
          }}
        />
      </section>
      <section className="rounded-[14px] border border-line bg-surface p-6 shadow-xs">
        <h2 className="mb-2 text-[15px] font-semibold">{t("submitted")}</h2>
        <pre className="text-[13px] whitespace-pre-wrap" dir="ltr">
          {data ? JSON.stringify(data, null, 2) : "—"}
        </pre>
      </section>
    </div>
  );
}
