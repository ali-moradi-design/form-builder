"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";
import { FIELD_GROUPS, FIELD_TYPES, type FieldTypeInfo } from "@/shared/config";
import { cn } from "@/shared/lib";
import { addField } from "../model/actions";
import { useBuilderApi } from "../model/context";
import { useBuilderDraggable } from "./dnd";

/**
 * Field types to add, grouped, with a search box. Memoized: it reads nothing
 * from the document, so edits must not re-render its items.
 */
export const Palette = memo(function Palette() {
  const t = useTranslations("builder");
  const tt = useTranslations("fieldTypes");
  const { store } = useBuilderApi();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = FIELD_TYPES.filter(
    (f) => !q || tt(f.type).toLowerCase().includes(q) || f.type.toLowerCase().includes(q),
  );
  return (
    <nav aria-label={t("fields")} className="flex flex-col gap-3 p-4">
      <h2 className="flex items-baseline gap-2 text-[15px] font-semibold">
        {t("fields")}
        <span className="text-xs font-normal text-ink-3">{FIELD_TYPES.length}</span>
      </h2>
      <label className="flex h-9 items-center gap-2 rounded-[9px] border border-line bg-surface px-2.5 text-ink-3 focus-within:outline-3 focus-within:outline-primary-soft">
        <Search size={15} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder={t("search")}
          aria-label={t("search")}
          className="min-w-0 grow bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3"
        />
      </label>
      {matches.length === 0 && <p className="text-[13px] text-ink-3">{t("noMatch")}</p>}
      {FIELD_GROUPS.map((group) => {
        const items = matches.filter((f) => f.group === group);
        if (items.length === 0) return null;
        return (
          <section key={group} className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-medium tracking-wide text-ink-3 uppercase">
              {t(`groups.${group}`)}
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {items.map((f) => (
                <PaletteItem
                  key={f.type}
                  info={f}
                  name={tt(f.type)}
                  label={t("add", { type: tt(f.type) })}
                  onAdd={() => {
                    addField(store, f, t("newField"));
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}
    </nav>
  );
});

function PaletteItem({
  info,
  name,
  label,
  onAdd,
}: {
  info: FieldTypeInfo;
  name: string;
  label: string;
  onAdd: () => void;
}) {
  const { ref, isDragSource } = useBuilderDraggable(`palette:${info.type}`, {
    kind: "new",
    type: info.type,
  });
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onAdd}
      className={cn(
        "flex h-9 cursor-grab items-center gap-2 rounded-[9px] border border-line bg-surface px-2 text-start text-[12.5px] shadow-xs hover:border-line-strong focus-visible:outline-3 focus-visible:outline-primary-soft",
        isDragSource && "opacity-50",
      )}
    >
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-surface-2 text-primary-fg">
        <info.icon size={14} aria-hidden />
      </span>
      <span className="truncate">{name}</span>
    </button>
  );
}
