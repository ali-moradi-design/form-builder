import { evaluate, type CompiledForm, type FormState } from "@formcanvas/engine";

/**
 * Holds the derived `FormState` (from `@formcanvas/engine`) of a form and tells subscribers when it
 * changes. Field components read their own slice, so a change only re-renders
 * the fields whose state object changed.
 *
 * @since 0.2.0
 */
export interface StateStore {
  /**
   * The current state.
   *
   * @returns The state from the last update.
   */
  readonly get: () => FormState;
  /**
   * Registers a listener for state changes.
   *
   * @param listener - Called after every change.
   * @returns A function that removes the listener.
   */
  readonly subscribe: (listener: () => void) => () => void;
  /**
   * Re-evaluates after values change.
   *
   * @param values - All current values.
   * @param changed - Keys that changed; `undefined` re-evaluates everything.
   */
  readonly update: (values: Readonly<Record<string, unknown>>, changed?: readonly string[]) => void;
}

/**
 * Creates a {@link StateStore} for a compiled form.
 *
 * @param form - The compiled form.
 * @param values - Starting values.
 * @returns The store.
 * @since 0.2.0
 */
export function createStateStore(
  form: CompiledForm,
  values: Readonly<Record<string, unknown>>,
): StateStore {
  let state = evaluate(form, values);
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update: (next, changed) => {
      const after = changed
        ? evaluate(form, next, { previous: state, changed })
        : evaluate(form, next);
      if (after === state) return;
      state = after;
      for (const l of listeners) l();
    },
  };
}
