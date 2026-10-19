import { resolveText } from "@formweave/engine/i18n";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getUser } from "@/shared/auth";
import { getDb, getForm } from "@/shared/db";
import { AppShell } from "@/widgets/app-shell";
import { FormPreview } from "./FormPreview";

/** Preview of one of the signed-in user's drafts. */
export async function FormPreviewPage({ id }: { id: string }) {
  const user = await getUser();
  const form = user ? await getForm(await getDb(), user.id, id) : undefined;
  if (!form) notFound();
  const t = await getTranslations();
  const locale = await getLocale();
  return (
    <AppShell crumbs={[t("forms.title"), t("preview.title")]}>
      <h1 className="text-xl font-semibold tracking-tight">
        {resolveText(form.draft.title, locale, form.draft.locales.default)}
      </h1>
      <FormPreview id={form.id} document={form.draft} />
    </AppShell>
  );
}
