import { resolveText } from "@formweave/engine/i18n";
import { getLocale, getTranslations } from "next-intl/server";
import {
  EXPORT_FORMATS,
  parseFilter,
  responseColumns,
  toCsv,
  toJson,
  toTable,
  toXlsx,
} from "@/entities/response";
import { getUser } from "@/shared/auth";
import { getDb, getForm, listResponses, listVersions, slugify } from "@/shared/db";

const MAX_ROWS = 50_000;
const TYPES = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  json: "application/json; charset=utf-8",
} as const;

/** GET /forms/<id>/responses/export?format=csv|xlsx|json&version=&days= (owner only). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  const db = await getDb();
  const form = user ? await getForm(db, user.id, id) : undefined;
  if (!user || !form) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const format = EXPORT_FORMATS.find((f) => f === url.searchParams.get("format")) ?? "csv";
  const versions = await listVersions(db, user.id, id);
  const { filter } = parseFilter(
    { version: url.searchParams.get("version"), days: url.searchParams.get("days") },
    versions.map((v) => v.version),
  );
  const result = await listResponses(db, user.id, id, filter, { limit: MAX_ROWS, offset: 0 });
  const rows = result?.rows ?? [];

  const locale = await getLocale();
  const t = await getTranslations("responses");
  const title = resolveText(form.draft.title, locale, form.draft.locales.default);
  const name = `${slugify(title) || "form"}-responses.${format}`;
  let body: string | ArrayBuffer;
  if (format === "json") {
    body = toJson(rows);
  } else {
    const columns = responseColumns(
      versions.map((v) => v.document),
      locale,
    );
    const table = toTable(columns, rows, {
      submitted: t("submitted"),
      version: t("version"),
      language: t("language"),
      yes: t("yes"),
      no: t("no"),
    });
    body = format === "csv" ? toCsv(table) : await toXlsx(table, title);
  }
  return new Response(body, {
    headers: {
      "Content-Type": TYPES[format],
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
