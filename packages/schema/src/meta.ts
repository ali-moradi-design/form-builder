import * as z from "zod/mini";
import {
  OPERATORS,
  type Expression,
  type FieldNode,
  type FormDocument,
  type LocalizedText,
  type Step,
} from "./types.js";

const KEY = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const keySchema = z
  .string()
  .check(z.regex(KEY, "Use a letter first, then letters, digits or _ (max 64)."));
const localeSchema = z
  .string()
  .check(
    z.regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Use a BCP 47 language tag such as en or fa."),
  );

/**
 * Zod schema for {@link LocalizedText}.
 *
 * @since 0.1.0
 */
export const localizedTextSchema: z.ZodMiniType<LocalizedText> = z.union([
  z.string(),
  z.record(localeSchema, z.string()),
]);

/**
 * Zod schema for {@link Expression}. Rejects any operator that is not in
 * {@link OPERATORS}.
 *
 * @since 0.1.0
 */
export const expressionSchema: z.ZodMiniType<Expression> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.strictObject({ var: keySchema }),
    z.strictObject({ op: z.enum(OPERATORS), args: z.array(expressionSchema) }),
  ]),
);

/**
 * Zod schema for {@link FieldNode}. Checks the shape only; whether `type` and
 * `settings` are valid is decided by the engine's field registry.
 *
 * @since 0.1.0
 */
export const fieldNodeSchema: z.ZodMiniType<FieldNode> = z.lazy(() =>
  z.strictObject({
    type: z.string().check(z.minLength(1)),
    key: keySchema,
    label: z.optional(localizedTextSchema),
    help: z.optional(localizedTextSchema),
    placeholder: z.optional(localizedTextSchema),
    required: z.optional(z.boolean()),
    visibleWhen: z.optional(expressionSchema),
    requiredWhen: z.optional(expressionSchema),
    disabledWhen: z.optional(expressionSchema),
    calculate: z.optional(expressionSchema),
    width: z.optional(z.enum(["full", "half"])),
    settings: z.optional(z.record(z.string(), z.unknown())),
    fields: z.optional(z.array(fieldNodeSchema)),
  }),
);

/**
 * Zod schema for {@link Step}.
 *
 * @since 0.1.0
 */
export const stepSchema: z.ZodMiniType<Step> = z.strictObject({
  key: keySchema,
  title: z.optional(localizedTextSchema),
  description: z.optional(localizedTextSchema),
  visibleWhen: z.optional(expressionSchema),
  fields: z.array(fieldNodeSchema),
});

function* walkFields(
  fields: readonly FieldNode[],
  path: (string | number)[],
): Generator<[FieldNode, (string | number)[]]> {
  for (const [i, field] of fields.entries()) {
    const here = [...path, i];
    yield [field, here];
    if (field.fields) yield* walkFields(field.fields, [...here, "fields"]);
  }
}

function* varRefs(expr: Expression | undefined): Generator<string> {
  if (expr === null || typeof expr !== "object") return;
  if ("var" in expr) {
    yield expr.var;
    return;
  }
  for (const arg of expr.args) yield* varRefs(arg);
}

/**
 * Zod schema for a whole {@link FormDocument}. Besides the shape it checks
 * rules that span the document:
 *
 * - field keys are unique in the whole form, step keys within the form;
 * - every `{ "var": … }` in an expression names an existing field;
 * - the default locale is one of the supported locales.
 *
 * @since 0.1.0
 */
export const formDocumentSchema: z.ZodMiniType<FormDocument> = z
  .strictObject({
    schemaVersion: z.literal(1),
    id: z.string().check(z.minLength(1)),
    title: localizedTextSchema,
    description: z.optional(localizedTextSchema),
    locales: z.strictObject({
      default: localeSchema,
      supported: z.optional(z.array(localeSchema)),
    }),
    steps: z.array(stepSchema).check(z.minLength(1, "A form needs at least one step.")),
  })
  .check((ctx) => {
    const doc = ctx.value;
    const issue = (message: string, path: (string | number)[]): void => {
      ctx.issues.push({ code: "custom", message, input: doc, path });
    };
    const { supported } = doc.locales;
    if (supported && !supported.includes(doc.locales.default)) {
      issue("The default locale must be one of the supported locales.", ["locales", "supported"]);
    }
    const stepKeys = new Set<string>();
    const fieldKeys = new Set<string>();
    const all: [FieldNode, (string | number)[]][] = [];
    for (const [s, step] of doc.steps.entries()) {
      if (stepKeys.has(step.key)) issue(`Duplicate step key "${step.key}".`, ["steps", s, "key"]);
      stepKeys.add(step.key);
      for (const [field, path] of walkFields(step.fields, ["steps", s, "fields"])) {
        if (fieldKeys.has(field.key))
          issue(`Duplicate field key "${field.key}".`, [...path, "key"]);
        fieldKeys.add(field.key);
        all.push([field, path]);
      }
    }
    const checkRefs = (expr: Expression | undefined, path: (string | number)[]): void => {
      for (const name of varRefs(expr)) {
        if (!fieldKeys.has(name)) issue(`Unknown field "${name}" in expression.`, path);
      }
    };
    for (const [s, step] of doc.steps.entries())
      checkRefs(step.visibleWhen, ["steps", s, "visibleWhen"]);
    for (const [field, path] of all) {
      checkRefs(field.visibleWhen, [...path, "visibleWhen"]);
      checkRefs(field.requiredWhen, [...path, "requiredWhen"]);
      checkRefs(field.disabledWhen, [...path, "disabledWhen"]);
      checkRefs(field.calculate, [...path, "calculate"]);
    }
  });

/**
 * A problem found in a form document.
 *
 * @since 0.1.0
 */
export interface DocumentIssue {
  /** Where the problem is, as a list of object keys and array indexes. */
  readonly path: readonly (string | number)[];
  /** What is wrong, in English. */
  readonly message: string;
}

/**
 * Result of {@link parseFormDocument}.
 *
 * @since 0.1.0
 */
export type ParseResult =
  | { readonly success: true; readonly data: FormDocument }
  | { readonly success: false; readonly issues: readonly DocumentIssue[] };

/**
 * Checks that unknown input (for example JSON from an API or an editor) is a
 * valid {@link FormDocument}. Never throws.
 *
 * @param input - Any value, usually the result of `JSON.parse`.
 * @returns The typed document, or the list of problems found.
 * @example
 * ```ts
 * const result = parseFormDocument(JSON.parse(text));
 * if (!result.success) console.table(result.issues);
 * ```
 * @since 0.1.0
 */
export function parseFormDocument(input: unknown): ParseResult {
  const result = formDocumentSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    issues: result.error.issues.map((i) => ({
      path: i.path.filter((p): p is string | number => typeof p !== "symbol"),
      message: i.message,
    })),
  };
}
