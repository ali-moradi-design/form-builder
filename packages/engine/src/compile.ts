import type { Expression, FieldNode, FormDocument } from "@formcanvas/schema";
import { readsFields } from "./expr.js";
import type { FieldDefinition, FieldRegistry } from "./registry.js";

/**
 * Thrown by {@link compile} when a document uses a field type that is not in
 * the registry or field settings that the type rejects.
 *
 * @since 0.1.0
 */
export class SchemaError extends Error {
  /** Where the problem is in the document, as object keys and array indexes. */
  readonly path: readonly (string | number)[];

  /**
   * @param message - What is wrong.
   * @param path - Where it is in the document.
   */
  constructor(message: string, path: readonly (string | number)[]) {
    super(message);
    this.name = "SchemaError";
    this.path = path;
  }
}

/**
 * One field of a {@link CompiledForm}, with its definition and parsed settings.
 *
 * @since 0.1.0
 */
export interface CompiledField {
  /** The field's key. */
  readonly key: string;
  /** The field as written in the document. */
  readonly node: FieldNode;
  /** The registered definition of the field's type. */
  readonly definition: FieldDefinition;
  /** Settings after parsing, with defaults applied. */
  readonly settings: unknown;
  /** Key of the step the field belongs to. */
  readonly step: string;
  /** Key of the container field it sits in, if any. */
  readonly parent: string | undefined;
  /** Position in document order; parents come before their children. */
  readonly index: number;
  /**
   * For row types such as repeaters: the child fields compiled as a form of
   * their own, used for each row. Conditions inside a row read that row's
   * values.
   *
   * @since 0.6.0
   */
  readonly rows?: CompiledForm | undefined;
}

/**
 * One step of a {@link CompiledForm}.
 *
 * @since 0.1.0
 */
export interface CompiledStep {
  /** The step's key. */
  readonly key: string;
  /** Condition that shows the step, if any. */
  readonly visibleWhen: Expression | undefined;
  /** Keys of the step's fields in document order, including nested ones. */
  readonly fields: readonly string[];
}

/**
 * A form prepared for fast evaluation. Create it once per published version
 * with {@link compile} and reuse it; it is frozen and safe to share.
 *
 * @since 0.1.0
 */
export interface CompiledForm {
  /** The source document. */
  readonly document: FormDocument;
  /** Every field by key, including fields inside containers. */
  readonly fields: ReadonlyMap<string, CompiledField>;
  /** Field keys in document order. */
  readonly order: readonly string[];
  /** Steps in order. */
  readonly steps: readonly CompiledStep[];
  /**
   * For each field key, the keys of fields and steps whose state reads it.
   * When a value changes, only these need to be evaluated again.
   */
  readonly dependents: ReadonlyMap<string, ReadonlySet<string>>;
  /** Starting values of all fields that have a value. */
  readonly defaults: Readonly<Record<string, unknown>>;
  /**
   * Keys of fields with a `calculate` expression, ordered so that each one
   * comes after the calculated fields it reads.
   *
   * @since 0.6.0
   */
  readonly calculated: readonly string[];
}

/**
 * Options for {@link compile}.
 *
 * @since 0.1.0
 */
export interface CompileOptions {
  /** Field types that may appear in the document. */
  readonly registry: FieldRegistry;
}

/**
 * Prepares a form document for evaluation: resolves every field's type in the
 * registry, parses its settings, collects default values and builds the
 * dependency graph used by {@link evaluate}.
 *
 * The document's shape is trusted here. Check untrusted input first with
 * `parseFormDocument` from `@formcanvas/schema/meta`.
 *
 * @param document - A form document.
 * @param options - See {@link CompileOptions}.
 * @returns The compiled form.
 * @throws {@link SchemaError} When a field type is unknown or its settings are invalid.
 * @example
 * ```ts
 * const form = compile(doc, { registry: createRegistry([shortText, radio]) });
 * ```
 * @since 0.1.0
 */
export function compile(document: FormDocument, options: CompileOptions): CompiledForm {
  const fields = new Map<string, CompiledField>();
  const order: string[] = [];
  const defaults: Record<string, unknown> = {};
  const dependents = new Map<string, Set<string>>();
  const calculated = new Map<string, (string | number)[]>();
  const link = (target: string, expr: Expression | undefined): void => {
    for (const source of readsFields(expr)) {
      let set = dependents.get(source);
      if (!set) dependents.set(source, (set = new Set()));
      set.add(target);
    }
  };

  const steps = document.steps.map((step, s) => {
    const stepFields: string[] = [];
    link(`step:${step.key}`, step.visibleWhen);
    const visit = (
      nodes: readonly FieldNode[],
      parent: string | undefined,
      path: (string | number)[],
    ): void => {
      for (const [i, node] of nodes.entries()) {
        const here = [...path, i];
        const definition = options.registry.get(node.type);
        if (!definition)
          throw new SchemaError(`Unknown field type "${node.type}".`, [...here, "type"]);
        const parsed = definition.settings.safeParse(node.settings ?? {});
        if (!parsed.success) {
          throw new SchemaError(`Invalid settings for field "${node.key}".`, [...here, "settings"]);
        }
        // Row types get their children as a separate form; they are not
        // fields of this form.
        const rows = definition.rows ? compileRows(node, options, [...here, "fields"]) : undefined;
        const field: CompiledField = Object.freeze({
          key: node.key,
          node,
          definition,
          settings: parsed.data,
          step: step.key,
          parent,
          index: order.length,
          ...(rows ? { rows } : {}),
        });
        fields.set(node.key, field);
        order.push(node.key);
        stepFields.push(node.key);
        if (rows) {
          const min = (parsed.data as { minRows?: number }).minRows ?? 0;
          defaults[node.key] = Array.from({ length: min }, () => ({ ...rows.defaults }));
        } else if (!definition.container) {
          const value = definition.defaultValue(parsed.data);
          if (value !== undefined) defaults[node.key] = value;
        }
        link(node.key, node.visibleWhen);
        link(node.key, node.requiredWhen);
        link(node.key, node.disabledWhen);
        for (const source of definition.reads?.(parsed.data) ?? []) {
          let set = dependents.get(source);
          if (!set) dependents.set(source, (set = new Set()));
          set.add(node.key);
        }
        if (node.calculate !== undefined) {
          link(node.key, node.calculate);
          calculated.set(node.key, here);
        }
        if (node.fields && !rows) visit(node.fields, node.key, [...here, "fields"]);
      }
    };
    visit(step.fields, undefined, ["steps", s, "fields"]);
    return Object.freeze({ key: step.key, visibleWhen: step.visibleWhen, fields: stepFields });
  });

  return Object.freeze({
    document,
    fields,
    order,
    steps,
    dependents,
    defaults: Object.freeze(defaults),
    calculated: calculationOrder(fields, calculated),
  });
}

// Orders calculated fields so each comes after the calculated fields it
// reads; a field that reads itself, directly or not, is a SchemaError.
function calculationOrder(
  fields: ReadonlyMap<string, CompiledField>,
  paths: ReadonlyMap<string, (string | number)[]>,
): string[] {
  const out: string[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (key: string): void => {
    const seen = state.get(key);
    if (seen === "done") return;
    if (seen === "visiting") {
      throw new SchemaError(`Field "${key}" is calculated from itself.`, [
        ...(paths.get(key) ?? []),
        "calculate",
      ]);
    }
    state.set(key, "visiting");
    for (const source of readsFields(fields.get(key)?.node.calculate)) {
      if (paths.has(source)) visit(source);
    }
    state.set(key, "done");
    out.push(key);
  };
  for (const key of paths.keys()) visit(key);
  return out;
}

// Compiles the children of a row field as a one-step form.
function compileRows(
  node: FieldNode,
  options: CompileOptions,
  path: readonly (string | number)[],
): CompiledForm {
  const document: FormDocument = {
    schemaVersion: 1,
    id: node.key,
    title: "",
    locales: { default: "en" },
    steps: [{ key: "row", fields: node.fields ?? [] }],
  };
  try {
    return compile(document, options);
  } catch (error) {
    if (error instanceof SchemaError) {
      // Point at the child inside the outer document.
      throw new SchemaError(error.message, [...path, ...error.path.slice(3)]);
    }
    throw error;
  }
}
