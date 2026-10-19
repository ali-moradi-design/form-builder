"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Popover } from "radix-ui";
import { useState } from "react";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";

const FORMATS = [
  { key: "csv", label: "CSV" },
  { key: "xlsx", label: "Excel" },
  { key: "json", label: "JSON" },
] as const;

/** Export button with format choice (mockup 08). */
export function ExportMenu({ formId, count }: { formId: string; count: number }) {
  const t = useTranslations("responses");
  const params = useSearchParams();
  const [format, setFormat] = useState<(typeof FORMATS)[number]["key"]>("csv");
  const [filtered, setFiltered] = useState(true);
  const query = new URLSearchParams({ format });
  if (filtered) {
    for (const key of ["version", "days"]) {
      const value = params.get(key);
      if (value) query.set(key, value);
    }
  }
  const label = FORMATS.find((f) => f.key === format)?.label ?? "";
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="primary">
          <Download size={15} aria-hidden />
          {t("export")}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 grid w-[320px] gap-4 rounded-[14px] border border-line bg-surface p-4 shadow-lg"
        >
          <p className="text-sm font-semibold">{t("exportTitle", { count })}</p>
          <div role="radiogroup" aria-label={t("format")} className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="radio"
                aria-checked={format === f.key}
                onClick={() => {
                  setFormat(f.key);
                }}
                className={cn(
                  "h-10 rounded-[10px] border text-[13px] font-medium",
                  format === f.key
                    ? "border-primary bg-primary-soft text-primary-fg"
                    : "border-line-strong",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between gap-3 text-[13px]">
            {t("onlyFilters")}
            <input
              type="checkbox"
              role="switch"
              checked={filtered}
              onChange={(e) => {
                setFiltered(e.target.checked);
              }}
            />
          </label>
          <Button asChild variant="primary" className="w-full">
            <a href={`/forms/${formId}/responses/export?${query.toString()}`} download>
              <Download size={15} aria-hidden />
              {t("download", { format: label })}
            </a>
          </Button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
