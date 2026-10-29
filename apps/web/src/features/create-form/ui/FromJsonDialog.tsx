"use client";

import { inferForm } from "@formcanvas/engine/infer";
import type { FieldNode, FormDocument } from "@formcanvas/schema";
import { Braces, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useId, useState } from "react";
import { FIELD_TYPES, fieldType } from "@/shared/config";
import { Button } from "@/shared/ui";

/** Types a detected value can be changed to; containers keep their kind. */
const VALUE_TYPES = FIELD_TYPES.filter(
  (t) => !["group", "repeater", "heading", "paragraph", "divider", "calculated"].includes(t.type),
);

const EXAMPLE = `{
  "name": "Sara Ahmadi",
  "email": "sara@example.com",
  "joined": "2026-03-14",
  "brandColor": "#0f4c5c",
  "seats": 12,
  "newsletter": true,
  "address": { "city": "Tehran", "postalCode": "12345" },
  "shareholders": [{ "name": "Ali", "share": 60 }]
}`;

const count = (fields: readonly FieldNode[], type?: string): number =>
  fields.reduce(
    (n, f) => n + (type === undefined || f.type === type ? 1 : 0) + count(f.fields ?? [], type),
    0,
  );

/**
 * Creates a form from a pasted sample record: reads it, shows the detected
 * fields with their types, and lets people change a type before creating.
 */
export function FromJsonDialog({
  trigger,
  onCreate,
  pending,
}: {
  trigger: React.ReactNode;
  onCreate: (document: FormDocument) => void;
  pending: boolean;
}) {
  const t = useTranslations("forms");
  const tt = useTranslations("fieldTypes");
  const id = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState(false);
  const [fields, setFields] = useState<FieldNode[] | null>(null);

  const read = () => {
    try {
      const found = inferForm(JSON.parse(text), "").steps[0]?.fields ?? [];
      setFields([...found]);
      setError(found.length === 0);
    } catch {
      setError(true);
      setFields(null);
    }
  };

  const retype = (index: number, type: string) => {
    if (!fields) return;
    const old = fields[index];
    const info = fieldType(type);
    if (!old || !info) return;
    const label = typeof old.label === "string" ? old.label : old.key;
    const next = [...fields];
    next[index] = info.create(old.key, label);
    setFields(next);
  };

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) {
          setFields(null);
          setError(false);
        }
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgb(20_26_28/0.45)] backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 grid max-h-[90dvh] w-[min(820px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_1fr_auto] rounded-[18px] border border-line bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.35)]">
          <div className="flex items-start gap-3 px-6 pt-5 pb-3">
            <span className="grid size-10 place-items-center rounded-[10px] bg-primary-soft text-primary-fg">
              <Braces size={18} aria-hidden />
            </span>
            <div className="grow">
              <Dialog.Title className="text-lg font-semibold tracking-tight">
                {fields ? t("jsonReview") : t("jsonTitle")}
              </Dialog.Title>
              <Dialog.Description className="text-[13.5px] text-ink-2">
                {fields ? t("jsonReviewText") : t("jsonText")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label={t("close")}>
                <X size={16} aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-6 py-2">
            {fields ? (
              <>
                <p className="mb-3 text-[13px] text-ink-2">
                  {t("jsonSummary", {
                    fields: count(fields),
                    groups: count(fields, "group"),
                    repeaters: count(fields, "repeater"),
                  })}
                </p>
                <ul className="divide-y divide-line rounded-[12px] border border-line">
                  {fields.map((f, i) => {
                    const info = fieldType(f.type);
                    const Icon = info?.icon;
                    const container = f.type === "group" || f.type === "repeater";
                    return (
                      <li key={f.key} className="flex items-center gap-3 px-3.5 py-2">
                        <span dir="ltr" className="grow truncate font-mono text-[13px]">
                          {f.key}
                        </span>
                        {container ? (
                          <span className="flex items-center gap-2 text-[13px] text-ink-2">
                            {Icon && <Icon size={15} aria-hidden />}
                            {t("jsonContainer", {
                              type: tt(f.type as never),
                              count: f.fields?.length ?? 0,
                            })}
                          </span>
                        ) : (
                          <select
                            aria-label={t("jsonTypeOf", { key: f.key })}
                            value={f.type}
                            onChange={(e) => {
                              retype(i, e.target.value);
                            }}
                            className="h-9 w-[220px] rounded-lg border border-line-strong bg-surface px-2 text-[13px] focus-visible:outline-3 focus-visible:outline-primary-soft"
                          >
                            {VALUE_TYPES.map((v) => (
                              <option key={v.type} value={v.type}>
                                {tt(v.type as never)}
                              </option>
                            ))}
                          </select>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="grid gap-1.5">
                <label htmlFor={id} className="text-[13px] font-medium">
                  {t("jsonSample")}
                </label>
                <textarea
                  id={id}
                  dir="ltr"
                  rows={12}
                  spellCheck={false}
                  placeholder={EXAMPLE}
                  value={text}
                  aria-invalid={error}
                  aria-describedby={error ? `${id}-error` : undefined}
                  onChange={(e) => {
                    setText(e.target.value);
                    setError(false);
                  }}
                  className="rounded-[12px] border border-line-strong bg-surface-2 p-3 font-mono text-[13px] aria-invalid:border-carmine focus-visible:outline-3 focus-visible:outline-primary-soft"
                />
                {error && (
                  <p id={`${id}-error`} role="alert" className="text-[13px] text-carmine">
                    {t("jsonError")}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
            {fields ? (
              <Button
                onClick={() => {
                  setFields(null);
                }}
              >
                {t("jsonBack")}
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => {
                  setText(EXAMPLE);
                  setError(false);
                }}
              >
                {t("jsonExample")}
              </Button>
            )}
            {fields ? (
              <Button
                variant="primary"
                disabled={pending}
                onClick={() => {
                  onCreate({
                    schemaVersion: 1,
                    id: "new",
                    title: t("jsonFormTitle"),
                    locales: { default: "en", supported: ["en", "fa"] },
                    steps: [{ key: "main", fields }],
                  });
                }}
              >
                {t("jsonCreate", { count: count(fields) })}
              </Button>
            ) : (
              <Button variant="primary" disabled={!text.trim()} onClick={read}>
                {t("jsonRead")}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
