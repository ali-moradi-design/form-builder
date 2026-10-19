import { ChartColumn, Table2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

/** Switch between the responses table and the analytics charts. */
export async function ResponsesNav({
  formId,
  current,
}: {
  formId: string;
  current: "table" | "analytics";
}) {
  const t = await getTranslations("analytics");
  const tab =
    "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink-2 aria-[current=page]:bg-surface aria-[current=page]:text-ink aria-[current=page]:shadow-xs";
  return (
    <nav
      aria-label={t("views")}
      className="flex gap-1 rounded-[11px] border border-line bg-surface-2 p-1"
    >
      <Link
        href={`/forms/${formId}/responses`}
        aria-current={current === "table" ? "page" : undefined}
        className={tab}
      >
        <Table2 size={15} aria-hidden />
        {t("table")}
      </Link>
      <Link
        href={`/forms/${formId}/analytics`}
        aria-current={current === "analytics" ? "page" : undefined}
        className={tab}
      >
        <ChartColumn size={15} aria-hidden />
        {t("title")}
      </Link>
    </nav>
  );
}
