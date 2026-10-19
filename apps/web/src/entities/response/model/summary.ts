import { COLOR_TYPES, NUMBER_TYPES } from "@/shared/config";
import type { ResponseColumn } from "./columns";

/** Count of one option or value. */
export interface Bucket {
  readonly label: string;
  readonly count: number;
}

/** Summary of one answer column, by what kind of answers it holds. */
export type FieldSummary =
  | {
      readonly kind: "choice";
      readonly key: string;
      readonly label: string;
      readonly answered: number;
      /** True when one person can pick several (percentages are of people). */
      readonly multiple: boolean;
      /** True when the labels are colours (`#rrggbb`), drawn as swatches. */
      readonly colors?: boolean;
      readonly buckets: readonly Bucket[];
    }
  | {
      readonly kind: "number";
      readonly key: string;
      readonly label: string;
      readonly answered: number;
      readonly min: number;
      readonly max: number;
      readonly mean: number;
      readonly median: number;
      readonly histogram: readonly Bucket[];
    }
  | {
      readonly kind: "text";
      readonly key: string;
      readonly label: string;
      readonly answered: number;
      /** Up to five recent answers, newest first. */
      readonly latest: readonly string[];
    };

const CHOICE = new Set(["select", "radio", "checkboxes"]);

const answered = (v: unknown): boolean =>
  v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);

function histogram(
  values: readonly number[],
  min: number,
  max: number,
  integer: boolean,
): Bucket[] {
  if (min === max) return [{ label: String(min), count: values.length }];
  // Whole numbers get whole-number bins (1, 2, 3… or 1–5, 6–10…); others get 8 equal bins.
  const width = integer ? Math.ceil((max - min + 1) / 8) : (max - min) / 8;
  const bins = integer ? Math.ceil((max - min + 1) / width) : 8;
  const counts = Array.from({ length: bins }, () => 0);
  for (const v of values) {
    const i = Math.min(bins - 1, Math.floor((v - min) / width));
    counts[i] = (counts[i] ?? 0) + 1;
  }
  const round = (n: number) => String(Math.round(n * 10) / 10);
  return counts.map((count, i) => {
    const low = min + i * width;
    if (integer)
      return {
        label: width === 1 ? String(low) : `${String(low)}–${String(low + width - 1)}`,
        count,
      };
    return { label: `${round(low)}–${round(low + width)}`, count };
  });
}

/**
 * Summarises answers per column. `rows` are response data, newest first.
 * Choice options keep the form's order; values no longer in the form are
 * added after them.
 */
export function summarize(
  columns: readonly ResponseColumn[],
  rows: readonly Readonly<Record<string, unknown>>[],
  yesNo: readonly [string, string] = ["Yes", "No"],
): FieldSummary[] {
  return columns.map((c): FieldSummary => {
    const values = rows.map((r) => r[c.key]).filter(answered);
    if (c.type === "switch" || (values.length > 0 && values.every((v) => typeof v === "boolean"))) {
      // A switch left off is not stored, so every response without "yes" counts as "no".
      const yes = values.filter((v) => v === true).length;
      const total = c.type === "switch" ? rows.length : values.length;
      return {
        kind: "choice",
        key: c.key,
        label: c.label,
        answered: total,
        multiple: false,
        buckets: [
          { label: yesNo[0], count: yes },
          { label: yesNo[1], count: total - yes },
        ],
      };
    }
    if (COLOR_TYPES.has(c.type)) {
      const counts = new Map<string, number>();
      for (const v of values) {
        for (const item of Array.isArray(v) ? v : [v]) {
          if (typeof item === "string") counts.set(item, (counts.get(item) ?? 0) + 1);
        }
      }
      return {
        kind: "choice",
        key: c.key,
        label: c.label,
        answered: values.length,
        multiple: c.type === "colorSet",
        colors: true,
        buckets: [...counts]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([label, count]) => ({ label, count })),
      };
    }
    if (CHOICE.has(c.type)) {
      const counts = new Map<string, number>([...(c.options?.keys() ?? [])].map((k) => [k, 0]));
      for (const v of values) {
        for (const item of Array.isArray(v) ? v : [v]) {
          const k = String(item);
          counts.set(k, (counts.get(k) ?? 0) + 1);
        }
      }
      return {
        kind: "choice",
        key: c.key,
        label: c.label,
        answered: values.length,
        multiple: c.type === "checkboxes",
        buckets: [...counts].map(([k, count]) => ({ label: c.options?.get(k) ?? k, count })),
      };
    }
    const numbers = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (NUMBER_TYPES.has(c.type) && numbers.length > 0) {
      const sorted = [...numbers].sort((a, b) => a - b);
      const min = sorted[0] ?? 0;
      const max = sorted[sorted.length - 1] ?? 0;
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
      return {
        kind: "number",
        key: c.key,
        label: c.label,
        answered: numbers.length,
        min,
        max,
        mean: numbers.reduce((a, b) => a + b, 0) / numbers.length,
        median,
        histogram: histogram(numbers, min, max, numbers.every(Number.isInteger)),
      };
    }
    return {
      kind: "text",
      key: c.key,
      label: c.label,
      answered: values.length,
      latest: values.slice(0, 5).map((v) => (typeof v === "string" ? v : JSON.stringify(v))),
    };
  });
}

/** Responses per day for the last `days` days, oldest first (UTC dates). */
export function perDay(dates: readonly Date[], days: number, now = new Date()): Bucket[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = end - (days - 1) * 86_400_000;
  const counts = Array.from({ length: days }, () => 0);
  for (const d of dates) {
    const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const i = Math.round((day - start) / 86_400_000);
    if (i >= 0 && i < days) counts[i] = (counts[i] ?? 0) + 1;
  }
  return counts.map((count, i) => ({
    label: new Date(start + i * 86_400_000).toISOString().slice(0, 10),
    count,
  }));
}
