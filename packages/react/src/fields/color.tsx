import {
  DEFAULT_SWATCHES,
  normalizeHex,
  type ColorSetSettings,
  type ColorSettings,
} from "@formweave/engine/fields";
import { formatNumber } from "@formweave/engine/i18n";
import { useState, type ReactNode, type Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { controlProps, FieldShell } from "./shell.js";

/** Dark or light text, whichever reads better on `hex`. */
const inkOn = (hex: string): string => {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#141a1c" : "#ffffff";
};

interface EyeDropperApi {
  open: () => Promise<{ sRGBHex: string }>;
}

/** The browser's eyedropper, where it exists (Chromium). */
function eyeDropper(): EyeDropperApi | undefined {
  const Ctor = (globalThis as { EyeDropper?: new () => EyeDropperApi }).EyeDropper;
  return Ctor ? new Ctor() : undefined;
}

function Swatches(p: {
  swatches: readonly string[];
  selected: ReadonlySet<string>;
  disabled: boolean;
  onPick: (hex: string) => void;
}): ReactNode {
  const canDrop = typeof globalThis !== "undefined" && "EyeDropper" in globalThis;
  return (
    <div className="fw-swatches">
      {p.swatches.map((hex) => (
        <button
          key={hex}
          type="button"
          className="fw-swatch"
          style={{ background: hex }}
          aria-label={hex}
          aria-pressed={p.selected.has(hex)}
          disabled={p.disabled}
          onClick={() => {
            p.onPick(hex);
          }}
        />
      ))}
      {canDrop && (
        <button
          type="button"
          className="fw-swatch fw-eyedropper"
          aria-label="Eyedropper"
          disabled={p.disabled}
          onClick={() => {
            void eyeDropper()
              ?.open()
              .then((r) => {
                const hex = normalizeHex(r.sRGBHex);
                if (hex) p.onPick(hex);
              })
              .catch(() => undefined);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m2 22 1-1h3l9-9M3 21v-3l9-9m3-3 3-3 3 3-3 3 1 1-3 3-6-6 3-3z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function ColorInput(p: FieldRendererProps): ReactNode {
  const value = typeof p.value === "string" ? p.value : "";
  const [text, setText] = useState(value);
  const swatches = (p.field.settings as ColorSettings).swatches ?? DEFAULT_SWATCHES;
  const set = (hex: string) => {
    setText(hex);
    p.onChange(hex);
  };
  return (
    <FieldShell props={p}>
      <div className="fw-color" dir="ltr">
        <input
          type="color"
          className="fw-color-native"
          aria-label={p.label}
          value={normalizeHex(value) ?? "#000000"}
          disabled={p.state.disabled}
          onChange={(e) => {
            set(e.target.value);
          }}
        />
        <input
          {...controlProps(p)}
          ref={p.inputRef as Ref<HTMLInputElement>}
          className="fw-input fw-mono"
          type="text"
          spellCheck={false}
          placeholder="#0f4c5c"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            p.onChange(normalizeHex(e.target.value) ?? (e.target.value.trim() || undefined));
          }}
        />
      </div>
      <Swatches
        swatches={swatches}
        selected={new Set([value])}
        disabled={p.state.disabled}
        onPick={set}
      />
    </FieldShell>
  );
}

/**
 * Renderer for `color`: the native picker, a hex text box and swatches.
 *
 * @since 0.6.0
 */
export const colorRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("color", ColorInput);

function ColorSetInput(p: FieldRendererProps): ReactNode {
  const settings = p.field.settings as ColorSetSettings;
  const max = settings.maxColors ?? 5;
  const chosen = Array.isArray(p.value) ? (p.value as string[]) : [];
  // While the native picker is open its colour is added, then replaced as it changes.
  const [picking, setPicking] = useState<string | null>(null);
  const set = (next: string[]) => {
    p.onChange(next.length ? next : undefined);
  };
  const toggle = (hex: string) => {
    if (chosen.includes(hex)) set(chosen.filter((c) => c !== hex));
    else if (chosen.length < max) set([...chosen, hex]);
  };
  return (
    <FieldShell props={p} asFieldset>
      <div className="fw-colorset">
        {chosen.map((hex) => (
          <div
            key={hex}
            className="fw-colorset-item"
            dir="ltr"
            style={{ background: hex, color: inkOn(hex) }}
          >
            <button
              type="button"
              className="fw-colorset-remove"
              aria-label={`× ${hex}`}
              disabled={p.state.disabled}
              onClick={() => {
                set(chosen.filter((c) => c !== hex));
              }}
            >
              ×
            </button>
            <span className="fw-mono">{hex}</span>
          </div>
        ))}
        {(chosen.length < max || picking !== null) && (
          <label className="fw-colorset-add">
            <span aria-hidden="true">+ {formatNumber(chosen.length + 1, p.locale)}</span>
            <input
              id={p.id}
              ref={p.inputRef as Ref<HTMLInputElement>}
              type="color"
              className="fw-visually-hidden"
              aria-label={`${p.label} +`}
              aria-describedby={p.describedBy}
              aria-invalid={p.error !== undefined}
              disabled={p.state.disabled}
              value={picking ?? "#0f4c5c"}
              onBlur={() => {
                setPicking(null);
                p.onBlur();
              }}
              onChange={(e) => {
                const hex = normalizeHex(e.target.value);
                if (!hex) return;
                const rest = chosen.filter((c) => c !== picking && c !== hex);
                set([...rest, hex].slice(0, max));
                setPicking(hex);
              }}
            />
          </label>
        )}
      </div>
      <Swatches
        swatches={settings.swatches ?? DEFAULT_SWATCHES}
        selected={new Set(chosen)}
        disabled={p.state.disabled}
        onPick={toggle}
      />
    </FieldShell>
  );
}

/**
 * Renderer for `colorSet`: the chosen colours as a strip (mockup 06b), an
 * add slot with the native picker, swatches to toggle, and an eyedropper
 * where the browser has one.
 *
 * @since 0.6.0
 */
export const colorSetRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer(
  "colorSet",
  ColorSetInput,
);
