import { readsFields } from "@formweave/engine";
import type { Expression, FieldNode, FormDocument, Step } from "@formweave/schema";

// Pure edit operations on a form document. Each returns a new document and
// leaves the input untouched, so the builder store can keep snapshots for
// undo. They keep the document valid: unique keys and no references to
// missing fields.

/** Where a field sits: a step, an optional group inside it, and an index. */
export interface FieldPlace {
  readonly step: string;
  /** Key of the group the field is in; absent for top-level fields. */
  readonly parent?: string | undefined;
  readonly index: number;
}

/** A field together with its place. */
export interface FoundField {
  readonly field: FieldNode;
  readonly place: FieldPlace;
}

type Fields = readonly FieldNode[];

function* walk(fields: Fields, step: string, parent: string | undefined): Generator<FoundField> {
  for (const [index, field] of fields.entries()) {
    yield { field, place: { step, parent, index } };
    if (field.fields) yield* walk(field.fields, step, field.key);
  }
}

/** Every field of the document in reading order, nested ones included. */
export function allFields(doc: FormDocument): FoundField[] {
  return doc.steps.flatMap((s) => [...walk(s.fields, s.key, undefined)]);
}

/** Finds a field by key. */
export function findField(doc: FormDocument, key: string): FoundField | undefined {
  return allFields(doc).find((f) => f.field.key === key);
}

/**
 * Makes a key that no field or step uses yet, from `base` (`name`, `name2`, …).
 * Keys are kept to letters, digits and `_` so they work as JSON paths.
 */
export function uniqueKey(doc: FormDocument, base: string): string {
  const used = new Set([...allFields(doc).map((f) => f.field.key), ...doc.steps.map((s) => s.key)]);
  const clean = base.replace(/[^\w]/g, "_").replace(/^(\d)/, "_$1") || "field";
  if (!used.has(clean)) return clean;
  for (let n = 2; ; n++) if (!used.has(`${clean}${String(n)}`)) return `${clean}${String(n)}`;
}

/** Applies `fn` to the field list at `step`/`parent`. */
function editList(
  doc: FormDocument,
  step: string,
  parent: string | undefined,
  fn: (list: Fields) => Fields,
): FormDocument {
  const inFields = (fields: Fields): Fields =>
    fields.map((f) => {
      if (f.key === parent) return { ...f, fields: fn(f.fields ?? []) };
      return f.fields ? { ...f, fields: inFields(f.fields) } : f;
    });
  return {
    ...doc,
    steps: doc.steps.map((s) => {
      if (s.key !== step) return s;
      return { ...s, fields: parent === undefined ? fn(s.fields) : inFields(s.fields) };
    }),
  };
}

const clampIndex = (i: number, length: number): number => Math.max(0, Math.min(i, length));

function insertAt<T>(list: readonly T[], index: number, item: T): T[] {
  const out = [...list];
  out.splice(clampIndex(index, list.length), 0, item);
  return out;
}

/** Inserts a field. The field's key must be unused (see {@link uniqueKey}). */
export function insertField(doc: FormDocument, field: FieldNode, at: FieldPlace): FormDocument {
  if (findField(doc, field.key)) throw new Error(`Field key "${field.key}" is already used.`);
  return editList(doc, at.step, at.parent, (list) => insertAt(list, at.index, field));
}

/** Expression props that may name other fields. */
const CONDITIONS = ["visibleWhen", "requiredWhen", "disabledWhen"] as const;

/** Maps over every expression slot of every step and field. */
function mapConditions(
  doc: FormDocument,
  fn: (expr: Expression) => Expression | undefined,
): FormDocument {
  const field = (f: FieldNode): FieldNode => {
    let out: FieldNode = f;
    for (const c of CONDITIONS) {
      const expr = f[c];
      if (expr === undefined) continue;
      const next = fn(expr);
      if (next !== expr) out = withProp(out, c, next);
    }
    return out.fields ? { ...out, fields: out.fields.map(field) } : out;
  };
  return {
    ...doc,
    steps: doc.steps.map((s): Step => {
      const fields = s.fields.map(field);
      const visible = s.visibleWhen === undefined ? undefined : fn(s.visibleWhen);
      return withProp({ ...s, fields }, "visibleWhen", visible);
    }),
  };
}

/** Sets a prop, or removes it when the value is `undefined`. */
function withProp<T extends object, K extends keyof T>(obj: T, key: K, value: T[K] | undefined): T {
  if (value !== undefined) return { ...obj, [key]: value };
  if (!(key in obj)) return obj;
  return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key)) as T;
}

/**
 * Removes a field (and the fields inside it, for a group). Conditions that
 * read a removed field are removed too, so the document stays valid.
 */
export function removeField(doc: FormDocument, key: string): FormDocument {
  const found = findField(doc, key);
  if (!found) return doc;
  const gone = new Set([
    key,
    ...[...walk(found.field.fields ?? [], "", key)].map((f) => f.field.key),
  ]);
  const { step, parent } = found.place;
  const without = editList(doc, step, parent, (list) => list.filter((f) => f.key !== key));
  return mapConditions(without, (expr) =>
    readsFields(expr).some((k) => gone.has(k)) ? undefined : expr,
  );
}

/**
 * Moves a field. `to.index` is the index in the target list after the field
 * has been taken out. A group cannot be moved into itself.
 */
export function moveField(doc: FormDocument, key: string, to: FieldPlace): FormDocument {
  const found = findField(doc, key);
  if (!found) return doc;
  if (to.parent !== undefined) {
    const inside = [...walk(found.field.fields ?? [], "", key)].some(
      (f) => f.field.key === to.parent,
    );
    if (to.parent === key || inside) return doc;
  }
  const { step, parent } = found.place;
  const without = editList(doc, step, parent, (list) => list.filter((f) => f.key !== key));
  return editList(without, to.step, to.parent, (list) => insertAt(list, to.index, found.field));
}

/** Changes the props of a field. The key is changed with {@link renameField}. */
export function updateField(
  doc: FormDocument,
  key: string,
  patch: Partial<Omit<FieldNode, "key" | "fields">>,
): FormDocument {
  const found = findField(doc, key);
  if (!found) return doc;
  const { step, parent, index } = found.place;
  return editList(doc, step, parent, (list) =>
    list.map((f, i) => {
      if (i !== index) return f;
      let out: FieldNode = f;
      for (const [k, v] of Object.entries(patch))
        out = withProp(out, k as keyof FieldNode, v as never);
      return out;
    }),
  );
}

/** Replaces `{ "var": from }` with `{ "var": to }` inside an expression. */
function renameVar(expr: Expression, from: string, to: string): Expression {
  if (expr === null || typeof expr !== "object") return expr;
  if ("var" in expr) return expr.var === from ? { var: to } : expr;
  return { ...expr, args: expr.args.map((a) => renameVar(a, from, to)) };
}

/**
 * Changes a field's key and every condition that reads it. Returns the input
 * unchanged when the new key is taken or empty.
 */
export function renameField(doc: FormDocument, from: string, to: string): FormDocument {
  const found = findField(doc, from);
  if (!found || from === to || !to) return doc;
  if (findField(doc, to) || doc.steps.some((s) => s.key === to)) return doc;
  const { step, parent, index } = found.place;
  const renamed = editList(doc, step, parent, (list) =>
    list.map((f, i) => (i === index ? { ...f, key: to } : f)),
  );
  return mapConditions(renamed, (expr) =>
    readsFields(expr).includes(from) ? renameVar(expr, from, to) : expr,
  );
}

/** Adds a step at `index` (default: the end). Its key must be unused. */
export function addStep(
  doc: FormDocument,
  step: Omit<Step, "fields"> & { readonly fields?: readonly FieldNode[] },
  index = doc.steps.length,
): FormDocument {
  if (doc.steps.some((s) => s.key === step.key))
    throw new Error(`Step key "${step.key}" is already used.`);
  return { ...doc, steps: insertAt(doc.steps, index, { ...step, fields: step.fields ?? [] }) };
}

/** Removes a step with its fields. The last step is never removed. */
export function removeStep(doc: FormDocument, key: string): FormDocument {
  const step = doc.steps.find((s) => s.key === key);
  if (!step || doc.steps.length === 1) return doc;
  let out: FormDocument = doc;
  for (const f of step.fields) out = removeField(out, f.key);
  return { ...out, steps: out.steps.filter((s) => s.key !== key) };
}

/** Moves a step to `index`. */
export function moveStep(doc: FormDocument, key: string, index: number): FormDocument {
  const step = doc.steps.find((s) => s.key === key);
  if (!step) return doc;
  return {
    ...doc,
    steps: insertAt(
      doc.steps.filter((s) => s !== step),
      index,
      step,
    ),
  };
}

/** Changes the props of a step (title, description, condition). */
export function updateStep(
  doc: FormDocument,
  key: string,
  patch: Partial<Omit<Step, "key" | "fields">>,
): FormDocument {
  return {
    ...doc,
    steps: doc.steps.map((s) => {
      if (s.key !== key) return s;
      let out: Step = s;
      for (const [k, v] of Object.entries(patch)) out = withProp(out, k as keyof Step, v as never);
      return out;
    }),
  };
}

/** Changes the form's own props (title, description, locales). */
export function updateForm(
  doc: FormDocument,
  patch: Partial<Pick<FormDocument, "title" | "description" | "locales">>,
): FormDocument {
  let out = doc;
  for (const [k, v] of Object.entries(patch))
    out = withProp(out, k as keyof FormDocument, v as never);
  return out;
}

/**
 * Copies a field (with its children) right after itself, giving every copy a
 * new key. Returns the new document and the key of the copy.
 */
export function duplicateField(
  doc: FormDocument,
  key: string,
): { readonly doc: FormDocument; readonly key: string } {
  const found = findField(doc, key);
  if (!found) return { doc, key };
  let current = doc;
  const copy = (f: FieldNode): FieldNode => {
    const newKey = uniqueKey(current, f.key);
    // Reserve the key so nested copies don't pick the same one.
    current = { ...current, steps: [...current.steps, { key: newKey, fields: [] }] };
    return { ...f, key: newKey, ...(f.fields ? { fields: f.fields.map(copy) } : {}) };
  };
  const clone = copy(found.field);
  const { step, parent, index } = found.place;
  return {
    doc: editList(doc, step, parent, (list) => insertAt(list, index + 1, clone)),
    key: clone.key,
  };
}

/** Counts the fields of a document, including nested ones. */
export function countFields(document: FormDocument): number {
  type Node = { readonly fields?: readonly Node[] | undefined };
  const count = (nodes: readonly Node[]): number =>
    nodes.reduce((n, f) => n + 1 + count(f.fields ?? []), 0);
  return document.steps.reduce((n, s) => n + count(s.fields), 0);
}
