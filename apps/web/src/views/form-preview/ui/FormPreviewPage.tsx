import { getTranslations } from "next-intl/server";
import { AppShell } from "@/widgets/app-shell";
import { FormPreview } from "./FormPreview";

/** Preview of one draft. */
export async function FormPreviewPage({ id }: { id: string }) {
  const t = await getTranslations();
  return (
    <AppShell crumbs={[t("forms.title"), t("preview.title")]}>
      <FormPreview id={id} />
    </AppShell>
  );
}
