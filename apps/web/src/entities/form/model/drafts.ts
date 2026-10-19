"use client";

import type { FormDocument } from "@formweave/schema";
import { parseFormDocument } from "@formweave/schema/meta";

// Before version 0.4, drafts lived in localStorage. These helpers let the
// forms list offer to import them into the account.

const KEY = "formweave:drafts";

/** Valid drafts left in this browser by version 0.3. */
export function readLocalDrafts(): FormDocument[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown[];
    return list.flatMap((item) => {
      const parsed = parseFormDocument((item as { document?: unknown } | null)?.document);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}

/** Forgets the drafts kept in this browser. */
export function clearLocalDrafts(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Storage can be blocked; nothing to clear then.
  }
}
