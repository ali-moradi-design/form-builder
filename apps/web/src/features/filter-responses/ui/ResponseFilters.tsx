"use client";

import { CalendarRange, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const select =
  "h-9 appearance-none rounded-[9px] border border-line-strong bg-surface ps-9 pe-8 text-[13px] shadow-xs focus-visible:outline-3 focus-visible:outline-primary-soft";

/** Date range and version filters; they live in the URL. */
export function ResponseFilters({
  versions,
  version,
  days,
}: {
  versions: readonly number[];
  version: number | undefined;
  days: string;
}) {
  const t = useTranslations("responses");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <label className="relative">
        <span className="sr-only">{t("dateRange")}</span>
        <CalendarRange
          size={15}
          className="pointer-events-none absolute start-3 top-2.5 text-ink-3"
          aria-hidden
        />
        <select
          className={select}
          value={days}
          onChange={(e) => {
            set("days", e.target.value);
          }}
        >
          <option value="all">{t("allTime")}</option>
          {(["7", "30", "90"] as const).map((d) => (
            <option key={d} value={d}>
              {t("lastDays", { days: Number(d) })}
            </option>
          ))}
        </select>
      </label>
      <label className="relative">
        <span className="sr-only">{t("version")}</span>
        <History
          size={15}
          className="pointer-events-none absolute start-3 top-2.5 text-ink-3"
          aria-hidden
        />
        <select
          className={select}
          value={version === undefined ? "all" : String(version)}
          onChange={(e) => {
            set("version", e.target.value);
          }}
        >
          <option value="all">{t("allVersions")}</option>
          {versions.map((v) => (
            <option key={v} value={v}>
              {t("versionN", { version: v })}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
