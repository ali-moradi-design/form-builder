import { getTranslations } from "next-intl/server";
import { CreateFormOptions } from "@/features/create-form";
import { getUser } from "@/shared/auth";
import { getDb, listForms } from "@/shared/db";
import { AppShell } from "@/widgets/app-shell";
import { FormsList } from "./FormsList";
import { ImportLocalDrafts } from "./ImportLocalDrafts";

/** The forms dashboard. */
export async function FormsListPage() {
  const t = await getTranslations("forms");
  const user = await getUser();
  const forms = user ? await listForms(await getDb(), user.id) : [];
  return (
    <AppShell crumbs={[t("title")]}>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-ink-2">{t("subtitle")}</p>
      </div>
      <ImportLocalDrafts />
      <CreateFormOptions />
      <h2 className="text-[15px] font-semibold">{t("yourForms")}</h2>
      <FormsList
        forms={forms.map((f) => ({
          id: f.id,
          draft: f.draft,
          updatedAt: f.updatedAt.toISOString(),
          liveVersion: f.liveVersion,
          responses: f.responses,
        }))}
      />
    </AppShell>
  );
}
