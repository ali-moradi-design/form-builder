import type { ResponseFilter } from "@/shared/db";

/** Date ranges offered by the responses page, in days ("all" for none). */
export const DAY_RANGES = ["all", "7", "30", "90"] as const;

/** URL parameters that filter responses. */
export interface FilterQuery {
  readonly version?: string | null | undefined;
  readonly days?: string | null | undefined;
}

/** Reads `version` and `days` from the URL, ignoring values that don't apply. */
export function parseFilter(
  query: FilterQuery,
  versions: readonly number[],
  now = Date.now(),
): { filter: ResponseFilter; days: (typeof DAY_RANGES)[number] } {
  const version = versions.find((v) => String(v) === query.version);
  const days = DAY_RANGES.find((d) => d === query.days) ?? "all";
  return {
    filter: {
      version,
      from: days === "all" ? undefined : new Date(now - Number(days) * 86_400_000),
    },
    days,
  };
}
