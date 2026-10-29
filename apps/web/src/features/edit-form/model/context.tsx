"use client";

import type { FormDocument } from "@formcanvas/schema";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createBuilder, type Builder, type BuilderState } from "./store";

const Ctx = createContext<Builder | null>(null);

/** Opens one form in the builder; children read it with {@link useBuilder}. */
export function BuilderProvider({
  initial,
  save,
  children,
}: {
  initial: FormDocument;
  save: (doc: FormDocument) => void;
  children: ReactNode;
}) {
  // One builder per mount; the initial document is read once.
  const [builder] = useState(() => createBuilder(initial, { save }));
  useEffect(() => builder.start(), [builder]);
  return <Ctx.Provider value={builder}>{children}</Ctx.Provider>;
}

/** The store and history of the open form. */
export function useBuilderApi(): Builder {
  const builder = useContext(Ctx);
  if (!builder) throw new Error("useBuilder must be used inside <BuilderProvider>.");
  return builder;
}

/** Reads part of the builder state and re-renders when it changes. */
export function useBuilder<T>(selector: (state: BuilderState) => T): T {
  return useStore(useBuilderApi().store, selector);
}

/** Whether undo and redo are possible right now. */
export function useHistoryState(): { canUndo: boolean; canRedo: boolean } {
  const { history } = useBuilderApi();
  const canUndo = useSyncExternalStore(history.subscribe, history.canUndo, () => false);
  const canRedo = useSyncExternalStore(history.subscribe, history.canRedo, () => false);
  return { canUndo, canRedo };
}
