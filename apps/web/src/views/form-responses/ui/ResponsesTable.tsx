"use client";

import { Columns3, Trash2, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Dialog, Popover } from "radix-ui";
import { useState, useTransition } from "react";
import { Button } from "@/shared/ui";

interface Row {
  readonly id: string;
  readonly version: number;
  readonly locale: string | null;
  readonly createdAt: string;
  readonly cells: Readonly<Record<string, string>>;
  /** Files of file, image and signature answers, by column. */
  readonly files?: Readonly<Record<string, readonly { id: string; name: string }[]>>;
}

/** A page of responses with column choice, selection and delete. */
export function ResponsesTable({
  formId,
  onDelete,
  columns,
  rows,
  page,
  pages,
  total,
  first,
}: {
  formId: string;
  onDelete: (ids: string[]) => Promise<number>;
  columns: readonly { key: string; label: string }[];
  rows: readonly Row[];
  page: number;
  pages: number;
  total: number;
  first: number;
}) {
  const t = useTranslations("responses");
  const format = useFormatter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<Row | null>(null);
  const visible = columns.filter((c) => !hidden.has(c.key));
  const href = (p: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    return `${pathname}?${next.toString()}`;
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));

  if (total === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-line-strong p-8 text-center text-ink-2">
        {t("empty")}
      </p>
    );
  }
  return (
    <section
      aria-label={t("title")}
      className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-xs"
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="grow text-[13px] text-ink-2">
          {selected.size > 0
            ? t("selected", { count: selected.size })
            : t("range", { from: first, to: first + rows.length - 1, total })}
        </span>
        {selected.size > 0 && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(t("confirmDelete", { count: selected.size }))) return;
              start(async () => {
                await onDelete([...selected]);
                setSelected(new Set());
              });
            }}
          >
            <Trash2 size={15} aria-hidden />
            {t("delete")}
          </Button>
        )}
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button>
              <Columns3 size={15} aria-hidden />
              {t("columns")}
            </Button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={6}
              className="z-50 grid max-h-[360px] w-64 gap-1 overflow-y-auto rounded-[12px] border border-line bg-surface p-2 shadow-lg"
            >
              {columns.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    checked={!hidden.has(c.key)}
                    onChange={() => {
                      const next = new Set(hidden);
                      if (next.has(c.key)) next.delete(c.key);
                      else next.add(c.key);
                      setHidden(next);
                    }}
                  />
                  <span className="truncate">{c.label}</span>
                </label>
              ))}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-surface-2 text-start text-ink-2">
            <tr>
              <th scope="col" className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  aria-label={t("selectPage")}
                  checked={allOnPage}
                  onChange={() => {
                    setSelected(allOnPage ? new Set() : new Set(rows.map((r) => r.id)));
                  }}
                />
              </th>
              <th scope="col" className="px-3 py-2.5 text-start font-medium whitespace-nowrap">
                {t("submitted")}
              </th>
              <th scope="col" className="px-3 py-2.5 text-start font-medium">
                {t("version")}
              </th>
              {visible.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className="max-w-[240px] truncate px-3 py-2.5 text-start font-medium"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr
                key={r.id}
                data-selected={selected.has(r.id) ? "" : undefined}
                className="data-selected:bg-[color-mix(in_oklab,var(--amber)_8%,transparent)]"
              >
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={t("selectRow", {
                      date: format.dateTime(new Date(r.createdAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }),
                    })}
                    checked={selected.has(r.id)}
                    onChange={() => {
                      toggle(r.id);
                    }}
                  />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(r);
                    }}
                    className="rounded text-primary-fg underline-offset-2 hover:underline focus-visible:outline-3 focus-visible:outline-primary-soft"
                  >
                    {format.dateTime(new Date(r.createdAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[12px] text-ink-2">
                    v{r.version}
                  </span>
                </td>
                {visible.map((c) => (
                  <td
                    key={c.key}
                    className="max-w-[240px] truncate px-3 py-2.5"
                    title={r.cells[c.key]}
                  >
                    {r.cells[c.key] || <span className="text-ink-3">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav
        aria-label={t("pages")}
        className="flex items-center justify-end gap-2 border-t border-line px-4 py-3"
      >
        <span className="grow text-[13px] text-ink-3">{t("pageOf", { page, pages })}</span>
        {page > 1 ? (
          <Button asChild>
            <Link href={href(page - 1)}>{t("previous")}</Link>
          </Button>
        ) : (
          <Button disabled>{t("previous")}</Button>
        )}
        {page < pages ? (
          <Button asChild>
            <Link href={href(page + 1)}>{t("next")}</Link>
          </Button>
        ) : (
          <Button disabled>{t("next")}</Button>
        )}
      </nav>
      <Dialog.Root
        open={open !== null}
        onOpenChange={(o) => {
          if (!o) setOpen(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgb(20_26_28/0.45)]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 grid max-h-[85dvh] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_1fr] rounded-[16px] border border-line bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.35)]">
            {open && (
              <>
                <div className="flex items-start gap-3 border-b border-line px-5 py-4">
                  <div className="grow">
                    <Dialog.Title className="text-base font-semibold">{t("detail")}</Dialog.Title>
                    <Dialog.Description className="text-[13px] text-ink-2">
                      {format.dateTime(new Date(open.createdAt), {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}{" "}
                      · v{open.version}
                      {open.locale ? ` · ${open.locale}` : ""}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label={t("close")}>
                      <X size={16} aria-hidden />
                    </Button>
                  </Dialog.Close>
                </div>
                <dl className="grid gap-3 overflow-y-auto px-5 py-4">
                  {columns.map((c) => (
                    <div key={c.key} className="grid gap-0.5">
                      <dt className="text-[12.5px] text-ink-2">{c.label}</dt>
                      <dd className="text-[14px] whitespace-pre-wrap" dir="auto">
                        {open.files?.[c.key]?.length ? (
                          <ul className="flex flex-col gap-1">
                            {open.files[c.key]?.map((f) => (
                              <li key={f.id}>
                                <a
                                  href={`/forms/${formId}/responses/files/${f.id}`}
                                  className="text-primary-fg underline underline-offset-2"
                                  target="_blank"
                                  rel="noopener"
                                >
                                  {f.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          open.cells[c.key] || <span className="text-ink-3">—</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
