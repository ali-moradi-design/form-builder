import type { FormDocument } from "@formweave/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBuilder } from "./store";

const doc: FormDocument = {
  schemaVersion: 1,
  id: "f",
  title: "Form",
  locales: { default: "en" },
  steps: [{ key: "one", fields: [] }],
};

const retitle =
  (title: string) =>
  (d: FormDocument): FormDocument => ({ ...d, title });

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("builder store", () => {
  it("undoes and redoes edits", () => {
    const { store, history } = createBuilder(doc, { save: vi.fn() });
    store.getState().edit(retitle("A"));
    store.getState().edit(retitle("B"));
    expect(history.canRedo()).toBe(false);
    history.undo();
    expect(store.getState().doc.title).toBe("A");
    history.undo();
    expect(store.getState().doc).toBe(doc);
    expect(history.canUndo()).toBe(false);
    history.redo();
    expect(store.getState().doc.title).toBe("A");
  });

  it("does not record selection changes", () => {
    const { store, history } = createBuilder(doc, { save: vi.fn() });
    store.getState().select({ kind: "step", key: "one" });
    expect(history.canUndo()).toBe(false);
  });

  it("merges quick edits of one group into one undo step", () => {
    const { store, history } = createBuilder(doc, { save: vi.fn() });
    store.getState().edit(retitle("H"), "title");
    store.getState().edit(retitle("He"), "title");
    store.getState().edit(retitle("Hey"), "title");
    vi.advanceTimersByTime(1500);
    store.getState().edit(retitle("Hey!"), "title");
    history.undo();
    expect(store.getState().doc.title).toBe("Hey");
    history.undo();
    expect(store.getState().doc).toBe(doc);
  });

  it("autosaves valid documents after a pause", () => {
    const save = vi.fn();
    const { store } = createBuilder(doc, { save, delay: 100 });
    store.getState().edit(retitle("A"));
    store.getState().edit(retitle("B"));
    expect(store.getState().saveState).toBe("pending");
    vi.advanceTimersByTime(100);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ title: "B" }));
    expect(store.getState().saveState).toBe("saved");
  });

  it("does not save an invalid document", () => {
    const save = vi.fn();
    const { store } = createBuilder(doc, { save, delay: 100 });
    store.getState().replace({ ...doc, steps: [] });
    vi.advanceTimersByTime(100);
    expect(save).not.toHaveBeenCalled();
    expect(store.getState().saveState).toBe("invalid");
  });

  it("saves pending changes on dispose", () => {
    const save = vi.fn();
    const { store, dispose } = createBuilder(doc, { save });
    store.getState().edit(retitle("A"));
    dispose();
    expect(save).toHaveBeenCalledTimes(1);
  });
});
