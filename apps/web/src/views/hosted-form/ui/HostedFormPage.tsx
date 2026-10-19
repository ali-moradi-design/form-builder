import { resolveText } from "@formweave/engine/i18n";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { FieldNode } from "@formweave/schema";
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

type Query = Readonly<Record<string, string | string[] | undefined>>;

/** Values for hidden fields that name a URL parameter (`settings.fromUrl`). */
function hiddenValues(
  fields: readonly FieldNode[],
  query: Query,
  out: Record<string, string> = {},
) {
  for (const f of fields) {
    if (f.fields) hiddenValues(f.fields, query, out);
    const param = f.type === "hidden" ? f.settings?.fromUrl : undefined;
    const value = typeof param === "string" ? query[param] : undefined;
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) out[f.key] = first.slice(0, 1000);
  }
  return out;
}

/** The public page of a published form. */
export async function HostedFormPage({ slug, query = {} }: { slug: string; query?: Query }) {
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
      defaultValues={hiddenValues(
        document.steps.flatMap((step) => step.fields),
        query,
      )}
      submit={async (s, values, locale, honeypot) => {
        "use server";
        const result = await submitResponse(s, values, locale, honeypot);
        return result.ok ? { ok: true } : { ok: false, reason: result.reason };
      }}
    />
  );
}
