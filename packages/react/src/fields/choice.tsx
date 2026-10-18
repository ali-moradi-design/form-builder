import type { ChoiceOption } from "@formweave/engine/fields";
import { resolveText } from "@formweave/engine/i18n";
import type { ReactNode, Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { controlProps, FieldShell } from "./shell.js";

const optionsOf = (p: FieldRendererProps): readonly ChoiceOption[] =>
  (p.field.settings as { options: readonly ChoiceOption[] }).options;

const optionLabel = (o: ChoiceOption, p: FieldRendererProps): string =>
  resolveText(o.label, p.locale, p.fallbackLocale) || o.value;

/**
 * Renderer for `select`: a native drop-down list.
 *
 * @since 0.2.0
 */
export const selectRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("select", (p) => (
  <FieldShell props={p}>
    <select
      {...controlProps(p)}
      ref={p.inputRef as Ref<HTMLSelectElement>}
      className="fw-input fw-select"
      value={typeof p.value === "string" ? p.value : ""}
      onChange={(e) => {
        p.onChange(e.target.value || undefined);
      }}
    >
      <option value="">{p.placeholder}</option>
      {optionsOf(p).map((o) => (
        <option key={o.value} value={o.value}>
          {optionLabel(o, p)}
        </option>
      ))}
    </select>
  </FieldShell>
));

function Choices(p: FieldRendererProps & { multiple: boolean }): ReactNode {
  const selected = p.multiple
    ? new Set(Array.isArray(p.value) ? (p.value as string[]) : [])
    : new Set(typeof p.value === "string" ? [p.value] : []);
  return (
    <FieldShell props={p} asFieldset>
      <div className="fw-choices" role={p.multiple ? "group" : "radiogroup"}>
        {optionsOf(p).map((o, i) => {
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
                  p.onChange(
                    optionsOf(p)
                      .map((x) => x.value)
                      .filter((v) => next.has(v)),
                  );
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
