"use client";

import type { FormDocument } from "@formweave/schema";
import { parseFormDocument } from "@formweave/schema/meta";
import { useSyncExternalStore } from "react";

/** A form saved in this browser. Replaced by the API in version 0.4. */
export interface Draft {
  readonly id: string;
  readonly document: FormDocument;
  readonly updatedAt: string;
}

const KEY = "formweave:drafts";
const listeners = new Set<() => void>();
let cacheRaw: string | null | undefined;
let cache: readonly Draft[] = [];
const EMPTY: readonly Draft[] = [];

function read(): readonly Draft[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    // Stored data may be old or edited by hand: keep only valid documents.
    cache = list.flatMap((item) => {
      const d = item as Partial<Draft> | null;
      if (!d || typeof d.id !== "string" || typeof d.updatedAt !== "string") return [];
      const parsed = parseFormDocument(d.document);
      return parsed.success ? [{ id: d.id, updatedAt: d.updatedAt, document: parsed.data }] : [];
    });
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(drafts: readonly Draft[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(drafts));
  } catch {
    // Storage can be full or blocked; the change then lives only in memory.
  }
  cacheRaw = undefined;
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** All drafts, newest first. Empty during server rendering. */
export function useDrafts(): readonly Draft[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** One draft by id, or `undefined`. */
export function useDraft(id: string): Draft | undefined {
  return useDrafts().find((d) => d.id === id);
}

/** Saves a new draft and returns its id. */
export function createDraft(document: FormDocument): string {
  const id = crypto.randomUUID();
  const draft: Draft = { id, document: { ...document, id }, updatedAt: new Date().toISOString() };
  write([draft, ...read()]);
  return id;
}

/** Replaces the document of a draft. */
export function saveDraft(id: string, document: FormDocument): void {
  write(
    read().map((d) => (d.id === id ? { id, document, updatedAt: new Date().toISOString() } : d)),
  );
}

/** Removes a draft. */
export function deleteDraft(id: string): void {
  write(read().filter((d) => d.id !== id));
}

/** Counts the fields of a document, including nested ones. */
export function countFields(document: FormDocument): number {
  type Node = { readonly fields?: readonly Node[] | undefined };
  const count = (nodes: readonly Node[]): number =>
    nodes.reduce((n, f) => n + 1 + count(f.fields ?? []), 0);
  return document.steps.reduce((n, s) => n + count(s.fields), 0);
}
