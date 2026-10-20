import type { ChoiceOption } from "@formweave/engine/fields";
import { resolveText } from "@formweave/engine/i18n";
import type { ReactNode, Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { choiceList, choiceText, useChoiceOptions } from "./options.js";
import { controlProps, FieldShell } from "./shell.js";

const optionLabel = (o: ChoiceOption, p: FieldRendererProps): string =>
  resolveText(o.label, p.locale, p.fallbackLocale) || o.value;

/**
 * Renderer for `select`: a native drop-down list.
 *
 * @since 0.2.0
 */
export const selectRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("select", Select);

function Select(p: FieldRendererProps): ReactNode {
  const { options, loading } = useChoiceOptions(p);
  const value = choiceText(p.value);
  return (
    <FieldShell props={p}>
      <select
        {...controlProps(p)}
        ref={p.inputRef as Ref<HTMLSelectElement>}
        className="fw-input fw-select"
        aria-busy={loading}
        value={value}
        onChange={(e) => {
          p.onChange(e.target.value || undefined);
        }}
      >
        {/* The empty choice only while it is a valid answer or nothing is chosen. */}
        {(!p.state.required || !value) && <option value="">{p.placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {optionLabel(o, p)}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function Choices(p: FieldRendererProps & { multiple: boolean }): ReactNode {
  const { options } = useChoiceOptions(p);
  const selected = p.multiple
    ? new Set(choiceList(p.value))
    : new Set([choiceText(p.value)].filter(Boolean));
  return (
    <FieldShell props={p} asFieldset>
      <div className="fw-choices" role={p.multiple ? "group" : "radiogroup"}>
        {options.map((o, i) => {
          const id = `${p.id}-${String(i)}`;
          return (
            <label key={o.value} className="fw-choice" htmlFor={id}>
              <input
                id={id}
                ref={i === 0 ? (p.inputRef as Ref<HTMLInputElement>) : undefined}
                type={p.multiple ? "checkbox" : "radio"}
                name={p.name}
                value={o.value}
                checked={selected.has(o.value)}
                disabled={p.state.disabled}
                aria-invalid={p.error !== undefined}
                onBlur={p.onBlur}
                onChange={(e) => {
                  if (!p.multiple) {
                    p.onChange(o.value);
                    return;
                  }
                  const next = new Set(selected);
                  if (e.target.checked) next.add(o.value);
                  else next.delete(o.value);
                  p.onChange(options.map((x) => x.value).filter((v) => next.has(v)));
                }}
              />
              <span>{optionLabel(o, p)}</span>
            </label>
          );
        })}
      </div>
    </FieldShell>
  );
}

/**
 * Renderer for `radio`: visible choices with one answer.
 *
 * @since 0.2.0
 */
export const radioRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("radio", (p) => (
  <Choices {...p} multiple={false} />
));

/**
 * Renderer for `checkboxes`: visible choices with several answers, kept in
 * option order.
 *
 * @since 0.2.0
 */
export const checkboxesRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("checkboxes", (p) => (
  <Choices {...p} multiple />
));
