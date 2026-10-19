"use client";

import { useEffect } from "react";
import { duplicateSelected, nudgeField, removeSelected } from "./actions";
import { useBuilderApi } from "./context";

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * Keyboard shortcuts of the builder: undo/redo everywhere, and delete,
 * duplicate and move for the selected field when not typing.
 */
export function useBuilderShortcuts(): void {
  const { store, history } = useBuilderApi();
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // Editors with their own undo (the JSON editor) handle their keys.
      if (e.target instanceof Element && e.target.closest("[data-own-undo]")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        history.redo();
        return;
      }
      if (isTyping(e.target)) return;
      const state = store.getState();
      if (state.selection.kind !== "field") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected(store);
      } else if (mod && key === "d") {
        e.preventDefault();
        duplicateSelected(store);
      } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        nudgeField(store, state.selection.key, e.key === "ArrowUp" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [store, history]);
}
