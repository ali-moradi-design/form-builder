import { readsFields } from "@formcanvas/engine";
import type { FieldNode, FormDocument } from "@formcanvas/schema";
import { allFields, findField } from "@/entities/form";

/** Key of the nearest repeater around a field, or `undefined` at the top level. */
function rowOf(doc: FormDocument, key: string): string | undefined {
  let parent = findField(doc, key)?.place.parent;
  while (parent !== undefined) {
    const found = findField(doc, parent);
    if (found?.field.type === "repeater") return parent;
    parent = found?.place.parent;
  }
  return undefined;
}

/**
 * Keys a formula of field `key` may read: the fields in the same scope (the
 * same repeater row, or the top level), without itself. Display-only
 * containers are left out.
 */
export function formulaKeys(doc: FormDocument, key: string): string[] {
  const scope = rowOf(doc, key);
  return allFields(doc)
    .filter(
      (f) =>
        f.field.key !== key &&
        f.field.type !== "group" &&
        rowOf(doc, f.field.key) === scope &&
        !["heading", "paragraph", "divider"].includes(f.field.type),
    )
    .map((f) => f.field.key);
}

/** Whether giving `key` this formula would make a field depend on itself. */
export function makesCycle(doc: FormDocument, key: string, reads: readonly string[]): boolean {
  const formulas = new Map<string, readonly string[]>();
  for (const { field } of allFields(doc)) {
    const f: FieldNode = field;
    if (f.calculate !== undefined) formulas.set(f.key, readsFields(f.calculate));
  }
  formulas.set(key, reads);
  const seen = new Set<string>();
  const stack = [...reads];
  for (let k = stack.pop(); k !== undefined; k = stack.pop()) {
    if (k === key) return true;
    if (seen.has(k)) continue;
    seen.add(k);
    stack.push(...(formulas.get(k) ?? []));
  }
  return false;
}
