"use client";

import { resolveText } from "@formweave/engine/i18n";
import type { Expression, FieldNode, FormDocument, Locale } from "@formweave/schema";
import { Eye, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { findField } from "@/entities/form";
import { NUMBER_TYPES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { formulaKeys } from "../model/formula-scope";
import {
  fromExpression,
  NO_VALUE,
  setAt,
  toExpression,
  type Comparison,
  type Condition,
  type Group,
} from "../model/logic";

type Edit = (fn: (d: FormDocument) => FormDocument, group: string) => void;

/** What the editor needs to know about a field it can compare. */
interface FieldInfo {
  readonly key: string;
  readonly label: string;
  readonly type: string;
  readonly options?: readonly { value: string; label: string }[];
}

const LIST_TYPES = new Set(["checkboxes", "colorSet"]);
const ONE_OF_TYPES = new Set(["select", "radio"]);
const ORDERED_TYPES = new Set(["date", "time", "dateTime"]);

function comparisonsFor(type: string): readonly Comparison[] {
  if (LIST_TYPES.has(type)) return ["includes", "notEmpty", "empty"];
  if (type === "switch") return ["eq"];
  if (NUMBER_TYPES.has(type) || ORDERED_TYPES.has(type))
    return ["eq", "neq", "gt", "gte", "lt", "lte", "notEmpty", "empty"];
  return ["eq", "neq", "notEmpty", "empty"];
}

/** Starting value of a condition on `field`. */
function firstValue(field: FieldInfo | undefined): string | number | boolean {
  if (!field) return "";
  if (field.type === "switch") return true;
  if (field.options?.[0]) return field.options[0].value;
  return "";
}

const control =
  "h-8 min-w-0 rounded-lg border border-line-strong bg-surface px-2 text-[12.5px] focus-visible:outline-3 focus-visible:outline-primary-soft";

/** Picks a field, a comparison and a value. */
function ConditionRow({
  condition,
  fields,
  onChange,
  onRemove,
}: {
  condition: Condition;
  fields: readonly FieldInfo[];
  onChange: (next: Condition) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("builder");
  const field = fields.find((f) => f.key === condition.field);
  const ops = comparisonsFor(field?.type ?? "shortText");
  const opWord = (op: Comparison) =>
    t(
      field?.type && (ORDERED_TYPES.has(field.type) || field.type === "switch")
        ? (`op_${op}_${field.type === "switch" ? "switch" : "date"}` as never)
        : (`op_${op}` as never),
    );
  let value: ReactNode = (
    <span aria-hidden className="h-8 rounded-lg border border-dashed border-line" />
  );
  if (!NO_VALUE.has(condition.op)) {
    const common = {
      "aria-label": t("logicValue"),
      className: control,
    };
    if (field?.type === "switch") {
      value = (
        <select
          {...common}
          value={condition.value === true ? "true" : "false"}
          onChange={(e) => {
            onChange({ ...condition, value: e.target.value === "true" });
          }}
        >
          <option value="true">{t("logicOn")}</option>
          <option value="false">{t("logicOff")}</option>
        </select>
      );
    } else if (field?.options) {
      value = (
        <select
          {...common}
          value={String(condition.value)}
          onChange={(e) => {
            onChange({ ...condition, value: e.target.value });
          }}
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    } else {
      const numeric = field !== undefined && NUMBER_TYPES.has(field.type);
      value = (
        <input
          {...common}
          dir={numeric || ORDERED_TYPES.has(field?.type ?? "") ? "ltr" : "auto"}
          type={
            numeric
              ? "number"
              : field?.type === "date"
                ? "date"
                : field?.type === "time"
                  ? "time"
                  : "text"
          }
          value={String(condition.value)}
          onChange={(e) => {
            const raw = e.target.value;
            const n = Number(raw);
            onChange({ ...condition, value: numeric && raw !== "" && !Number.isNaN(n) ? n : raw });
          }}
        />
      );
    }
  }
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-1.5 rounded-[10px] border border-line bg-surface p-2">
      <select
        aria-label={t("logicField")}
        className={cn(control, "col-span-2")}
        value={condition.field}
        onChange={(e) => {
          const next = fields.find((f) => f.key === e.target.value);
          const allowed = comparisonsFor(next?.type ?? "shortText");
          onChange({
            kind: "condition",
            field: e.target.value,
            op: allowed.includes(condition.op) ? condition.op : (allowed[0] ?? "eq"),
            value: firstValue(next),
          });
        }}
      >
        <option value="" disabled>
          {t("logicChooseField")}
        </option>
        {fields.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-label={t("logicRemoveCondition")}
        onClick={onRemove}
        className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink focus-visible:outline-3 focus-visible:outline-primary-soft"
      >
        <X size={14} aria-hidden />
      </button>
      <select
        aria-label={t("logicOperator")}
        className={control}
        value={condition.op}
        onChange={(e) => {
          const op = e.target.value as Comparison;
          onChange({ ...condition, op, value: NO_VALUE.has(op) ? "" : condition.value });
        }}
      >
        {ops.map((op) => (
          <option key={op} value={op}>
            {opWord(op)}
          </option>
        ))}
      </select>
      {value}
    </div>
  );
}

/** A group of conditions with an all/any switch. Only the top group may hold groups. */
function GroupEditor({
  group,
  fields,
  nested,
  onChange,
  onRemove,
}: {
  group: Group;
  fields: readonly FieldInfo[];
  nested: boolean;
  onChange: (next: Group) => void;
  onRemove?: () => void;
}) {
  const t = useTranslations("builder");
  const newCondition = (): Condition => {
    const first = fields[0];
    return {
      kind: "condition",
      field: first?.key ?? "",
      op: comparisonsFor(first?.type ?? "shortText")[0] ?? "eq",
      value: firstValue(first),
    };
  };
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-line p-2.5",
        nested ? "border-s-[3px] border-s-amber bg-surface" : "bg-surface-2",
      )}
    >
      <div className="flex items-center gap-2 text-[12px]">
        <div
          role="group"
          aria-label={t("logicMatch")}
          className="flex rounded-lg border border-line bg-surface-2 p-0.5"
        >
          {(["and", "or"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={group.mode === mode}
              onClick={() => {
                onChange({ ...group, mode });
              }}
              className="rounded-md px-2 py-0.5 text-ink-2 aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-xs focus-visible:outline-3 focus-visible:outline-primary-soft"
            >
              {t(mode === "and" ? "logicAll" : "logicAny")}
            </button>
          ))}
        </div>
        <span className="grow text-ink-3">{t("logicOfThese")}</span>
        {onRemove && (
          <button
            type="button"
            aria-label={t("logicRemoveGroup")}
            onClick={onRemove}
            className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink focus-visible:outline-3 focus-visible:outline-primary-soft"
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </div>
      {group.items.map((item, i) =>
        item.kind === "condition" ? (
          <ConditionRow
            key={i}
            condition={item}
            fields={fields}
            onChange={(next) => {
              onChange(setAt(group, [i], next));
            }}
            onRemove={() => {
              onChange(setAt(group, [i], undefined));
            }}
          />
        ) : (
          <GroupEditor
            key={i}
            group={item}
            fields={fields}
            nested
            onChange={(next) => {
              onChange(setAt(group, [i], next));
            }}
            onRemove={() => {
              onChange(setAt(group, [i], undefined));
            }}
          />
        ),
      )}
      <div className="flex gap-3.5">
        <button
          type="button"
          disabled={fields.length === 0}
          onClick={() => {
            onChange({ ...group, items: [...group.items, newCondition()] });
          }}
          className="inline-flex items-center gap-1 rounded text-[12.5px] font-medium text-primary-fg focus-visible:outline-3 focus-visible:outline-primary-soft disabled:opacity-50"
        >
          <Plus size={14} aria-hidden />
          {t("logicAddCondition")}
        </button>
        {!nested && (
          <button
            type="button"
            disabled={fields.length === 0}
            onClick={() => {
              onChange({
                ...group,
                items: [
                  ...group.items,
                  {
                    kind: "group",
                    mode: group.mode === "and" ? "or" : "and",
                    items: [newCondition()],
                  },
                ],
              });
            }}
            className="inline-flex items-center gap-1 rounded text-[12.5px] font-medium text-primary-fg focus-visible:outline-3 focus-visible:outline-primary-soft disabled:opacity-50"
          >
            <Plus size={14} aria-hidden />
            {t("logicAddGroup")}
          </button>
        )}
      </div>
    </div>
  );
}

/** The rule as a sentence, for example "Shown when Plan is Team and Seats ≥ 5". */
function Summary({ group, fields }: { group: Group; fields: readonly FieldInfo[] }) {
  const t = useTranslations("builder");
  const part = (item: Condition | Group, top: boolean): ReactNode => {
    if (item.kind === "group") {
      const parts = item.items.map((i) => part(i, false)).filter(Boolean);
      if (parts.length === 0) return null;
      const joined = parts.flatMap((p, i) =>
        i === 0 ? [p] : [` ${t(item.mode === "and" ? "logicAnd" : "logicOr")} `, p],
      );
      return top || parts.length === 1 ? <>{joined}</> : <>({joined})</>;
    }
    const field = fields.find((f) => f.key === item.field);
    if (!field) return null;
    const shown =
      field.type === "switch"
        ? t(item.value === true ? "logicOn" : "logicOff")
        : item.value === ""
          ? "“”"
          : (field.options?.find((o) => o.value === item.value)?.label ?? String(item.value));
    const op =
      field.type === "switch"
        ? t("op_eq_switch")
        : t((ORDERED_TYPES.has(field.type) ? `op_${item.op}_date` : `op_${item.op}`) as never);
    return (
      <>
        <b className="font-semibold text-ink">{field.label}</b> {op}
        {!NO_VALUE.has(item.op) && field.type !== "switch" && (
          <>
            {" "}
            <b className="font-semibold text-ink">{shown}</b>
          </>
        )}
        {field.type === "switch" && (
          <>
            {" "}
            <b className="font-semibold text-ink">{shown}</b>
          </>
        )}
      </>
    );
  };
  const text = part(group, true);
  if (!text) return null;
  return text;
}

type Mode = "always" | "never" | "when";

/** One rule: a mode switch and, for "when", the condition tree. */
function Rule({
  title,
  modes,
  mode,
  onMode,
  group,
  fields,
  onGroup,
  sentence,
  json,
}: {
  title: string;
  modes: readonly Mode[];
  mode: Mode;
  onMode: (mode: Mode) => void;
  group: Group | undefined;
  fields: readonly FieldInfo[];
  onGroup: (group: Group) => void;
  sentence: string;
  json: boolean;
}) {
  const t = useTranslations("builder");
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-2.5 border-b border-line pb-3.5 last:border-0"
    >
      <div className="flex items-center justify-between gap-2">
        <h4 id={id} className="text-[13px] font-semibold">
          {title}
        </h4>
        <div
          role="group"
          aria-labelledby={id}
          className="flex rounded-[10px] border border-line bg-surface-2 p-0.5"
        >
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                onMode(m);
              }}
              className="rounded-lg px-2 py-1 text-[12px] font-medium text-ink-2 aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-xs focus-visible:outline-3 focus-visible:outline-primary-soft"
            >
              {t(m === "always" ? "logicAlways" : m === "never" ? "logicNever" : "logicWhen")}
            </button>
          ))}
        </div>
      </div>
      {mode === "when" && json && <p className="text-[12.5px] text-ink-3">{t("logicInJson")}</p>}
      {mode === "when" && group && (
        <>
          <GroupEditor group={group} fields={fields} nested={false} onChange={onGroup} />
          {toExpression(group) !== undefined && (
            <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-2">
              <Eye size={14} aria-hidden className="mt-0.5 shrink-0" />
              <span>
                {sentence} <Summary group={group} fields={fields} />.
              </span>
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Lists the fields a condition of `self` may read, with labels and options. */
function fieldInfos(doc: FormDocument, self: string, locale: Locale): FieldInfo[] {
  const fallback = doc.locales.default;
  return formulaKeys(doc, self)
    .map((key) => findField(doc, key)?.field)
    .filter((f): f is FieldNode => f !== undefined && f.type !== "repeater")
    .map((f) => {
      const raw = f.settings?.options;
      const options =
        Array.isArray(raw) && (ONE_OF_TYPES.has(f.type) || LIST_TYPES.has(f.type))
          ? (raw as { value: string; label?: Parameters<typeof resolveText>[0] }[]).map((o) => ({
              value: o.value,
              label: resolveText(o.label, locale, fallback) || o.value,
            }))
          : undefined;
      return {
        key: f.key,
        label: resolveText(f.label, locale, fallback) || f.key,
        type: f.type,
        ...(options ? { options } : {}),
      };
    });
}

/** The group to show when a rule is switched to "when": the old one, or one condition. */
function startGroup(group: Group | undefined, fields: readonly FieldInfo[]): Group {
  if (group && group.items.length > 0) return group;
  const first = fields[0];
  return {
    kind: "group",
    mode: "and",
    items: first
      ? [
          {
            kind: "condition",
            field: first.key,
            op: comparisonsFor(first.type)[0] ?? "eq",
            value: firstValue(first),
          },
        ]
      : [],
  };
}

/** Keeps a rule's draft tree, so a "when" with no complete condition stays open. */
function useRule(expr: Expression | undefined) {
  const parsed = fromExpression(expr);
  const [draft, setDraft] = useState<Group | null>(null);
  // A draft that no longer matches the document (after undo, for example) is dropped.
  const current =
    draft !== null && JSON.stringify(toExpression(draft)) === JSON.stringify(expr) ? draft : null;
  return {
    group: current ?? parsed,
    json: expr !== undefined && parsed === undefined,
    open: current !== null,
    setDraft,
  };
}

/**
 * Logic of a field: when it is shown, required and read-only. Conditions
 * read fields in the same scope (the same repeater row, or the top level).
 */
export function FieldLogic({
  node,
  doc,
  locale,
  onEdit,
}: {
  node: FieldNode;
  doc: FormDocument;
  locale: Locale;
  onEdit: Edit;
}) {
  const t = useTranslations("builder");
  const fields = fieldInfos(doc, node.key, locale);
  const visible = useRule(node.visibleWhen);
  const required = useRule(node.requiredWhen);
  const readOnly = useRule(node.disabledWhen === true ? undefined : node.disabledWhen);
  const write = (patch: Partial<FieldNode>, name: string) => {
    onEdit((d) => updateNode(d, node.key, patch), `logic:${node.key}:${name}`);
  };
  const start = (rule: ReturnType<typeof useRule>): Expression | undefined => {
    const g = startGroup(rule.group, fields);
    rule.setDraft(g);
    return toExpression(g);
  };
  const sections: ReactNode[] = [];
  const isDisplay = ["heading", "paragraph", "divider", "hidden", "group", "calculated"].includes(
    node.type,
  );

  sections.push(
    <Rule
      key="visible"
      title={t("logicShow")}
      modes={["always", "when"]}
      mode={node.visibleWhen !== undefined || visible.open ? "when" : "always"}
      onMode={(m) => {
        if (m === "when") {
          write({ visibleWhen: start(visible) }, "visible");
          return;
        }
        visible.setDraft(null);
        write({ visibleWhen: undefined }, "visible");
      }}
      group={visible.group}
      fields={fields}
      onGroup={(g) => {
        visible.setDraft(g);
        write({ visibleWhen: toExpression(g) }, "visible");
      }}
      sentence={t("logicShownWhen")}
      json={visible.json}
    />,
  );
  if (!isDisplay) {
    sections.push(
      <Rule
        key="required"
        title={t("required")}
        modes={["never", "always", "when"]}
        mode={
          node.requiredWhen !== undefined || required.open
            ? "when"
            : node.required === true
              ? "always"
              : "never"
        }
        onMode={(m) => {
          if (m === "when") {
            write({ required: undefined, requiredWhen: start(required) }, "required");
            return;
          }
          required.setDraft(null);
          write(
            { required: m === "always" ? true : undefined, requiredWhen: undefined },
            "required",
          );
        }}
        group={required.group}
        fields={fields}
        onGroup={(g) => {
          required.setDraft(g);
          write({ requiredWhen: toExpression(g) }, "required");
        }}
        sentence={t("logicRequiredWhen")}
        json={required.json}
      />,
      <Rule
        key="readOnly"
        title={t("logicReadOnly")}
        modes={["never", "always", "when"]}
        mode={
          node.disabledWhen === true
            ? "always"
            : node.disabledWhen !== undefined || readOnly.open
              ? "when"
              : "never"
        }
        onMode={(m) => {
          if (m === "when") {
            write({ disabledWhen: start(readOnly) }, "readOnly");
            return;
          }
          readOnly.setDraft(null);
          write({ disabledWhen: m === "always" ? true : undefined }, "readOnly");
        }}
        group={readOnly.group}
        fields={fields}
        onGroup={(g) => {
          readOnly.setDraft(g);
          write({ disabledWhen: toExpression(g) }, "readOnly");
        }}
        sentence={t("logicReadOnlyWhen")}
        json={readOnly.json}
      />,
    );
  }
  return (
    <section aria-label={t("logic")} className="flex flex-col gap-3.5 border-t border-line pt-4">
      <h3 className="text-[14px] font-semibold">{t("logic")}</h3>
      {sections}
    </section>
  );
}

/** Applies a patch of logic props to a field. */
function updateNode(doc: FormDocument, key: string, patch: Partial<FieldNode>): FormDocument {
  const edit = (fields: readonly FieldNode[]): FieldNode[] =>
    fields.map((f) => {
      if (f.key === key) {
        const out: Record<string, unknown> = { ...f };
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined) Reflect.deleteProperty(out, k);
          else out[k] = v;
        }
        return out as unknown as FieldNode;
      }
      return f.fields ? { ...f, fields: edit(f.fields) } : f;
    });
  return { ...doc, steps: doc.steps.map((s) => ({ ...s, fields: edit(s.fields) })) };
}

/** Logic of a step: when it is shown. */
export function StepLogic({
  stepKey,
  doc,
  locale,
  onEdit,
}: {
  stepKey: string;
  doc: FormDocument;
  locale: Locale;
  onEdit: Edit;
}) {
  const t = useTranslations("builder");
  const step = doc.steps.find((s) => s.key === stepKey);
  const fields = fieldInfos(doc, "", locale);
  const rule = useRule(step?.visibleWhen);
  if (!step) return null;
  const write = (expr: Expression | undefined) => {
    onEdit(
      (d) => ({
        ...d,
        steps: d.steps.map((s) => {
          if (s.key !== stepKey) return s;
          const next: Record<string, unknown> = { ...s, visibleWhen: expr };
          if (expr === undefined) Reflect.deleteProperty(next, "visibleWhen");
          return next as unknown as typeof s;
        }),
      }),
      `logic:step:${stepKey}`,
    );
  };
  return (
    <section aria-label={t("logic")} className="flex flex-col gap-3.5 border-t border-line pt-4">
      <h3 className="text-[14px] font-semibold">{t("logic")}</h3>
      <Rule
        title={t("logicShowStep")}
        modes={["always", "when"]}
        mode={step.visibleWhen !== undefined || rule.open ? "when" : "always"}
        onMode={(m) => {
          if (m === "when") {
            const g = startGroup(rule.group, fields);
            rule.setDraft(g);
            write(toExpression(g));
            return;
          }
          rule.setDraft(null);
          write(undefined);
        }}
        group={rule.group}
        fields={fields}
        onGroup={(g) => {
          rule.setDraft(g);
          write(toExpression(g));
        }}
        sentence={t("logicShownWhen")}
        json={rule.json}
      />
    </section>
  );
}
