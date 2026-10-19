import { getTranslations } from "next-intl/server";
import { AppShell } from "@/widgets/app-shell";
import { TemplateGallery } from "./TemplateGallery";

/** Ready-made forms to start from. */
export async function TemplateGalleryPage() {
  const t = await getTranslations("templates");
  const tf = await getTranslations("forms");
  return (
    <AppShell crumbs={[tf("title"), t("title")]} current="templates">
      <TemplateGallery />
    </AppShell>
  );
}
