import { resolveText } from "@formweave/engine/i18n";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { submitResponse } from "@/entities/response";
import { getDb, getLiveForm } from "@/shared/db";
import { HostedForm } from "./HostedForm";

async function load(slug: string) {
  return getLiveForm(await getDb(), slug);
}

/** Page title from the form's title. */
export async function hostedFormMetadata(slug: string): Promise<Metadata> {
  const live = await load(slug);
  if (!live) return {};
  return {
    title: resolveText(live.document.title, await getLocale(), live.document.locales.default),
  };
}

/** The public page of a published form. */
export async function HostedFormPage({ slug }: { slug: string }) {
  const live = await load(slug);
  if (!live) notFound();
  const { document } = live;
  const appLocale = await getLocale();
  const supported = document.locales.supported ?? [document.locales.default];
  return (
    <HostedForm
      slug={slug}
      document={document}
      initialLocale={supported.includes(appLocale) ? appLocale : document.locales.default}
      submit={async (s, values, locale) => {
        "use server";
        const result = await submitResponse(s, values, locale);
        return result.ok ? { ok: true } : { ok: false, reason: result.reason };
      }}
    />
  );
}
