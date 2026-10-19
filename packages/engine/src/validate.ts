import type * as z from "zod/mini";
import type { CompiledField, CompiledForm } from "./compile.js";
import { evaluate, type FormState } from "./evaluate.js";

/**
 * A problem with one field's value.
 *
 * @since 0.1.0
 */
export interface ValidationIssue {
  /**
   * Key of the field. For a field inside a repeater row it is a path such as
   * `"people.0.name"` (repeater key, row index, field key).
   */
  readonly key: string;
  /**
   * What is wrong, as a code such as `"required"`, `"tooLong"` or
   * `"invalidEmail"`. Turn it into text with `formatIssue` from
   * `@formweave/engine/messages`.
   */
  readonly code: string;
  /** Limits of the failed check, used in messages: `min` and `max`. */
  readonly params?: Readonly<{ min?: number; max?: number }> | undefined;
}

/**
 * Result of {@link validate}.
 *
 * @since 0.1.0
 */
export type ValidationResult =
  | {
      readonly success: true;
      /** Values of visible, non-empty fields only. Hidden fields are dropped. */
      readonly data: Readonly<Record<string, unknown>>;
    }
  | {
      readonly success: false;
      /** At most one issue per field, in document order. */
      readonly issues: readonly ValidationIssue[];
    };

/**
 * Options for {@link validate}.
 *
 * @since 0.1.0
 */
export interface ValidateOptions {
  /** State from {@link evaluate} for the same values; computed when missing. */
  readonly state?: FormState | undefined;
  /** Validate only the fields of this step (for "next" on multi-step forms). */
  readonly step?: string | undefined;
}

const validators = new WeakMap<CompiledField, z.ZodMiniType>();

const validatorOf = (field: CompiledField): z.ZodMiniType => {
  let schema = validators.get(field);
  if (!schema) {
    schema = field.definition.validator({ settings: field.settings });
    validators.set(field, schema);
  }
  return schema;
};

const toIssue = (key: string, raw: z.core.$ZodIssue | undefined): ValidationIssue => {
  if (!raw) return { key, code: "invalid" };
  const params: { min?: number; max?: number } = {};
  if (raw.code === "too_small" && typeof raw.minimum === "number") params.min = raw.minimum;
  if (raw.code === "too_big" && typeof raw.maximum === "number") params.max = raw.maximum;
  if (raw.code === "custom") {
    // Refinements pass their limits as `params: { min, max }`.
    const extra = raw.params as { min?: unknown; max?: unknown } | undefined;
    if (typeof extra?.min === "number") params.min = extra.min;
    if (typeof extra?.max === "number") params.max = extra.max;
  }
  return { key, code: raw.message, params };
};

/**
 * Whether a value counts as empty by default: `undefined`, `null`, `""` or `[]`.
 *
 * @param value - Any value.
 * @returns `true` when the value is empty.
 * @since 0.1.0
 */
export function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Checks form values against a compiled form. The same function runs in the
 * browser and on the server, so both always agree.
 *
 * Hidden fields are skipped and left out of `data`. Empty optional fields are
 * left out too. Every other field must pass its type's validator.
 *
 * @param form - A compiled form from `compile`.
 * @param values - Values by field key, for example the body of a submission.
 * @param options - Precomputed state, or a single step to check.
 * @returns The cleaned data, or the issues found.
 * @example
 * ```ts
 * const result = validate(form, await request.json());
 * if (!result.success) return Response.json(result.issues, { status: 422 });
 * await save(result.data);
 * ```
 * @since 0.1.0
 */
export function validate(
  form: CompiledForm,
  values: Readonly<Record<string, unknown>>,
  options?: ValidateOptions,
): ValidationResult {
  const state = options?.state ?? evaluate(form, values);
  const keys = options?.step
    ? (form.steps.find((s) => s.key === options.step)?.fields ?? [])
    : form.order;
  const data: Record<string, unknown> = {};
  const issues: ValidationIssue[] = [];
  for (const key of keys) {
    const field = form.fields.get(key);
    const fieldState = state.fields[key];
    if (!field || !fieldState?.visible || field.definition.container) continue;
    const value = values[key];
    const empty = (field.definition.isEmpty ?? isEmptyValue)(value);
    if (empty) {
      if (fieldState.required) issues.push({ key, code: "required" });
      continue;
    }
    const result = validatorOf(field).safeParse(value);
    if (!result.success) {
      issues.push(toIssue(key, result.error.issues[0]));
      continue;
    }
    if (!field.rows) {
      data[key] = result.data;
      continue;
    }
    // Each row is a small form of its own; its issues get paths such as
    // "people.0.name".
    const rows: unknown[] = [];
    for (const [i, row] of (value as readonly unknown[]).entries()) {
      const rowValues =
        row !== null && typeof row === "object" ? (row as Readonly<Record<string, unknown>>) : {};
      const r = validate(field.rows, rowValues);
      if (r.success) rows.push(r.data);
      else
        for (const issue of r.issues)
          issues.push({ ...issue, key: `${key}.${String(i)}.${issue.key}` });
    }
    data[key] = rows;
  }
  return issues.length ? { success: false, issues } : { success: true, data };
}

/**
 * The Standard Schema v1 interface (https://standardschema.dev), declared
 * here so this package has no extra dependency.
 *
 * @typeParam Output - Type of the validated data.
 * @since 0.1.0
 */
export interface StandardSchema<Output> {
  /** Standard Schema properties. */
  readonly "~standard": {
    /** Always `1`. */
    readonly version: 1;
    /** Library that made the schema. */
    readonly vendor: string;
    /**
     * Validates a value.
     *
     * @param value - The value to check.
     * @returns The value, or issues with a message and path.
     */
    readonly validate: (value: unknown) =>
      | { readonly value: Output; readonly issues?: undefined }
      | {
          readonly issues: readonly {
            readonly message: string;
            readonly path: readonly string[];
          }[];
        };
  };
}

/**
 * Wraps {@link validate} in the Standard Schema interface, so any library
 * that accepts Standard Schema (for example React Hook Form's
 * `standardSchemaResolver`) can validate a formweave form. Issue messages are
 * the issue codes.
 *
 * @param form - A compiled form.
 * @returns A Standard Schema for the form's values.
 * @since 0.1.0
 */
export function toStandardSchema(form: CompiledForm): StandardSchema<Record<string, unknown>> {
  return {
    "~standard": {
      version: 1,
      vendor: "formweave",
      validate: (value) => {
        const values =
          value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
        const result = validate(form, values);
        if (result.success) return { value: { ...result.data } };
        return { issues: result.issues.map((i) => ({ message: i.code, path: [i.key] })) };
      },
    },
  };
}
