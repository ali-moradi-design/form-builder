import {
  compile,
  validate,
  type CompiledForm,
  type FieldRegistry,
  type FieldState,
} from "@formweave/engine";
import { isRtl, localizeDigits, resolveText, type DigitStyle } from "@formweave/engine/i18n";
import { en, fa, formatIssue, type MessageCatalog } from "@formweave/engine/messages";
import type { FormDocument, Locale } from "@formweave/schema";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import type { RendererMap } from "./renderers.js";
import { createStateStore, type StateStore } from "./store.js";

/**
 * Text of the form's own buttons.
 *
 * @since 0.2.0
 */
export interface FormLabels {
  /** Button that goes to the next step. */
  readonly next: string;
  /** Button that goes to the previous step. */
  readonly back: string;
  /** Button that submits the form. */
  readonly submit: string;
  /** Button that confirms one answer in the focus layout. */
  readonly ok: string;
  /** Question counter in the focus layout; `{n}` and `{total}` are replaced. */
  readonly question: string;
}

const LABELS: Readonly<Record<string, FormLabels>> = {
  en: {
    next: "Next",
    back: "Back",
    submit: "Submit",
    ok: "OK",
    question: "Question {n} of {total}",
  },
  fa: {
    next: "مرحلهٔ بعد",
    back: "قبلی",
    submit: "ارسال",
    ok: "تأیید",
    question: "پرسش {n} از {total}",
  },
};

/**
 * Form values by field key.
 *
 * @since 0.2.0
 */
export type Values = Record<string, unknown>;

/**
 * Props of {@link Form}.
 *
 * @since 0.2.0
 */
export interface FormProps {
  /** The form document to render. */
  readonly schema: FormDocument;
  /** Field types the document may use. */
  readonly registry: FieldRegistry;
  /** Components that draw each field type. */
  readonly renderers: RendererMap;
  /**
   * Reader's locale.
   *
   * @defaultValue the document's default locale
   */
  readonly locale?: Locale | undefined;
  /**
   * Digits in numbers and messages.
   *
   * @defaultValue `"native"`
   */
  readonly digits?: DigitStyle | undefined;
  /**
   * Error messages by issue code.
   *
   * @defaultValue Persian messages for `fa`, English otherwise
   */
  readonly messages?: MessageCatalog | undefined;
  /** Text of the navigation and submit buttons. */
  readonly labels?: Partial<FormLabels> | undefined;
  /** Starting values; they override the field types' defaults. */
  readonly defaultValues?: Readonly<Values> | undefined;
  /**
   * Called with the validated data: values of visible, non-empty fields only.
   * Optional for live forms that only use {@link FormProps.onChange}.
   *
   * @param data - The cleaned values.
   */
  readonly onSubmit?: ((data: Readonly<Values>) => void | Promise<void>) | undefined;
  /**
   * Called after every change with all current values (not validated), for
   * live forms such as a settings panel.
   *
   * @param values - Every value, including hidden fields.
   * @param name - Key of the field that changed, when known.
   * @since 0.3.0
   */
  readonly onChange?: ((values: Readonly<Values>, name: string | undefined) => void) | undefined;
  /**
   * Shows the navigation and submit buttons. Turn off for live forms; Enter
   * then does nothing.
   *
   * @defaultValue `true`
   * @since 0.3.0
   */
  readonly actions?: boolean | undefined;
  /**
   * How questions are laid out.
   *
   * - `"classic"`: one step per page, all its fields at once.
   * - `"focus"`: one question per page with a progress bar; Enter confirms.
   *
   * @defaultValue `"classic"`
   */
  readonly layout?: "classic" | "focus" | undefined;
  /** Class name of the `<form>` element. */
  readonly className?: string | undefined;
}

interface FormweaveContextValue {
  readonly form: CompiledForm;
  readonly store: StateStore;
  readonly renderers: RendererMap;
  readonly locale: Locale;
  readonly fallback: Locale;
  readonly idPrefix: string;
}

const Ctx = createContext<FormweaveContextValue | null>(null);

const useFormweave = (): FormweaveContextValue => {
  const value = useContext(Ctx);
  if (!value) throw new Error("formweave fields must be rendered inside <Form>.");
  return value;
};

/**
 * Reads the derived state of one field and re-renders only when it changes.
 *
 * @param key - The field key.
 * @returns The field's state, or `undefined` for an unknown key.
 * @since 0.2.0
 */
export function useFieldState(key: string): FieldState | undefined {
  const { store } = useFormweave();
  const get = useCallback(() => store.get().fields[key], [store, key]);
  return useSyncExternalStore(store.subscribe, get, get);
}

/**
 * Renders a form document: validation, conditions, steps and submission.
 *
 * State lives in React Hook Form; logic lives in `@formweave/engine`. Each
 * field subscribes only to its own value and state, so typing in one field
 * does not re-render the others.
 *
 * @param props - See {@link FormProps}.
 * @returns The form element.
 * @example
 * ```tsx
 * import { Form, createRenderers } from "@formweave/react";
 * import { basicRenderers } from "@formweave/react/fields";
 * import { createRegistry } from "@formweave/engine";
 * import { allFields } from "@formweave/engine/fields/all";
 * import "@formweave/react/styles.css";
 *
 * <Form
 *   schema={doc}
 *   registry={createRegistry(allFields)}
 *   renderers={createRenderers(basicRenderers)}
 *   onSubmit={(data) => fetch("/api/answers", { method: "POST", body: JSON.stringify(data) })}
 * />;
 * ```
 * @since 0.2.0
 */
export function Form(props: FormProps): ReactNode {
  const { schema, registry, renderers, onSubmit } = props;
  const locale = props.locale ?? schema.locales.default;
  const language = locale.split("-")[0] ?? locale;
  const messages = props.messages ?? (language === "fa" ? fa : en);
  const digits = props.digits ?? "native";
  const labels = { ...(LABELS[language] ?? LABELS.en), ...props.labels } as FormLabels;
  const idPrefix = useId();

  const form = useMemo(() => compile(schema, { registry }), [schema, registry]);
  const initial = useMemo(
    () => ({ ...form.defaults, ...props.defaultValues }),
    // Starting values are read once per compiled form.
    [form],
  );
  const store = useMemo(() => createStateStore(form, initial), [form, initial]);

  const resolver = useCallback<Resolver<Values>>(
    (values, _context, options) => {
      const result = validate(form, values, { state: store.get() });
      if (result.success) return { values: { ...result.data }, errors: {} };
      const names = options.names ? new Set<string>(options.names) : undefined;
      const errors: FieldErrors<Values> = {};
      for (const issue of result.issues) {
        if (names && !names.has(issue.key)) continue;
        errors[issue.key] = {
          type: issue.code,
          message: formatIssue(issue, messages, locale, digits),
        };
      }
      if (names && Object.keys(errors).length === 0) return { values, errors: {} };
      return { values: {}, errors };
    },
    [form, store, messages, locale, digits],
  );

  const methods = useForm<Values>({ defaultValues: initial, resolver, mode: "onTouched" });

  const onChangeRef = useRef(props.onChange);
  useEffect(() => {
    onChangeRef.current = props.onChange;
  });

  useEffect(() => {
    const sub = methods.watch((values, { name }) => {
      store.update(values, name ? [name] : undefined);
      onChangeRef.current?.(values, name);
    });
    return () => {
      sub.unsubscribe();
    };
  }, [methods, store]);

  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const layout = props.layout ?? "classic";
  const fallback = schema.locales.default;
  const visibleSteps = form.steps.filter((s) => state.steps[s.key]?.visible);
  const pages = visibleSteps.flatMap((step) => {
    const top = step.fields.filter(
      (k) => form.fields.get(k)?.parent === undefined && state.fields[k]?.visible,
    );
    const within = (root: string): string[] =>
      step.fields.filter((k) => {
        let f = form.fields.get(k);
        while (f) {
          if (f.key === root) return state.fields[k]?.visible === true;
          f = f.parent === undefined ? undefined : form.fields.get(f.parent);
        }
        return false;
      });
    if (layout === "focus") {
      return top.map((k) => ({ step: step.key, fields: [k], check: within(k) }));
    }
    return [
      { step: step.key, fields: top, check: step.fields.filter((k) => state.fields[k]?.visible) },
    ];
  });
  const [pageIndex, setPageIndex] = useState(0);
  const index = Math.max(0, Math.min(pageIndex, pages.length - 1));
  const page = pages[index];
  const isLast = index >= pages.length - 1;
  const stepDef = schema.steps.find((s) => s.key === page?.step);
  const stepIndex = visibleSteps.findIndex((s) => s.key === page?.step);
  const firstOfStep = pages.findIndex((p) => p.step === page?.step) === index;

  const next = async (): Promise<void> => {
    if (!page) return;
    if (await methods.trigger(page.check, { shouldFocus: true })) setPageIndex(index + 1);
  };

  const ctx = useMemo<FormweaveContextValue>(
    () => ({ form, store, renderers, locale, fallback, idPrefix }),
    [form, store, renderers, locale, fallback, idPrefix],
  );

  const showStepHeading = layout === "classic" || firstOfStep;
  const progress = pages.length ? Math.round(((index + 1) / pages.length) * 100) : 0;

  return (
    <Ctx.Provider value={ctx}>
      <FormProvider {...methods}>
        <form
          className={props.className ?? "fw-form"}
          data-layout={layout}
          dir={isRtl(locale) ? "rtl" : "ltr"}
          lang={locale}
          noValidate
          onSubmit={(e) => {
            if (props.actions === false) {
              e.preventDefault();
              return;
            }
            if (!isLast) {
              e.preventDefault();
              void next();
              return;
            }
            void methods.handleSubmit((data) => onSubmit?.(data))(e);
          }}
        >
          {layout === "focus" ? (
            <div className="fw-progress">
              <div
                className="fw-progress-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={resolveText(schema.title, locale, fallback)}
              >
                <span style={{ inlineSize: `${String(progress)}%` }} />
              </div>
              <span className="fw-counter">
                {localizeDigits(
                  labels.question
                    .replace("{n}", String(index + 1))
                    .replace("{total}", String(pages.length)),
                  digits === "native" ? locale : "en",
                )}
              </span>
            </div>
          ) : (
            visibleSteps.length > 1 && (
              <ol className="fw-steps" aria-label={resolveText(schema.title, locale, fallback)}>
                {visibleSteps.map((s, i) => (
                  <li
                    key={s.key}
                    data-state={i < stepIndex ? "done" : i === stepIndex ? "current" : "todo"}
                    aria-current={i === stepIndex ? "step" : undefined}
                  >
                    {resolveText(
                      schema.steps.find((d) => d.key === s.key)?.title,
                      locale,
                      fallback,
                    )}
                  </li>
                ))}
              </ol>
            )
          )}
          {showStepHeading && stepDef?.title !== undefined && (
            <h2 className="fw-step-title">{resolveText(stepDef.title, locale, fallback)}</h2>
          )}
          {showStepHeading && stepDef?.description !== undefined && (
            <p className="fw-step-description">
              {resolveText(stepDef.description, locale, fallback)}
            </p>
          )}
          <div className="fw-fields">
            {page?.fields.map((k) => (
              <Field key={k} fieldKey={k} />
            ))}
          </div>
          {props.actions !== false && (
            <div className="fw-actions">
              {index > 0 && (
                <button
                  type="button"
                  className="fw-button"
                  onClick={() => {
                    setPageIndex(index - 1);
                  }}
                >
                  {labels.back}
                </button>
              )}
              <button type="submit" className="fw-button fw-button-primary">
                {isLast ? labels.submit : layout === "focus" ? labels.ok : labels.next}
              </button>
            </div>
          )}
        </form>
      </FormProvider>
    </Ctx.Provider>
  );
}

/**
 * Props of {@link Field}.
 *
 * @since 0.2.0
 */
export interface FieldProps {
  /** Key of the field to render. */
  readonly fieldKey: string;
}

/**
 * Renders one field of the surrounding {@link Form} with its registered
 * renderer. Renders nothing while the field is hidden. Useful for custom
 * layouts that place fields by hand.
 *
 * @param props - See {@link FieldProps}.
 * @returns The field, or `null`.
 * @since 0.2.0
 */
export function Field({ fieldKey }: FieldProps): ReactNode {
  const { form, renderers, locale, fallback, idPrefix } = useFormweave();
  const state = useFieldState(fieldKey);
  const field = form.fields.get(fieldKey);
  if (!field || !state?.visible) return null;
  const Renderer = renderers.get(field.node.type);
  if (!Renderer) throw new Error(`No renderer for field type "${field.node.type}".`);
  const id = `${idPrefix}-${fieldKey}`;
  const text = {
    label: resolveText(field.node.label, locale, fallback),
    help: resolveText(field.node.help, locale, fallback),
    placeholder: resolveText(field.node.placeholder, locale, fallback),
  };
  if (field.definition.container) {
    const children = form.order
      .filter((k) => form.fields.get(k)?.parent === fieldKey)
      .map((k) => <Field key={k} fieldKey={k} />);
    return (
      <Renderer
        field={field}
        state={state}
        locale={locale}
        fallbackLocale={fallback}
        id={id}
        name={fieldKey}
        {...text}
        error={undefined}
        describedBy={`${id}-desc`}
        value={undefined}
        onChange={() => undefined}
        onBlur={() => undefined}
        inputRef={null}
      >
        {children}
      </Renderer>
    );
  }
  return (
    <ControlledField fieldKey={fieldKey} id={id} text={text} state={state} Renderer={Renderer} />
  );
}

function ControlledField(p: {
  fieldKey: string;
  id: string;
  text: { label: string; help: string; placeholder: string };
  state: FieldState;
  Renderer: NonNullable<ReturnType<RendererMap["get"]>>;
}): ReactNode {
  const { form, locale, fallback } = useFormweave();
  const { control } = useFormContext();
  const { field: rhf, fieldState } = useController({ name: p.fieldKey, control });
  const field = form.fields.get(p.fieldKey);
  if (!field) return null;
  const { Renderer } = p;
  return (
    <Renderer
      field={field}
      state={p.state}
      locale={locale}
      fallbackLocale={fallback}
      id={p.id}
      name={p.fieldKey}
      {...p.text}
      error={fieldState.error?.message}
      describedBy={`${p.id}-desc`}
      value={rhf.value as unknown}
      onChange={rhf.onChange}
      onBlur={rhf.onBlur}
      inputRef={rhf.ref}
    />
  );
}
