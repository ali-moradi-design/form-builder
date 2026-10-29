import type { DateSettings, SliderSettings } from "@formcanvas/engine/fields";
import { formatNumber } from "@formcanvas/engine/i18n";
import type { ReactNode, Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { controlProps, FieldShell } from "./shell.js";

const ENDS: Readonly<Record<string, readonly [string, string]>> = {
  en: ["From", "To"],
  fa: ["از", "تا"],
};

/** Names for the two ends in the reader's language. */
const endNames = (locale: string): readonly [string, string] =>
  ENDS[locale.split("-")[0] ?? ""] ?? ["From", "To"];

type Ends<T> = { from?: T | undefined; to?: T | undefined };

const readRange = <T,>(value: unknown, is: (v: unknown) => v is T): Ends<T> => {
  if (value === null || typeof value !== "object") return {};
  const r = value as Record<string, unknown>;
  return { from: is(r.from) ? r.from : undefined, to: is(r.to) ? r.to : undefined };
};

/** Drops empty ends; the whole value is `undefined` when both are empty. */
const writeRange = <T,>(r: Ends<T>): Ends<T> | undefined => {
  const out: Ends<T> = {};
  if (r.from !== undefined) out.from = r.from;
  if (r.to !== undefined) out.to = r.to;
  return out.from === undefined && out.to === undefined ? undefined : out;
};

const isString = (v: unknown): v is string => typeof v === "string" && v !== "";
const isNumber = (v: unknown): v is number => typeof v === "number";

/**
 * Renderer for `dateRange`: two date inputs side by side. The first one is
 * named by the field's label; each also says which end it is.
 *
 * @since 0.6.0
 */
export const dateRangeRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("dateRange", (p) => {
  const { min, max } = p.field.settings as DateSettings;
  const value = readRange(p.value, isString);
  const [fromName, toName] = endNames(p.locale);
  const shared = controlProps(p);
  return (
    <FieldShell props={p}>
      <div className="fc-slider">
        <input
          {...shared}
          ref={p.inputRef as Ref<HTMLInputElement>}
          className="fc-input"
          type="date"
          aria-label={`${p.label}: ${fromName}`}
          min={min}
          max={value.to ?? max}
          value={value.from ?? ""}
          onChange={(e) => {
            p.onChange(writeRange({ ...value, from: e.target.value || undefined }));
          }}
        />
        <input
          {...shared}
          id={`${p.id}-to`}
          className="fc-input"
          type="date"
          aria-label={`${p.label}: ${toName}`}
          min={value.from ?? min}
          max={max}
          value={value.to ?? ""}
          onChange={(e) => {
            p.onChange(writeRange({ ...value, to: e.target.value || undefined }));
          }}
        />
      </div>
    </FieldShell>
  );
});

function RangeSlider(p: FieldRendererProps): ReactNode {
  const { min, max, step } = p.field.settings as SliderSettings;
  const value = readRange(p.value, isNumber);
  const names = endNames(p.locale);
  const shared = controlProps(p);
  const ends = ["from", "to"] as const;
  return (
    <FieldShell props={p}>
      {ends.map((end, i) => {
        const current = value[end];
        return (
          <div key={end} className="fc-slider" dir="ltr">
            <input
              {...shared}
              id={i === 0 ? p.id : `${p.id}-to`}
              ref={i === 0 ? (p.inputRef as Ref<HTMLInputElement>) : undefined}
              className="fc-range"
              type="range"
              aria-label={`${p.label}: ${names[i] ?? end}`}
              min={min}
              max={max}
              step={step ?? 1}
              value={current ?? (i === 0 ? min : max)}
              onChange={(e) => {
                const n = Number(e.target.value);
                // The handles cannot cross: each one stops at the other.
                const next =
                  end === "from"
                    ? { from: Math.min(n, value.to ?? max), to: value.to ?? max }
                    : { from: value.from ?? min, to: Math.max(n, value.from ?? min) };
                p.onChange(next);
              }}
            />
            <output htmlFor={i === 0 ? p.id : `${p.id}-to`} className="fc-slider-value">
              {current === undefined ? "—" : formatNumber(current, p.locale)}
            </output>
          </div>
        );
      })}
    </FieldShell>
  );
}

/**
 * Renderer for `rangeSlider`: one track for each end; the handles cannot
 * cross. Moving either one fills in both ends.
 *
 * @since 0.6.0
 */
export const rangeSliderRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer(
  "rangeSlider",
  RangeSlider,
);
