import type { AddressPart, AddressSettings } from "@formweave/engine/fields";
import type { ReactNode, Ref } from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { FieldShell } from "./shell.js";

type Key = "line1" | AddressPart;

const LABELS: Readonly<Record<"en" | "fa", Readonly<Record<Key, string>>>> = {
  en: {
    line1: "Street and number",
    line2: "Flat, floor (optional)",
    city: "City",
    region: "State or province",
    postalCode: "Postal code",
    country: "Country",
  },
  fa: {
    line1: "نشانی",
    line2: "واحد، طبقه (اختیاری)",
    city: "شهر",
    region: "استان",
    postalCode: "کد پستی",
    country: "کشور",
  },
};

const AUTOCOMPLETE: Readonly<Record<Key, string>> = {
  line1: "address-line1",
  line2: "address-line2",
  city: "address-level2",
  region: "address-level1",
  postalCode: "postal-code",
  country: "country-name",
};

const ALL: readonly AddressPart[] = ["line2", "city", "region", "postalCode", "country"];

function Address(p: FieldRendererProps): ReactNode {
  const settings = p.field.settings as AddressSettings;
  const parts = settings.parts ?? ALL;
  const words = p.locale.startsWith("fa") ? LABELS.fa : LABELS.en;
  const value = (p.value !== null && typeof p.value === "object" ? p.value : {}) as Partial<
    Record<Key, string>
  >;
  const keys: Key[] = ["line1", ...ALL.filter((k) => parts.includes(k))];
  const set = (k: Key, text: string) => {
    const next: Partial<Record<Key, string>> = { ...value, [k]: text };
    if (!text) Reflect.deleteProperty(next, k);
    p.onChange(Object.keys(next).length ? next : undefined);
  };
  return (
    <FieldShell props={p} asFieldset>
      <div className="fw-address">
        {keys.map((k) => {
          const id = `${p.id}-${k}`;
          return (
            <div key={k} className="fw-address-part" data-part={k}>
              <label htmlFor={id} className="fw-help">
                {words[k]}
              </label>
              <input
                id={id}
                ref={k === "line1" ? (p.inputRef as Ref<HTMLInputElement>) : undefined}
                className="fw-input"
                autoComplete={AUTOCOMPLETE[k]}
                dir={k === "postalCode" ? "ltr" : undefined}
                value={value[k] ?? ""}
                disabled={p.state.disabled}
                aria-invalid={p.error !== undefined}
                aria-describedby={p.describedBy}
                onBlur={p.onBlur}
                onChange={(e) => {
                  set(k, e.target.value);
                }}
              />
            </div>
          );
        })}
      </div>
    </FieldShell>
  );
}

/**
 * Renderer for `address`: one box per part, with the browser's address
 * autofill names, in a two-column grid on wide screens.
 *
 * @since 0.6.0
 */
export const addressRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("address", Address);
