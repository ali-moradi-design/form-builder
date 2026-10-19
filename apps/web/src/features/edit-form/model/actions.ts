import type { FormDocument } from "@formweave/schema";
import {
  duplicateField,
  findField,
  insertField,
  moveField,
  removeField,
  uniqueKey,
  type FieldPlace,
} from "@/entities/form";
import type { FieldTypeInfo } from "@/shared/config";
import type { StoreApi } from "zustand/vanilla";
import type { BuilderState, Selection } from "./store";

type Store = StoreApi<BuilderState>;

/** Where a new field goes: after the selected field, into the selected group or step, or at the end. */
export function placeForNew(doc: FormDocument, selection: Selection): FieldPlace {
  if (selection.kind === "field") {
    const found = findField(doc, selection.key);
    if (found?.field.type === "group") {
      return {
        step: found.place.step,
        parent: found.field.key,
        index: found.field.fields?.length ?? 0,
      };
    }
    if (found) return { ...found.place, index: found.place.index + 1 };
  }
  const step =
    (selection.kind === "step" && doc.steps.find((s) => s.key === selection.key)) ||
    doc.steps[doc.steps.length - 1];
  return { step: step?.key ?? "", index: step?.fields.length ?? 0 };
}

/** Adds a field of `info`'s type and selects it. */
export function addField(store: Store, info: FieldTypeInfo, label: string): void {
  const state = store.getState();
  let key = "";
  state.edit((doc) => {
    key = uniqueKey(doc, info.keyBase);
    return insertField(doc, info.create(key, label), placeForNew(doc, state.selection));
  });
  state.select({ kind: "field", key });
}

/** Removes the selected field and selects its neighbour, if any. */
export function removeSelected(store: Store): void {
  const state = store.getState();
  const { selection, doc } = state;
  if (selection.kind !== "field") return;
  const found = findField(doc, selection.key);
  if (!found) return;
  state.edit((d) => removeField(d, selection.key));
  const siblings = listAt(store.getState().doc, found.place);
  const next = siblings[Math.min(found.place.index, siblings.length - 1)];
  state.select(next ? { kind: "field", key: next } : { kind: "step", key: found.place.step });
}

function listAt(doc: FormDocument, place: FieldPlace): string[] {
  const step = doc.steps.find((s) => s.key === place.step);
  const list =
    place.parent === undefined ? step?.fields : findField(doc, place.parent)?.field.fields;
  return (list ?? []).map((f) => f.key);
}

/** Duplicates the selected field and selects the copy. */
export function duplicateSelected(store: Store): void {
  const state = store.getState();
  const { selection } = state;
  if (selection.kind !== "field") return;
  let key = selection.key;
  state.edit((doc) => {
    const out = duplicateField(doc, selection.key);
    key = out.key;
    return out.doc;
  });
  state.select({ kind: "field", key });
}

/** Moves a field one place up (-1) or down (+1) within its list. */
export function nudgeField(store: Store, key: string, by: -1 | 1): void {
  store.getState().edit((doc) => {
    const found = findField(doc, key);
    if (!found) return doc;
    const index = found.place.index + by;
    if (index < 0) return doc;
    return moveField(doc, key, { ...found.place, index });
  });
}
