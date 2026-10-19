import { getTranslations } from "next-intl/server";
import { CreateFormOptions } from "@/features/create-form";
import { AppShell } from "@/widgets/app-shell";
import { FormsList } from "./FormsList";

/** The forms dashboard. */
export async function FormsListPage() {
  const t = await getTranslations("forms");
  return (
    <AppShell crumbs={[t("title")]}>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-ink-2">{t("subtitle")}</p>
      </div>
      <CreateFormOptions />
      <h2 className="text-[15px] font-semibold">{t("yourForms")}</h2>
      <FormsList />
      <p className="text-xs text-ink-3">{t("localNote")}</p>
    </AppShell>
  );
}
