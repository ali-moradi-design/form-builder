import type { Expression } from "@formweave/schema";
import { calculateValues } from "./calculate.js";
import type { CompiledForm } from "./compile.js";
import { evalExpression, truthy } from "./expr.js";

/**
 * Current state of one field, derived from the form values.
 *
 * @since 0.1.0
 */
export interface FieldState {
  /** Whether the field is shown. Hidden fields are not validated or submitted. */
  readonly visible: boolean;
  /** Whether an answer is needed (only ever `true` while visible). */
  readonly required: boolean;
  /** Whether the field is read-only (always `true` for calculated fields). */
  readonly disabled: boolean;
}

/**
 * Current state of one step.
 *
 * @since 0.1.0
 */
export interface StepState {
  /** Whether the step is shown. */
  readonly visible: boolean;
}

/**
 * Derived state of a whole form. Objects of fields whose state did not change
 * are reused between evaluations, so `===` tells what changed.
 *
 * @since 0.1.0
 */
export interface FormState {
  /** State of every field by key. */
  readonly fields: Readonly<Record<string, FieldState>>;
  /** State of every step by key. */
  readonly steps: Readonly<Record<string, StepState>>;
}

/**
 * Lets {@link evaluate} reuse the previous result and recompute only what the
 * changed values affect.
 *
 * @since 0.1.0
 */
export interface EvaluateOptions {
  /** The state returned by the previous call for the same compiled form. */
  readonly previous: FormState;
  /** Keys of the values that changed since then. */
  readonly changed: Iterable<string>;
}

const HIDDEN: FieldState = Object.freeze({ visible: false, required: false, disabled: false });
const SHOWN: StepState = Object.freeze({ visible: true });
const NOT_SHOWN: StepState = Object.freeze({ visible: false });

const holds = (expr: Expression | undefined, read: (k: string) => unknown): boolean =>
  expr !== undefined && truthy(evalExpression(expr, read));

const sameState = (a: FieldState | undefined, b: FieldState): boolean =>
  a !== undefined &&
  a.visible === b.visible &&
  a.required === b.required &&
  a.disabled === b.disabled;

/**
 * Works out which fields and steps are visible, required and disabled for the
 * given values.
 *
 * Pass `options` with the previous state and the keys that changed to update
 * only the fields that depend on them; this keeps a keystroke in a large form
 * well under a millisecond.
 *
 * @param form - A compiled form from {@link compile}.
 * @param values - Current values by field key.
 * @param options - Previous state and changed keys, for an incremental update.
 * @returns The derived state.
 * @example
 * ```ts
 * let state = evaluate(form, values);
 * values.plan = "team";
 * state = evaluate(form, values, { previous: state, changed: ["plan"] });
 * state.fields.seats.visible; // true
 * ```
 * @since 0.1.0
 */
export function evaluate(
  form: CompiledForm,
  values: Readonly<Record<string, unknown>>,
  options?: EvaluateOptions,
): FormState {
  const all = calculateValues(form, values);
  const read = (k: string): unknown => all[k];
  const previous = options?.previous;
  let affected: Set<string> | undefined;
  if (previous) {
    affected = new Set();
    // A calculated field changes with its inputs, so what reads it is affected too.
    const queue = [...options.changed];
    for (let key = queue.pop(); key !== undefined; key = queue.pop()) {
      for (const target of form.dependents.get(key) ?? []) {
        if (affected.has(target)) continue;
        affected.add(target);
        if (form.fields.get(target)?.node.calculate !== undefined) queue.push(target);
      }
    }
    if (affected.size === 0) return previous;
  }

  const steps: Record<string, StepState> = {};
  const fields: Record<string, FieldState> = {};
  let changedAny = false;

  for (const step of form.steps) {
    const before = previous?.steps[step.key];
    const stepVisible =
      before && affected && !affected.has(`step:${step.key}`)
        ? before.visible
        : step.visibleWhen === undefined || holds(step.visibleWhen, read);
    steps[step.key] = stepVisible ? SHOWN : NOT_SHOWN;
    const stepChanged = before?.visible !== stepVisible;
    if (stepChanged) changedAny = true;

    for (const key of step.fields) {
      const field = form.fields.get(key);
      if (!field) continue;
      const old = previous?.fields[key];
      const parent = field.parent === undefined ? undefined : fields[field.parent];
      const parentChanged = field.parent !== undefined && parent !== previous?.fields[field.parent];
      if (old && affected && !affected.has(key) && !stepChanged && !parentChanged) {
        fields[key] = old;
        continue;
      }
      const node = field.node;
      const visible =
        stepVisible &&
        (parent?.visible ?? true) &&
        (node.visibleWhen === undefined || holds(node.visibleWhen, read));
      let next: FieldState = HIDDEN;
      if (visible) {
        next = {
          visible,
          required:
            !field.definition.container &&
            (node.required === true || holds(node.requiredWhen, read)),
          disabled:
            node.calculate !== undefined ||
            (parent?.disabled ?? false) ||
            holds(node.disabledWhen, read),
        };
      }
      if (sameState(old, next)) {
        fields[key] = old as FieldState;
      } else {
        fields[key] = Object.freeze(next);
        changedAny = true;
      }
    }
  }

  if (previous && !changedAny) return previous;
  return Object.freeze({ fields: Object.freeze(fields), steps: Object.freeze(steps) });
}
