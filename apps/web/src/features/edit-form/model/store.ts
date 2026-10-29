import type { FormDocument } from "@formcanvas/schema";
import { parseFormDocument } from "@formcanvas/schema/meta";
import { temporal } from "zundo";
import { createStore, type StoreApi } from "zustand/vanilla";

/** What the builder has selected: a field, a step, or the form itself. */
export type Selection =
  | { readonly kind: "form" }
  | { readonly kind: "step"; readonly key: string }
  | { readonly kind: "field"; readonly key: string };

/** Autosave state shown in the toolbar. */
export type SaveState = "saved" | "pending" | "invalid";

/** State of one open form in the builder. */
export interface BuilderState {
  readonly doc: FormDocument;
  readonly selection: Selection;
  readonly saveState: SaveState;
  /**
   * Applies an edit. Edits with the same `group` made within a second of each
   * other (typing in one input) become one undo step.
   */
  readonly edit: (fn: (doc: FormDocument) => FormDocument, group?: string) => void;
  /** Replaces the document, for example from the JSON editor. */
  readonly replace: (doc: FormDocument) => void;
  readonly select: (selection: Selection) => void;
}

/** Undo history of the document. */
export interface BuilderHistory {
  readonly undo: () => void;
  readonly redo: () => void;
  readonly canUndo: () => boolean;
  readonly canRedo: () => boolean;
  /** Subscribes to history changes (for enabling the undo/redo buttons). */
  readonly subscribe: (listener: () => void) => () => void;
}

/** A builder store with its history and autosave. */
export interface Builder {
  readonly store: StoreApi<BuilderState>;
  readonly history: BuilderHistory;
  /**
   * Starts autosave. Returns a function that saves any pending change and
   * stops it; calling `start` again restarts it (React effects in strict mode).
   */
  readonly start: () => () => void;
}

/** Options of {@link createBuilder}. */
export interface BuilderOptions {
  /** Persists a valid document. Called at most once per `delay`. */
  readonly save: (doc: FormDocument) => void;
  /** Autosave delay in milliseconds. Default 600. */
  readonly delay?: number;
  /** Most undo steps kept. Default 100. */
  readonly limit?: number;
}

const GROUP_WINDOW = 1000;

/** Creates the state of one builder session. */
export function createBuilder(initial: FormDocument, options: BuilderOptions): Builder {
  const { save, delay = 600, limit = 100 } = options;
  let lastGroup: { name: string; at: number } | undefined;

  const store = createStore<BuilderState>()(
    temporal(
      (set, _get, api) => ({
        doc: initial,
        selection: { kind: "form" },
        saveState: "saved",
        edit: (fn, group) => {
          const doc = fn(api.getState().doc);
          if (doc === api.getState().doc) return;
          const now = Date.now();
          const merge =
            group !== undefined && lastGroup?.name === group && now - lastGroup.at < GROUP_WINDOW;
          lastGroup = group === undefined ? undefined : { name: group, at: now };
          if (merge) store.temporal.getState().pause();
          set({ doc });
          if (merge) store.temporal.getState().resume();
        },
        replace: (doc) => {
          lastGroup = undefined;
          set({ doc });
        },
        select: (selection) => {
          set({ selection });
        },
      }),
      {
        limit,
        partialize: (s) => ({ doc: s.doc }),
        equality: (a, b) => a.doc === b.doc,
      },
    ),
  );

  // Autosave: wait for a quiet moment, and never save an invalid document,
  // because the drafts list drops invalid documents when it reads them.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = (): void => {
    timer = undefined;
    const { doc } = store.getState();
    if (parseFormDocument(doc).success) {
      save(doc);
      store.setState({ saveState: "saved" });
    } else {
      store.setState({ saveState: "invalid" });
    }
  };
  const start = (): (() => void) => {
    const unsubscribe = store.subscribe((state, prev) => {
      if (state.doc === prev.doc) return;
      if (state.saveState !== "pending") store.setState({ saveState: "pending" });
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    });
    const flushNow = (): void => {
      if (timer === undefined) return;
      clearTimeout(timer);
      flush();
    };
    // Leaving or reloading the page must not lose the last edit.
    const hasWindow = typeof window !== "undefined";
    if (hasWindow) window.addEventListener("pagehide", flushNow);
    return () => {
      unsubscribe();
      if (hasWindow) window.removeEventListener("pagehide", flushNow);
      flushNow();
    };
  };
  const temporalApi = store.temporal;
  // An undo or redo ends the current typing group.
  const history: BuilderHistory = {
    undo: () => {
      lastGroup = undefined;
      temporalApi.getState().undo();
    },
    redo: () => {
      lastGroup = undefined;
      temporalApi.getState().redo();
    },
    canUndo: () => temporalApi.getState().pastStates.length > 0,
    canRedo: () => temporalApi.getState().futureStates.length > 0,
    subscribe: (listener) => temporalApi.subscribe(listener),
  };

  return { store, history, start };
}
