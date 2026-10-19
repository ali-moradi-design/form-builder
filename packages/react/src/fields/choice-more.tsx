import type {
  ChoiceOption,
  ImageChoiceSettings,
  MatrixSettings,
  TagsSettings,
} from "@formweave/engine/fields";
import { formatNumber, normalizeDigits, resolveText } from "@formweave/engine/i18n";
import { useId, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { useChoiceOptions } from "./options.js";
import { controlProps, FieldShell } from "./shell.js";

const WORDS = {
  en: {
    none: "No matches",
    remove: "Remove",
    up: "Move up",
    down: "Move down",
    keep: "Use this order",
    found: "{n} of {total}",
  },
  fa: {
    none: "موردی پیدا نشد",
    remove: "حذف",
    up: "بالا بردن",
    down: "پایین بردن",
    keep: "همین ترتیب خوب است",
    found: "{n} از {total}",
  },
} as const;

const words = (locale: string) => (locale.startsWith("fa") ? WORDS.fa : WORDS.en);

const optionsOf = (p: FieldRendererProps): readonly ChoiceOption[] =>
  (p.field.settings as { options: readonly ChoiceOption[] }).options;

const labelOf = (o: ChoiceOption, p: FieldRendererProps): string =>
  resolveText(o.label, p.locale, p.fallbackLocale) || o.value;

const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/** Lower-case text with Persian/Arabic digits and letters folded, for search. */
const fold = (s: string): string =>
  normalizeDigits(s).toLowerCase().replaceAll("ي", "ی").replaceAll("ك", "ک");

/** A text box that filters a list of options; one or several answers. */
function Combo(p: FieldRendererProps & { multiple: boolean }): ReactNode {
  const w = words(p.locale);
  const listId = useId();
  const { options: all } = useChoiceOptions(p);
  const chosen = p.multiple ? asList(p.value) : typeof p.value === "string" ? [p.value] : [];
  const current = all.find((o) => o.value === chosen[0]);
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const text = query ?? (p.multiple || !current ? "" : labelOf(current, p));
  const matches = all.filter((o) => fold(labelOf(o, p)).includes(fold(query ?? "")));
  const shown = matches.slice(0, 50);
  const pick = (o: ChoiceOption) => {
    if (p.multiple) {
      p.onChange(
        chosen.includes(o.value) ? chosen.filter((v) => v !== o.value) : [...chosen, o.value],
      );
      setQuery("");
    } else {
      p.onChange(o.value);
      setQuery(null);
      setOpen(false);
    }
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (shown.length ? (a + step + shown.length) % shown.length : 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      const o = shown[active];
      if (o) pick(o);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(null);
    } else if (e.key === "Backspace" && p.multiple && text === "" && chosen.length) {
      p.onChange(chosen.slice(0, -1));
    }
  };
  const optionId = (i: number) => `${listId}-${String(i)}`;
  return (
    <FieldShell props={p}>
      <div className="fw-combo">
        {p.multiple && chosen.length > 0 && (
          <div className="fw-tags">
            {chosen.map((v) => {
              const o = all.find((x) => x.value === v);
              const label = o ? labelOf(o, p) : v;
              return (
                <span key={v} className="fw-tag">
                  {label}
                  <button
                    type="button"
                    aria-label={`${w.remove}: ${label}`}
                    disabled={p.state.disabled}
                    onClick={() => {
                      p.onChange(chosen.filter((x) => x !== v));
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <input
          {...controlProps(p)}
          ref={p.inputRef as Ref<HTMLInputElement>}
          className="fw-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? optionId(active) : undefined}
          autoComplete="off"
          placeholder={p.placeholder || undefined}
          value={text}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
            setQuery(null);
            p.onBlur();
          }}
          onKeyDown={onKey}
        />
        {open && (
          <div className="fw-listbox" id={listId} role="listbox" aria-multiselectable={p.multiple}>
            {shown.map((o, i) => (
              <div
                key={o.value}
                id={optionId(i)}
                role="option"
                aria-selected={chosen.includes(o.value)}
                data-active={i === active ? "" : undefined}
                onMouseDown={(e) => {
                  // Keep focus in the box.
                  e.preventDefault();
                  pick(o);
                }}
              >
                {labelOf(o, p)}
              </div>
            ))}
            <p className="fw-help" aria-live="polite">
              {shown.length === 0
                ? w.none
                : w.found
                    .replace("{n}", formatNumber(matches.length, p.locale))
                    .replace("{total}", formatNumber(all.length, p.locale))}
            </p>
          </div>
        )}
      </div>
    </FieldShell>
  );
}

/**
 * Renderer for `combobox`: a text box that filters a long list; one answer.
 * Arrow keys move, Enter picks, Escape closes.
 *
 * @since 0.6.0
 */
export const comboboxRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("combobox", (p) => (
  <Combo {...p} multiple={false} />
));

/**
 * Renderer for `multiSelect`: a filtering text box with the chosen answers as
 * removable chips above it. Backspace in the empty box removes the last one.
 *
 * @since 0.6.0
 */
export const multiSelectRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer(
  "multiSelect",
  (p) => <Combo {...p} multiple />,
);

function Tags(p: FieldRendererProps): ReactNode {
  const w = words(p.locale);
  const listId = useId();
  const settings = p.field.settings as TagsSettings;
  const chosen = asList(p.value);
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const tag = raw.trim().slice(0, settings.maxLength ?? 40);
    setText("");
    if (!tag || chosen.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    if (chosen.length >= (settings.maxTags ?? 20)) return;
    p.onChange([...chosen, tag]);
  };
  return (
    <FieldShell props={p}>
      <div className="fw-tags fw-input">
        {chosen.map((t) => (
          <span key={t} className="fw-tag">
            {t}
            <button
              type="button"
              aria-label={`${w.remove}: ${t}`}
              disabled={p.state.disabled}
              onClick={() => {
                p.onChange(chosen.filter((x) => x !== t));
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          {...controlProps(p)}
          ref={p.inputRef as Ref<HTMLInputElement>}
          list={settings.suggestions?.length ? listId : undefined}
          placeholder={p.placeholder || undefined}
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            // A comma also ends a tag (Latin or Persian).
            if (/[,،]/.test(v)) add(v.replace(/[,،]/g, ""));
            else setText(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && text === "" && chosen.length) {
              p.onChange(chosen.slice(0, -1));
            }
          }}
          onBlur={() => {
            add(text);
            p.onBlur();
          }}
        />
        {settings.suggestions?.length ? (
          <datalist id={listId}>
            {settings.suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        ) : null}
      </div>
    </FieldShell>
  );
}

/**
 * Renderer for `tags`: chips with a text box; Enter or a comma adds a tag and
 * Backspace in the empty box removes the last one. Suggestions come from a
 * `<datalist>`.
 *
 * @since 0.6.0
 */
export const tagsRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("tags", Tags);

function Ranking(p: FieldRendererProps): ReactNode {
  const w = words(p.locale);
  const all = optionsOf(p);
  const saved = asList(p.value);
  const order = saved.length === all.length ? saved : all.map((o) => o.value);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    p.onChange(next);
  };
  return (
    <FieldShell props={p} asFieldset>
      <ol className="fw-rank">
        {order.map((v, i) => {
          const o = all.find((x) => x.value === v);
          const label = o ? labelOf(o, p) : v;
          return (
            <li key={v}>
              <span className="fw-row-n" aria-hidden>
                {formatNumber(i + 1, p.locale)}
              </span>
              <span className="fw-rank-label">{label}</span>
              <button
                type="button"
                className="fw-row-tool"
                ref={i === 0 ? (p.inputRef as Ref<HTMLButtonElement>) : undefined}
                aria-label={`${w.up}: ${label}`}
                disabled={p.state.disabled || i === 0}
                onClick={() => {
                  move(i, i - 1);
                }}
              >
                ↑
              </button>
              <button
                type="button"
                className="fw-row-tool"
                aria-label={`${w.down}: ${label}`}
                disabled={p.state.disabled || i === order.length - 1}
                onClick={() => {
                  move(i, i + 1);
                }}
              >
                ↓
              </button>
            </li>
          );
        })}
      </ol>
      {saved.length !== all.length && (
        <button
          type="button"
          className="fw-button"
          disabled={p.state.disabled}
          onClick={() => {
            p.onChange(order);
          }}
        >
          {w.keep}
        </button>
      )}
    </FieldShell>
  );
}

/**
 * Renderer for `ranking`: the options as a numbered list with move buttons.
 * Until the person moves an item or keeps the order, there is no answer.
 *
 * @since 0.6.0
 */
export const rankingRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("ranking", Ranking);

function ImageChoice(p: FieldRendererProps): ReactNode {
  const settings = p.field.settings as ImageChoiceSettings;
  const multiple = settings.multiple === true;
  const chosen = multiple ? asList(p.value) : typeof p.value === "string" ? [p.value] : [];
  return (
    <FieldShell props={p} asFieldset>
      <div className="fw-pictures" role={multiple ? "group" : "radiogroup"}>
        {settings.options.map((o, i) => {
          const label = resolveText(o.label, p.locale, p.fallbackLocale) || o.value;
          const alt = resolveText(o.alt, p.locale, p.fallbackLocale);
          return (
            <label key={o.value} className="fw-picture">
              <img src={o.image} alt={alt} loading="lazy" />
              <span className="fw-choice">
                <input
                  ref={i === 0 ? (p.inputRef as Ref<HTMLInputElement>) : undefined}
                  type={multiple ? "checkbox" : "radio"}
                  name={p.name}
                  value={o.value}
                  checked={chosen.includes(o.value)}
                  disabled={p.state.disabled}
                  aria-invalid={p.error !== undefined}
                  onBlur={p.onBlur}
                  onChange={(e) => {
                    if (!multiple) p.onChange(o.value);
                    else if (e.target.checked) p.onChange([...chosen, o.value]);
                    else p.onChange(chosen.filter((v) => v !== o.value));
                  }}
                />
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </FieldShell>
  );
}

/**
 * Renderer for `imageChoice`: pictures with a radio button or checkbox under
 * each. Images load lazily; `alt` text comes from the option.
 *
 * @since 0.6.0
 */
export const imageChoiceRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer(
  "imageChoice",
  ImageChoice,
);

function Matrix(p: FieldRendererProps): ReactNode {
  const { rows, columns } = p.field.settings as MatrixSettings;
  const value =
    p.value !== null && typeof p.value === "object" ? (p.value as Record<string, string>) : {};
  const col = (c: ChoiceOption) => resolveText(c.label, p.locale, p.fallbackLocale) || c.value;
  return (
    <FieldShell props={p} asFieldset>
      <div className="fw-matrix-wrap">
        <table className="fw-matrix">
          <thead>
            <tr>
              <td />
              {columns.map((c) => (
                <th key={c.value} scope="col">
                  {col(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => {
              const rowLabel = resolveText(r.label, p.locale, p.fallbackLocale) || r.value;
              return (
                <tr key={r.value}>
                  <th scope="row">{rowLabel}</th>
                  {columns.map((c, ci) => (
                    <td key={c.value}>
                      <input
                        ref={
                          ri === 0 && ci === 0 ? (p.inputRef as Ref<HTMLInputElement>) : undefined
                        }
                        type="radio"
                        name={`${p.name}.${r.value}`}
                        aria-label={`${rowLabel}: ${col(c)}`}
                        checked={value[r.value] === c.value}
                        disabled={p.state.disabled}
                        aria-invalid={p.error !== undefined && value[r.value] === undefined}
                        onBlur={p.onBlur}
                        onChange={() => {
                          p.onChange({ ...value, [r.value]: c.value });
                        }}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </FieldShell>
  );
}

/**
 * Renderer for `matrix`: a table with one radio group per row. Each radio
 * is named by its row and column for screen readers; wide tables scroll.
 *
 * @since 0.6.0
 */
export const matrixRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("matrix", Matrix);
