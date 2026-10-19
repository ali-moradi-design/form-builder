import { resolveText } from "@formweave/engine/i18n";
import { CalendarDays, History, Inbox } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  parseFilter,
  perDay,
  responseColumns,
  summarize,
  type FieldSummary,
} from "@/entities/response";
import { ResponseFilters } from "@/features/filter-responses";
import { getUser } from "@/shared/auth";
import { getDb, getForm, listResponses, listVersions } from "@/shared/db";
import { AppShell } from "@/widgets/app-shell";
import { ResponsesNav } from "@/widgets/responses-nav";
import { ColumnChart } from "./charts";

const MAX_ROWS = 50_000;

function Card({
  title,
  note,
  children,
  wide,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      aria-label={title}
      className={`flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5 shadow-xs ${wide ? "lg:col-span-2" : ""}`}
    >
      <div className="flex items-baseline gap-3">
        <h2 className="grow text-[15px] font-semibold">{title}</h2>
        {note && <span className="text-[12.5px] text-ink-3">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-5 shadow-xs">
      <span className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
        <span className="grid size-8 place-items-center rounded-[9px] bg-primary-soft text-primary-fg">
          {icon}
        </span>
        {label}
      </span>
      <span className="text-[30px] leading-none font-semibold tracking-tight">{value}</span>
    </div>
  );
}

/** Charts and numbers for one form's answers (mockup 09). */
export async function AnalyticsPage({
  id,
  query,
}: {
  id: string;
  query: { version?: string | undefined; days?: string | undefined };
}) {
  const user = await getUser();
  const db = await getDb();
  const form = user ? await getForm(db, user.id, id) : undefined;
  if (!user || !form) notFound();
  const locale = await getLocale();
  const t = await getTranslations("analytics");
  const tr = await getTranslations("responses");
  const format = await getFormatter();

  const versions = await listVersions(db, user.id, id);
  const { filter, days } = parseFilter(
    query,
    versions.map((v) => v.version),
  );
  const result = await listResponses(db, user.id, id, filter, { limit: MAX_ROWS, offset: 0 });
  const rows = result?.rows ?? [];
  const columns = responseColumns(
    versions.map((v) => v.document),
    locale,
  );
  const summaries = summarize(
    columns,
    rows.map((r) => r.data),
    [tr("yes"), tr("no")],
  );
  const daily = perDay(
    rows.map((r) => r.createdAt),
    days === "all" ? 30 : Number(days),
  );
  const week = perDay(
    rows.map((r) => r.createdAt),
    7,
  ).reduce((n, d) => n + d.count, 0);
  const title = resolveText(form.draft.title, locale, form.draft.locales.default);
  const n = (v: number) => format.number(v, { maximumFractionDigits: 1 });
  const pct = (v: number, of: number) => format.number(of ? v / of : 0, { style: "percent" });

  const field = (s: FieldSummary) => {
    if (s.kind === "choice") {
      const of = s.answered;
      return (
        <Card key={s.key} title={s.label} note={t("answers", { count: s.answered })}>
          <ul className="grid gap-3">
            {s.buckets.map((b) => (
              <li
                key={b.label}
                className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-[13.5px]"
              >
                <span className="flex min-w-0 items-center gap-2 truncate">
                  {s.colors && (
                    <span
                      aria-hidden
                      className="size-4 shrink-0 rounded border border-line"
                      style={{ background: b.label }}
                    />
                  )}
                  <span className={s.colors ? "font-mono text-[12.5px]" : "truncate"} dir="auto">
                    {b.label}
                  </span>
                </span>
                <span className="h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                  <span
                    className="block h-full rounded-full bg-[var(--chart)]"
                    style={{ inlineSize: `${String(of ? (b.count / of) * 100 : 0)}%` }}
                  />
                </span>
                <span className="text-ink-2 tabular-nums">
                  {n(b.count)}, {pct(b.count, of)}
                </span>
              </li>
            ))}
          </ul>
          {s.multiple && <p className="text-[12.5px] text-ink-3">{t("multiple")}</p>}
        </Card>
      );
    }
    if (s.kind === "number") {
      return (
        <Card key={s.key} title={s.label} note={t("answers", { count: s.answered })}>
          <dl className="grid grid-cols-4 gap-2 text-center">
            {(
              [
                ["mean", s.mean],
                ["median", s.median],
                ["min", s.min],
                ["max", s.max],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-[10px] bg-surface-2 py-2">
                <dt className="text-[12px] text-ink-3">{t(k)}</dt>
                <dd className="text-lg font-semibold tabular-nums">{n(v)}</dd>
              </div>
            ))}
          </dl>
          <ColumnChart data={s.histogram} name={t("responsesSeries")} height={160} />
        </Card>
      );
    }
    return (
      <Card key={s.key} title={s.label} note={t("answers", { count: s.answered })}>
        {s.latest.length === 0 ? (
          <p className="text-[13px] text-ink-3">{t("noAnswers")}</p>
        ) : (
          <ul className="grid gap-2">
            {s.latest.map((v, i) => (
              <li
                key={i}
                className="rounded-[10px] bg-surface-2 px-3 py-2 text-[13.5px]"
                dir="auto"
              >
                {v}
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  };

  return (
    <AppShell crumbs={[title, t("title")]}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grow">
          <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-ink-2">{t("subtitle", { title })}</p>
        </div>
        <ResponsesNav formId={id} current="analytics" />
      </div>
      <ResponseFilters
        versions={versions.map((v) => v.version)}
        version={filter.version}
        days={days}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile
          icon={<Inbox size={16} aria-hidden />}
          label={t("responses")}
          value={n(rows.length)}
        />
        <Tile icon={<CalendarDays size={16} aria-hidden />} label={t("lastWeek")} value={n(week)} />
        <Tile
          icon={<History size={16} aria-hidden />}
          label={t("versions")}
          value={n(versions.length)}
        />
      </div>
      {rows.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-line-strong p-8 text-center text-ink-2">
          {tr("empty")}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={t("perDay")} note={t("days", { count: daily.length })} wide>
            <ColumnChart data={daily} name={t("responsesSeries")} dates />
          </Card>
          {summaries.map(field)}
        </div>
      )}
    </AppShell>
  );
}
