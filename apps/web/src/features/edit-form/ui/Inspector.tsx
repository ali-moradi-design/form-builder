"use client";

import { Form, type Values } from "@formweave/react";
import type { FieldNode, FormDocument, Locale } from "@formweave/schema";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { readsFields } from "@formweave/engine";
import { useId, useRef, useState } from "react";
import {
  findField,
  parseFormula,
  printFormula,
  removeStep,
  renameField,
  updateField,
  updateForm,
  updateStep,
} from "@/entities/form";
import { fieldType } from "@/shared/config";
import { registry, renderers } from "@/shared/formweave";
import { Button } from "@/shared/ui";
import { useBuilder, useBuilderApi } from "../model/context";
import { FieldLogic, StepLogic } from "./LogicEditor";
import { formulaKeys, makesCycle } from "../model/formula-scope";
import {
  docLocales,
  fieldPatch,
  fieldSettingsDocument,
  formPatch,
  formSettingsDocument,
  hasOptions,
  KEY_PATTERN,
  readText,
  stepSettingsDocument,
} from "../model/settings";
import type { Selection } from "../model/store";

const selectionId = (s: Selection): string => (s.kind === "form" ? "form" : `${s.kind}:${s.key}`);

/**
 * Remounts the settings form when the selection changes or the document is
 * changed from somewhere else (undo, canvas), but not while the panel itself
 * is editing, so typing keeps its focus.
 */
function usePanelKey(doc: FormDocument, selection: Selection) {
  const id = selectionId(selection);
  const ref = useRef({
    id,
    doc,
    n: 0,
    own: null as FormDocument | null,
    renamedTo: null as string | null,
  });
  const k = ref.current;
  if (id !== k.id) {
    if (id !== k.renamedTo) k.n++;
    k.id = id;
    k.renamedTo = null;
  }
  if (doc !== k.doc) {
    if (doc !== k.own) k.n++;
    k.doc = doc;
  }
  return {
    key: `${String(k.n)}:${docLocales(doc).join(",")}`,
    markOwn: (next: FormDocument) => {
      k.own = next;
    },
    markRename: (to: string) => {
      k.renamedTo = `field:${to}`;
    },
  };
}

/** Settings of the selected field, step or form, in the app's language (`locale`). */
export function Inspector({ locale }: { locale: Locale }) {
  const t = useTranslations("builder");
  const tt = useTranslations("fieldTypes");
  const tl = useTranslations("languages");
  const doc = useBuilder((s) => s.doc);
  const selection = useBuilder((s) => s.selection);
  const { store } = useBuilderApi();
  const panel = usePanelKey(doc, selection);
  const keyError = useRef<HTMLParagraphElement>(null);
  const language = (l: string) => (l === "en" || l === "fa" ? tl(l) : l);
  const translate = (k: string) => t(k as never);

  const edit = (fn: (d: FormDocument) => FormDocument, group: string) => {
    store.getState().edit(fn, group);
    panel.markOwn(store.getState().doc);
  };

  // Logic edits also change what the settings form shows (the Required
  // switch), so they let it remount.
  const editAll = (fn: (d: FormDocument) => FormDocument, group: string) => {
    store.getState().edit(fn, group);
  };

  const live = (
    document: FormDocument,
    values: Values,
    onChange: (v: Values, name: string | undefined) => void,
  ) => (
    <Form
      key={panel.key}
      schema={{ ...document, locales: { default: locale } }}
      registry={registry}
      renderers={renderers}
      defaultValues={values}
      actions={false}
      onChange={onChange}
    />
  );

  let title: string;
  let body;
  if (selection.kind === "field") {
    const found = findField(doc, selection.key);
    if (!found) return <Empty />;
    const node = found.field;
    const { document, values } = fieldSettingsDocument(node, doc, translate, language);
    title = tt(fieldType(node.type)?.type ?? "shortText");
    body = (
      <>
        {live(document, values, (v, name) => {
          if (name === "key") {
            const to = typeof v.key === "string" ? v.key : "";
            const taken =
              to !== node.key &&
              (findField(doc, to) !== undefined || doc.steps.some((s) => s.key === to));
            const ok = KEY_PATTERN.test(to) && !taken;
            if (keyError.current) keyError.current.hidden = ok || to === node.key;
            if (!ok) return;
            panel.markRename(to);
            edit((d) => renameField(d, node.key, to), `key:${node.key}`);
            store.getState().select({ kind: "field", key: to });
            return;
          }
          edit(
            (d) => updateField(d, node.key, fieldPatch(node, v, docLocales(d))),
            `field:${node.key}:${name ?? ""}`,
          );
        })}
        <p ref={keyError} hidden role="alert" className="-mt-2 text-[12.5px] text-[#c0392b]">
          {t("keyTaken")}
        </p>
        {hasOptions(node.type) && <OptionsEditor node={node} doc={doc} onEdit={edit} />}
        {node.type === "calculated" && (
          <FormulaEditor key={node.key} node={node} doc={doc} onEdit={edit} />
        )}
        <FieldLogic key={node.key} node={node} doc={doc} locale={locale} onEdit={editAll} />
      </>
    );
  } else if (selection.kind === "step") {
    const step = doc.steps.find((s) => s.key === selection.key);
    if (!step) return <Empty />;
    const { document, values } = stepSettingsDocument(step, doc, translate, language);
    title = t("step");
    body = (
      <>
        {live(document, values, (v, name) => {
          const locales = docLocales(doc);
          edit(
            (d) =>
              updateStep(d, step.key, {
                title: readText(v, "title", locales),
                description: readText(v, "description", locales),
              }),
            `step:${step.key}:${name ?? ""}`,
          );
        })}
        <Button
          variant="secondary"
          disabled={doc.steps.length === 1}
          onClick={() => {
            store.getState().edit((d) => removeStep(d, step.key));
            store.getState().select({ kind: "form" });
          }}
        >
          <Trash2 size={15} aria-hidden />
          {t("deleteStep")}
        </Button>
        <StepLogic key={step.key} stepKey={step.key} doc={doc} locale={locale} onEdit={editAll} />
      </>
    );
  } else {
    const { document, values } = formSettingsDocument(doc, translate, language);
    title = t("form");
    body = live(document, values, (v, name) => {
      edit((d) => updateForm(d, formPatch(d, v)), `form:${name ?? ""}`);
    });
  }

  return (
    <section aria-label={t("settings")} className="flex flex-col gap-4 p-4">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {body}
      <p className="mt-2 text-xs text-ink-3">{t("shortcuts")}</p>
    </section>
  );
}

function Empty() {
  const t = useTranslations("builder");
  return <p className="p-4 text-[13px] text-ink-3">{t("inspectorEmpty")}</p>;
}

interface Option {
  readonly value: string;
  readonly label?: unknown;
}

/** Edits the options of a choice field (until the engine has a repeater). */
function OptionsEditor({
  node,
  doc,
  onEdit,
}: {
  node: FieldNode;
  doc: FormDocument;
  onEdit: (fn: (d: FormDocument) => FormDocument, group: string) => void;
}) {
  const t = useTranslations("builder");
  const tl = useTranslations("languages");
  const locales = docLocales(doc);
  const options = (Array.isArray(node.settings?.options) ? node.settings.options : []) as Option[];
  const write = (next: Option[], group: string) => {
    onEdit(
      (d) => updateField(d, node.key, { settings: { ...node.settings, options: next } }),
      `options:${node.key}:${group}`,
    );
  };
  const labelOf = (o: Option, l: Locale, i: number): string => {
    if (typeof o.label === "string") return i === 0 ? o.label : "";
    if (o.label && typeof o.label === "object") return (o.label as Record<string, string>)[l] ?? "";
    return "";
  };
  const setLabel = (index: number, l: Locale, text: string) => {
    write(
      options.map((o, i) => {
        if (i !== index) return o;
        const record = Object.fromEntries(
          locales.map((x, j) => [x, x === l ? text : labelOf(o, x, j)]),
        );
        const values = Object.fromEntries(
          Object.entries(record).map(([k, v]) => [`label_${k}`, v]),
        );
        return { ...o, label: readText(values, "label", locales) };
      }),
      `${String(index)}:label:${l}`,
    );
  };
  const move = (index: number, by: number) => {
    const next = [...options];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + by, 0, item);
    write(next, "move");
  };
  const field =
    "h-8 min-w-0 rounded-lg border border-line-strong bg-surface px-2 text-[13px] outline-none focus:border-primary";
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-[13px] font-medium">{t("options")}</legend>
      {options.map((o, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-line p-2">
          <div className="flex items-center gap-1">
            <span className="grow text-xs text-ink-3">{t("option", { n: i + 1 })}</span>
            <button
              type="button"
              aria-label={t("moveUp")}
              disabled={i === 0}
              onClick={() => {
                move(i, -1);
              }}
              className="grid size-6 place-items-center rounded text-ink-2 disabled:opacity-40"
            >
              <ArrowUp size={13} aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t("moveDown")}
              disabled={i === options.length - 1}
              onClick={() => {
                move(i, 1);
              }}
              className="grid size-6 place-items-center rounded text-ink-2 disabled:opacity-40"
            >
              <ArrowDown size={13} aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t("removeOption")}
              disabled={options.length === 1}
              onClick={() => {
                write(
                  options.filter((_, j) => j !== i),
                  "remove",
                );
              }}
              className="grid size-6 place-items-center rounded text-ink-2 disabled:opacity-40"
            >
              <X size={13} aria-hidden />
            </button>
          </div>
          {locales.map((l, j) => (
            <input
              key={l}
              className={field}
              dir={l === "fa" ? "rtl" : "ltr"}
              aria-label={`${t("option", { n: i + 1 })} · ${l === "en" || l === "fa" ? tl(l) : l}`}
              value={labelOf(o, l, j)}
              onChange={(e) => {
                setLabel(i, l, e.target.value);
              }}
            />
          ))}
          <input
            className={`${field} font-mono`}
            dir="ltr"
            aria-label={`${t("option", { n: i + 1 })} · ${t("value")}`}
            value={o.value}
            onChange={(e) => {
              const value = e.target.value;
              if (!value || options.some((x, j) => j !== i && x.value === value)) return;
              write(
                options.map((x, j) => (j === i ? { ...x, value } : x)),
                `${String(i)}:value`,
              );
            }}
          />
        </div>
      ))}
      <Button
        variant="ghost"
        className="self-start"
        onClick={() => {
          let n = options.length + 1;
          while (options.some((o) => o.value === `option${String(n)}`)) n++;
          write([...options, { value: `option${String(n)}`, label: `Option ${String(n)}` }], "add");
        }}
      >
        <Plus size={15} aria-hidden />
        {t("addOption")}
      </Button>
    </fieldset>
  );
}

/** Edits the formula of a calculated field as text such as `quantity * price`. */
function FormulaEditor({
  node,
  doc,
  onEdit,
}: {
  node: FieldNode;
  doc: FormDocument;
  onEdit: (fn: (d: FormDocument) => FormDocument, group: string) => void;
}) {
  const t = useTranslations("builder");
  const id = useId();
  const keys = formulaKeys(doc, node.key);
  const [text, setText] = useState(() =>
    node.calculate === undefined ? "" : (printFormula(node.calculate) ?? ""),
  );
  const [error, setError] = useState<string | null>(null);
  const apply = (next: string) => {
    setText(next);
    if (next.trim() === "") {
      setError(null);
      onEdit((d) => updateField(d, node.key, { calculate: undefined }), `formula:${node.key}`);
      return;
    }
    const parsed = parseFormula(next, new Set(keys));
    if ("error" in parsed) {
      const { code, name } = parsed.error;
      setError(
        code === "unknownField"
          ? t("formulaUnknownField", { name: name ?? "" })
          : code === "unknownFunction"
            ? t("formulaUnknownFunction", { name: name ?? "" })
            : t("formulaSyntax"),
      );
      return;
    }
    if (makesCycle(doc, node.key, readsFields(parsed.expr))) {
      setError(t("formulaCycle"));
      return;
    }
    setError(null);
    onEdit((d) => updateField(d, node.key, { calculate: parsed.expr }), `formula:${node.key}`);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {t("formula")}
      </label>
      <textarea
        id={id}
        dir="ltr"
        rows={2}
        value={text}
        aria-invalid={error !== null}
        aria-describedby={`${id}-help`}
        onChange={(e) => {
          apply(e.target.value);
        }}
        className="rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[13px] aria-invalid:border-[#c0392b] focus-visible:outline-3 focus-visible:outline-primary-soft"
      />
      <div id={`${id}-help`} className="text-[12.5px]">
        {error ? (
          <p role="alert" className="text-[#c0392b]">
            {error}
          </p>
        ) : (
          <p className="text-ink-3">{t("formulaHelp")}</p>
        )}
      </div>
      {keys.length > 0 && (
        <div className="flex flex-wrap gap-1" aria-label={t("formulaFields")} role="group">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                apply(text.trim() === "" ? k : `${text.trimEnd()} ${k}`);
              }}
              className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11.5px] text-ink-2 hover:text-ink focus-visible:outline-3 focus-visible:outline-primary-soft"
            >
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
