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
import { CONTAINER_TYPES, type FieldTypeInfo } from "@/shared/config";
import type { StoreApi } from "zustand/vanilla";
import type { BuilderState, Selection } from "./store";

type Store = StoreApi<BuilderState>;

/** Where a new field goes: after the selected field, into the selected group or step, or at the end. */
export function placeForNew(doc: FormDocument, selection: Selection): FieldPlace {
  if (selection.kind === "field") {
    const found = findField(doc, selection.key);
    if (found && CONTAINER_TYPES.has(found.field.type)) {
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

/** What is being dragged: a new field from the palette or an existing field. */
export type DragSource =
  | { readonly kind: "new"; readonly type: string }
  | { readonly kind: "field"; readonly key: string };

/**
 * Moves an existing field to a drop slot. `slot.index` counts the fields
 * before the slot with the dragged field still in place, so it is shifted
 * when the field moves down within the same list.
 */
export function dropField(doc: FormDocument, key: string, slot: FieldPlace): FormDocument {
  const found = findField(doc, key);
  if (!found) return doc;
  const sameList = found.place.step === slot.step && found.place.parent === slot.parent;
  const index = sameList && found.place.index < slot.index ? slot.index - 1 : slot.index;
  if (sameList && index === found.place.index) return doc;
  return moveField(doc, key, { ...slot, index });
}

/** Adds a new field of `info`'s type at a drop slot and selects it. */
export function dropNewField(
  store: Store,
  info: FieldTypeInfo,
  label: string,
  slot: FieldPlace,
): void {
  let key = "";
  store.getState().edit((doc) => {
    key = uniqueKey(doc, info.keyBase);
    return insertField(doc, info.create(key, label), slot);
  });
  store.getState().select({ kind: "field", key });
}
