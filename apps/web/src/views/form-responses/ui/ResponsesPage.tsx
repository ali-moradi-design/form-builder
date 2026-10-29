import { resolveText } from "@formcanvas/engine/i18n";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  deleteMyResponses,
  FILE_TYPES,
  filesOf,
  formatAnswer,
  parseFilter,
  responseColumns,
} from "@/entities/response";
import { getUser } from "@/shared/auth";
import { getDb, getForm, listResponses, listVersions } from "@/shared/db";
import { AppShell } from "@/widgets/app-shell";
import { ResponsesNav } from "@/widgets/responses-nav";
import { ExportMenu } from "./ExportMenu";
import { ResponseFilters } from "@/features/filter-responses";
import { ResponsesTable } from "./ResponsesTable";

const PAGE = 25;

/** Query string of the responses page. */
export interface ResponsesQuery {
  readonly page?: string | undefined;
  readonly version?: string | undefined;
  readonly days?: string | undefined;
}

/** The responses of one form: filters, a paged table and bulk delete. */
export async function ResponsesPage({ id, query }: { id: string; query: ResponsesQuery }) {
  const user = await getUser();
  const db = await getDb();
  const form = user ? await getForm(db, user.id, id) : undefined;
  if (!user || !form) notFound();
  const locale = await getLocale();
  const t = await getTranslations("responses");
  const tb = await getTranslations("builder");

  const versions = await listVersions(db, user.id, id);
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const { filter, days } = parseFilter(
    query,
    versions.map((v) => v.version),
  );
  const { version, from } = filter;
  const filtered = version !== undefined || from !== undefined;

  const [result, everything] = await Promise.all([
    listResponses(db, user.id, id, filter, { limit: PAGE, offset: (page - 1) * PAGE }),
    filtered ? listResponses(db, user.id, id, {}, { limit: 0, offset: 0 }) : null,
  ]);
  const rows = result?.rows ?? [];
  const total = result?.total ?? 0;
  const columns = responseColumns(
    versions.map((v) => v.document),
    locale,
  );
  const title = resolveText(form.draft.title, locale, form.draft.locales.default);
  const yesNo = [t("yes"), t("no")] as const;

  return (
    <AppShell crumbs={[title, t("title")]}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grow">
          <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-ink-2">
            {t("summary", { total: everything?.total ?? total, versions: versions.length })}
            {filtered && ` ${t("matching", { count: total })}`}
          </p>
        </div>
        <ResponsesNav formId={id} current="table" />
        {versions.length > 0 && <ExportMenu formId={id} count={total} />}
      </div>
      <ResponseFilters versions={versions.map((v) => v.version)} version={version} days={days} />
      {versions.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-line-strong p-8 text-center text-ink-2">
          {t("notPublished", { publish: tb("build") })}
        </p>
      ) : (
        <ResponsesTable
          formId={id}
          onDelete={async (ids) => {
            "use server";
            return deleteMyResponses(id, ids);
          }}
          columns={columns.map((c) => ({ key: c.key, label: c.label }))}
          rows={rows.map((r) => ({
            id: r.id,
            version: r.version,
            locale: r.locale,
            createdAt: r.createdAt.toISOString(),
            cells: Object.fromEntries(
              columns.map((c) => [c.key, formatAnswer(c, r.data[c.key], yesNo)]),
            ),
            files: Object.fromEntries(
              columns
                .filter((c) => FILE_TYPES.has(c.type))
                .map((c) => [c.key, filesOf(r.data[c.key])]),
            ),
          }))}
          page={page}
          pages={Math.max(1, Math.ceil(total / PAGE))}
          total={total}
          first={(page - 1) * PAGE + 1}
        />
      )}
    </AppShell>
  );
}
