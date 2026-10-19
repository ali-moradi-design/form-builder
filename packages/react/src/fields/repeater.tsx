import type { RepeaterSettings } from "@formweave/engine/fields";
import { formatNumber, resolveText } from "@formweave/engine/i18n";
import { defineRenderer, type FieldRenderer } from "../renderers.js";

const WORDS = {
  en: { row: "Row", add: "Add", remove: "Remove", up: "Move up", down: "Move down", of: "of" },
  fa: { row: "ردیف", add: "افزودن", remove: "حذف", up: "بالا بردن", down: "پایین بردن", of: "از" },
} as const;

/**
 * Renderer for `repeater`: one numbered card per row with move and remove
 * buttons, and an add button that shows how many rows there are.
 *
 * @since 0.6.0
 */
export const repeaterRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("repeater", (p) => {
  const rows = p.rows;
  if (!rows) return null;
  const w = p.locale.startsWith("fa") ? WORDS.fa : WORDS.en;
  const settings = p.field.settings as RepeaterSettings;
  const row = resolveText(settings.rowLabel, p.locale, p.fallbackLocale) || w.row;
  const n = (v: number) => formatNumber(v, p.locale);
  const count = rows.keys.length;
  return (
    <fieldset
      className="fw-group"
      data-width={p.field.node.width ?? "full"}
      disabled={p.state.disabled}
      aria-describedby={p.describedBy}
      data-invalid={p.error ? "" : undefined}
    >
      {p.label && (
        <legend className="fw-group-title">
          {p.label}
          {p.state.required && <span className="fw-required"> *</span>}
        </legend>
      )}
      <div id={p.describedBy}>
        {p.help && <p className="fw-help">{p.help}</p>}
        {p.error && (
          <p className="fw-error" role="alert">
            {p.error}
          </p>
        )}
      </div>
      {rows.keys.map((key, i) => {
        const title = `${row} ${n(i + 1)}`;
        return (
          <section key={key} className="fw-row" aria-label={title}>
            <div className="fw-row-head">
              <span className="fw-row-n" aria-hidden>
                {n(i + 1)}
              </span>
              <b>{title}</b>
              <button
                type="button"
                className="fw-row-tool"
                aria-label={`${w.up}: ${title}`}
                disabled={i === 0}
                onClick={() => {
                  rows.move(i, i - 1);
                }}
              >
                ↑
              </button>
              <button
                type="button"
                className="fw-row-tool"
                aria-label={`${w.down}: ${title}`}
                disabled={i === count - 1}
                onClick={() => {
                  rows.move(i, i + 1);
                }}
              >
                ↓
              </button>
              <button
                type="button"
                className="fw-row-tool"
                aria-label={`${w.remove}: ${title}`}
                disabled={!rows.canRemove}
                onClick={() => {
                  rows.remove(i);
                }}
              >
                ×
              </button>
            </div>
            {rows.render(i)}
          </section>
        );
      })}
      <button
        type="button"
        className="fw-row-add"
        disabled={!rows.canAdd}
        onClick={() => {
          rows.add();
        }}
      >
        + {w.add} {row}{" "}
        <span className="fw-help">
          ({n(count)} {w.of} {n(rows.max)})
        </span>
      </button>
    </fieldset>
  );
});
