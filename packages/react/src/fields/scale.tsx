import type { NpsSettings, RatingSettings, SliderSettings } from "@formweave/engine/fields";
import { formatNumber, resolveText } from "@formweave/engine/i18n";
import type { ReactNode, Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { controlProps, FieldShell } from "./shell.js";

/** Radio buttons for whole numbers from `from` to `to`, drawn by `face`. */
function Scale(
  p: FieldRendererProps & {
    from: number;
    to: number;
    kind: "rating" | "nps";
    face: (n: number, checked: boolean) => ReactNode;
    ends?: readonly [string, string];
  },
): ReactNode {
  const value = typeof p.value === "number" ? p.value : undefined;
  const steps = Array.from({ length: p.to - p.from + 1 }, (_, i) => p.from + i);
  return (
    <FieldShell props={p} asFieldset>
      <div className="fw-scale-wrap">
        <div className={`fw-scale fw-${p.kind}`} role="radiogroup">
          {steps.map((n, i) => {
            const id = `${p.id}-${String(n)}`;
            const checked = p.kind === "rating" ? value !== undefined && n <= value : value === n;
            return (
              <label
                key={n}
                className="fw-scale-item"
                htmlFor={id}
                data-checked={checked ? "" : undefined}
              >
                <input
                  id={id}
                  ref={i === 0 ? (p.inputRef as Ref<HTMLInputElement>) : undefined}
                  className="fw-visually-hidden"
                  type="radio"
                  name={p.name}
                  value={n}
                  checked={value === n}
                  disabled={p.state.disabled}
                  aria-invalid={p.error !== undefined}
                  onBlur={p.onBlur}
                  onChange={() => {
                    p.onChange(n);
                  }}
                />
                {p.face(n, checked)}
              </label>
            );
          })}
        </div>
        {p.ends && (p.ends[0] || p.ends[1]) && (
          <div className="fw-scale-ends" aria-hidden="true">
            <span>{p.ends[0]}</span>
            <span>{p.ends[1]}</span>
          </div>
        )}
      </div>
    </FieldShell>
  );
}

/**
 * Renderer for `rating`: a row of stars (radio buttons underneath, so arrow
 * keys work).
 *
 * @since 0.6.0
 */
export const ratingRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("rating", (p) => {
  const max = (p.field.settings as RatingSettings).max ?? 5;
  return (
    <Scale
      {...p}
      kind="rating"
      from={1}
      to={max}
      face={(n) => (
        <>
          <svg className="fw-star" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
          </svg>
          <span className="fw-visually-hidden">
            {formatNumber(n, p.locale)} / {formatNumber(max, p.locale)}
          </span>
        </>
      )}
    />
  );
});

/**
 * Renderer for `nps`: eleven buttons from 0 to 10 with words under the ends.
 *
 * @since 0.6.0
 */
export const npsRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("nps", (p) => {
  const s = p.field.settings as NpsSettings;
  return (
    <Scale
      {...p}
      kind="nps"
      from={0}
      to={10}
      ends={[
        resolveText(s.lowLabel, p.locale, p.fallbackLocale),
        resolveText(s.highLabel, p.locale, p.fallbackLocale),
      ]}
      face={(n) => <span className="fw-scale-num">{formatNumber(n, p.locale)}</span>}
    />
  );
});

/**
 * Renderer for `slider`: a range input with the chosen value next to it.
 *
 * @since 0.6.0
 */
export const sliderRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("slider", (p) => {
  const { min, max, step } = p.field.settings as SliderSettings;
  const value = typeof p.value === "number" ? p.value : undefined;
  return (
    <FieldShell props={p}>
      <div className="fw-slider" dir="ltr">
        <input
          {...controlProps(p)}
          ref={p.inputRef as Ref<HTMLInputElement>}
          className="fw-range"
          type="range"
          min={min}
          max={max}
          step={step ?? 1}
          value={value ?? min}
          data-empty={value === undefined ? "" : undefined}
          onChange={(e) => {
            p.onChange(Number(e.target.value));
          }}
        />
        <output htmlFor={p.id} className="fw-slider-value">
          {value === undefined ? "—" : formatNumber(value, p.locale)}
        </output>
      </div>
    </FieldShell>
  );
});
