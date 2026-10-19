import type { ChoiceOption, ChoiceSettings } from "@formweave/engine/fields";
import { useEffect, useState } from "react";
import type { FieldRendererProps } from "../renderers.js";

const cache = new Map<string, Promise<ChoiceOption[]>>();

// Reads `[{ value, label }]` or `["a", "b"]` from a URL's JSON, once per URL.
function load(url: string): Promise<ChoiceOption[]> {
  let found = cache.get(url);
  if (!found) {
    found = fetch(url, { credentials: "omit" })
      .then((r) =>
        r.ok ? (r.json() as Promise<unknown>) : Promise.reject(new Error(r.statusText)),
      )
      .then((data) =>
        (Array.isArray(data) ? data : [])
          .map((item: unknown): ChoiceOption | undefined => {
            if (typeof item === "string") return { value: item };
            if (item && typeof item === "object") {
              const o = item as { value?: unknown; label?: unknown };
              if (typeof o.value !== "string") return undefined;
              const label =
                typeof o.label === "string" || (o.label !== null && typeof o.label === "object")
                  ? (o.label as ChoiceOption["label"])
                  : undefined;
              return label === undefined ? { value: o.value } : { value: o.value, label };
            }
            return undefined;
          })
          .filter((o): o is ChoiceOption => o !== undefined)
          .slice(0, 5000),
      );
    // A failed load can be tried again later.
    found.catch(() => cache.delete(url));
    cache.set(url, found);
  }
  return found;
}

/**
 * The options a choice renderer shows: the dependent list from the field's
 * state, a list loaded from `optionsUrl`, or the static options. When the
 * list changes and no longer holds the answer, the answer is cleared.
 *
 * @param p - The renderer's props.
 * @returns The options, and whether they are still loading.
 */
export function useChoiceOptions(p: FieldRendererProps): {
  readonly options: readonly ChoiceOption[];
  readonly loading: boolean;
} {
  const settings = p.field.settings as ChoiceSettings;
  const url = settings.optionsUrl;
  const [remote, setRemote] = useState<{ url: string; options: ChoiceOption[] } | null>(null);
  useEffect(() => {
    if (!url) return;
    let live = true;
    load(url).then(
      (options) => {
        if (live) setRemote({ url, options });
      },
      () => {
        if (live) setRemote({ url, options: [] });
      },
    );
    return () => {
      live = false;
    };
  }, [url]);
  const loading = url !== undefined && remote?.url !== url;
  const options = url ? (remote?.options ?? []) : (p.state.options ?? settings.options);

  const { value, onChange } = p;
  useEffect(() => {
    if (loading || value === undefined) return;
    const allowed = new Set(options.map((o) => o.value));
    if (Array.isArray(value)) {
      const kept = value.filter((v) => typeof v === "string" && allowed.has(v));
      if (kept.length !== value.length) onChange(kept.length ? kept : undefined);
    } else if (typeof value === "string" && !allowed.has(value)) {
      onChange(undefined);
    }
  }, [options, loading, value, onChange]);
  return { options, loading };
}
