"use client";

import { compile, type CompiledField, type CompiledForm } from "@formcanvas/engine";
import { isRtl, resolveText } from "@formcanvas/engine/i18n";
import type { FieldNode, FormDocument, Locale } from "@formcanvas/schema";
import { ArrowDown, ArrowUp, Copy, GitBranch, GripVertical, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, memo, useMemo, type ReactNode } from "react";
import { addStep, uniqueKey } from "@/entities/form";
import { registry, renderers } from "@/shared/formcanvas";
import { CONTAINER_TYPES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";
import { duplicateSelected, nudgeField, removeSelected } from "../model/actions";
import { useBuilder, useBuilderApi } from "../model/context";
import { DropSlot, useBuilderDraggable } from "./dnd";

/** The form as it will look, with selectable steps and fields. */
export function Canvas({ locale }: { locale: Locale }) {
  const t = useTranslations("builder");
  const doc = useBuilder((s) => s.doc);
  const selection = useBuilder((s) => s.selection);
  const { store } = useBuilderApi();
  const compiled = useMemo((): CompiledForm | null => {
    try {
      return compile(doc, { registry });
    } catch {
      return null;
    }
  }, [doc]);
  const fallback = doc.locales.default;
  const text = (v: Parameters<typeof resolveText>[0]) => resolveText(v, locale, fallback);
  const select = store.getState().select;

  if (!compiled) {
    return <p className="m-6 rounded-[14px] bg-surface p-6 text-ink-2">{t("invalidSchema")}</p>;
  }
  return (
    <div
      className="mx-auto my-6 flex w-full max-w-[760px] flex-col gap-6 rounded-[16px] border border-line bg-surface p-6 shadow-sm sm:p-8"
      dir={isRtl(locale) ? "rtl" : "ltr"}
      lang={locale}
    >
      <button
        type="button"
        aria-pressed={selection.kind === "form"}
        onClick={() => {
          select({ kind: "form" });
        }}
        className="-m-2 rounded-xl p-2 text-start outline-offset-2 hover:bg-surface-2 focus-visible:outline-3 focus-visible:outline-primary-soft aria-pressed:outline-2 aria-pressed:outline-orange"
      >
        <span className="block text-2xl font-semibold">{text(doc.title)}</span>
        {doc.description !== undefined && (
          <span className="mt-1 block text-ink-2">{text(doc.description)}</span>
        )}
      </button>
      {doc.steps.map((step, i) => (
        <section
          key={step.key}
          aria-label={text(step.title) || t("stepN", { n: i + 1 })}
          className="flex flex-col gap-3"
        >
          <button
            type="button"
            aria-pressed={selection.kind === "step" && selection.key === step.key}
            onClick={() => {
              select({ kind: "step", key: step.key });
            }}
            className="-mx-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-start hover:bg-surface-2 focus-visible:outline-3 focus-visible:outline-primary-soft aria-pressed:outline-2 aria-pressed:outline-orange"
          >
            <span className="grid size-7 place-items-center rounded-full bg-orange text-[13px] font-semibold text-white">
              {(i + 1).toLocaleString(locale)}
            </span>
            <span className="font-medium">{text(step.title) || t("stepN", { n: i + 1 })}</span>
            {step.visibleWhen !== undefined && <ConditionBadge />}
          </button>
          <FieldList
            fields={step.fields}
            form={compiled}
            locale={locale}
            step={step.key}
            empty={
              <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-[13px] text-ink-3">
                {t("emptyStep")}
              </p>
            }
          />
        </section>
      ))}
      <Button
        variant="ghost"
        className="self-start"
        onClick={() => {
          let key = "";
          store.getState().edit((d: FormDocument) => {
            key = uniqueKey(d, "step");
            return addStep(d, { key });
          });
          select({ kind: "step", key });
        }}
      >
        <Plus size={16} aria-hidden />
        {t("addStep")}
      </Button>
    </div>
  );
}

function ConditionBadge() {
  const t = useTranslations("builder");
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--plum)_12%,transparent)] px-2 py-0.5 text-[11.5px] font-medium text-plum dark:text-[#e7a3c8]">
      <GitBranch size={12} aria-hidden />
      {t("conditional")}
    </span>
  );
}

/**
 * Field cards only depend on their own nodes, so the lists and cards skip
 * re-rendering when an edit leaves their nodes untouched (edits copy only the
 * changed path). The compiled form is ignored in the comparison: it is rebuilt
 * on every edit, but a card's part of it only changes with its node.
 */
type ListProps = Parameters<typeof FieldListImpl>[0];
type CardProps = Parameters<typeof FieldCardImpl>[0];
const sameFallback = (a: CompiledForm, b: CompiledForm): boolean =>
  a.document.locales.default === b.document.locales.default;

const FieldList = memo(
  FieldListImpl,
  (a: ListProps, b: ListProps) =>
    a.fields === b.fields &&
    a.locale === b.locale &&
    a.step === b.step &&
    a.parent === b.parent &&
    sameFallback(a.form, b.form),
);

const FieldCard = memo(
  FieldCardImpl,
  (a: CardProps, b: CardProps) =>
    a.node === b.node &&
    a.locale === b.locale &&
    a.step === b.step &&
    a.first === b.first &&
    a.last === b.last &&
    sameFallback(a.form, b.form),
);

function FieldListImpl({
  fields,
  form,
  locale,
  step,
  parent,
  empty,
}: {
  fields: readonly FieldNode[];
  form: CompiledForm;
  locale: Locale;
  step: string;
  parent?: string;
  empty: ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
      {fields.map((f, i) => (
        <Fragment key={f.key}>
          <DropSlot place={{ step, parent, index: i }} />
          <FieldCard
            node={f}
            form={form}
            locale={locale}
            step={step}
            first={i === 0}
            last={i === fields.length - 1}
          />
        </Fragment>
      ))}
      <DropSlot
        place={{ step, parent, index: fields.length }}
        empty={fields.length === 0 ? empty : undefined}
      />
    </div>
  );
}

function FieldCardImpl({
  node,
  form,
  locale,
  step,
  first,
  last,
}: {
  node: FieldNode;
  form: CompiledForm;
  locale: Locale;
  step: string;
  first: boolean;
  last: boolean;
}) {
  const t = useTranslations("builder");
  const { store } = useBuilderApi();
  const selected = useBuilder((s) => s.selection.kind === "field" && s.selection.key === node.key);
  const fallback = form.document.locales.default;
  const label = resolveText(node.label, locale, fallback);
  const select = () => {
    store.getState().select({ kind: "field", key: node.key });
  };
  const { ref, handleRef, isDragSource } = useBuilderDraggable(`field:${node.key}`, {
    kind: "field",
    key: node.key,
  });
  const conditional =
    node.visibleWhen !== undefined ||
    node.requiredWhen !== undefined ||
    node.disabledWhen !== undefined;

  let body: ReactNode;
  if (CONTAINER_TYPES.has(node.type)) {
    const repeats = node.type === "repeater";
    body = (
      <div className="flex flex-col gap-2">
        {label && <p className="font-medium">{label}</p>}
        {repeats && <p className="text-[12.5px] text-ink-2">{t("repeaterHint")}</p>}
        <FieldList
          fields={node.fields ?? []}
          form={form}
          locale={locale}
          step={step}
          parent={node.key}
          empty={
            <p className="rounded-lg border border-dashed border-line-strong p-4 text-center text-[13px] text-ink-3">
              {t(repeats ? "emptyRepeater" : "emptyGroup")}
            </p>
          }
        />
      </div>
    );
  } else if (node.type === "hidden") {
    body = (
      <p className="rounded-lg border border-dashed border-line-strong px-3 py-2 text-[13px] text-ink-2">
        {label && <b className="me-1.5 font-medium text-ink">{label}</b>}
        {t("hiddenPreview")}
      </p>
    );
  } else {
    body = (
      <div inert className="fc-form pointer-events-none" data-layout="classic">
        <FieldPreview node={node} form={form} locale={locale} />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-selected={selected ? "" : undefined}
      onClick={(e) => {
        e.stopPropagation();
        select();
      }}
      className={cn(
        "group/card relative rounded-xl border border-transparent p-3 hover:border-line-strong",
        node.width === "half" ? "col-span-2 sm:col-span-1" : "col-span-2",
        isDragSource && "opacity-40",
        selected &&
          "border-orange bg-[color-mix(in_oklab,var(--amber)_8%,transparent)] hover:border-orange",
      )}
    >
      <div className="mb-1 flex items-center gap-1">
        <button
          type="button"
          ref={handleRef}
          aria-label={t("dragHandle")}
          title={t("dragHandle")}
          className="grid h-6 w-5 cursor-grab place-items-center rounded text-ink-3 hover:bg-surface-2 hover:text-ink focus-visible:outline-3 focus-visible:outline-primary-soft"
        >
          <GripVertical size={14} aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={selected}
          data-field-key={node.key}
          onClick={(e) => {
            e.stopPropagation();
            select();
          }}
          className="rounded-md px-1.5 py-0.5 font-mono text-[11.5px] text-ink-3 hover:bg-surface-2 focus-visible:outline-3 focus-visible:outline-primary-soft aria-pressed:bg-orange aria-pressed:text-white"
        >
          {node.key}
          <span className="sr-only">
            {" "}
            ({t("field")}: {label || node.type})
          </span>
        </button>
        {conditional && <ConditionBadge />}
        {selected && (
          <span className="ms-auto flex gap-0.5">
            <IconButton
              label={t("moveUp")}
              disabled={first}
              onClick={() => {
                nudgeField(store, node.key, -1);
              }}
            >
              <ArrowUp size={14} aria-hidden />
            </IconButton>
            <IconButton
              label={t("moveDown")}
              disabled={last}
              onClick={() => {
                nudgeField(store, node.key, 1);
              }}
            >
              <ArrowDown size={14} aria-hidden />
            </IconButton>
            <IconButton
              label={t("duplicate")}
              onClick={() => {
                duplicateSelected(store);
              }}
            >
              <Copy size={14} aria-hidden />
            </IconButton>
            <IconButton
              label={t("delete")}
              onClick={() => {
                removeSelected(store);
              }}
            >
              <Trash2 size={14} aria-hidden />
            </IconButton>
          </span>
        )}
      </div>
      {body}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="grid size-7 place-items-center rounded-md text-ink-2 hover:bg-surface hover:text-ink focus-visible:outline-3 focus-visible:outline-primary-soft disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** Draws a field with its real renderer, without a form around it. */
/** A compiled field by key, looking inside repeater rows too. */
function compiledField(form: CompiledForm, key: string): CompiledField | undefined {
  const own = form.fields.get(key);
  if (own) return own;
  for (const f of form.fields.values()) {
    const inner = f.rows && compiledField(f.rows, key);
    if (inner) return inner;
  }
  return undefined;
}

function FieldPreview({
  node,
  form,
  locale,
}: {
  node: FieldNode;
  form: CompiledForm;
  locale: Locale;
}) {
  const field = compiledField(form, node.key);
  const Renderer = renderers.get(node.type);
  if (!field || !Renderer) return <p className="text-ink-3">{node.type}</p>;
  const fallback = form.document.locales.default;
  const id = `canvas-${node.key}`;
  return (
    <Renderer
      field={field}
      state={{ visible: true, required: node.required === true, disabled: false }}
      locale={locale}
      fallbackLocale={fallback}
      id={id}
      name={node.key}
      label={resolveText(node.label, locale, fallback)}
      help={resolveText(node.help, locale, fallback)}
      placeholder={resolveText(node.placeholder, locale, fallback)}
      error={undefined}
      describedBy={`${id}-desc`}
      value={undefined}
      onChange={() => undefined}
      onBlur={() => undefined}
      inputRef={null}
    />
  );
}
