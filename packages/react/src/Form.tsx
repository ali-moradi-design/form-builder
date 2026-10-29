import {
  calculateValues,
  compile,
  validate,
  type CompiledForm,
  type FieldRegistry,
  type FieldState,
} from "@formcanvas/engine";
import { isRtl, localizeDigits, resolveText, type DigitStyle } from "@formcanvas/engine/i18n";
import { en, fa, formatIssue, type MessageCatalog } from "@formcanvas/engine/messages";
import type { FormDocument, Locale } from "@formcanvas/schema";
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
  useFieldArray,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import type { RendererMap, RowsApi, UploadFile } from "./renderers.js";
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
  /**
   * Extra class names for the `<form>` element. They are added to `fc-form`,
   * which the default stylesheet needs.
   */
  readonly className?: string | undefined;
  /**
   * Colour theme of the default stylesheet. `"system"` follows the operating
   * system. Without it the form follows an ancestor's `data-theme` of
   * `"light"` or `"dark"` (for example `<html data-theme>`), and otherwise
   * the operating system. Set it when the page nests both themes.
   *
   * @since 0.7.0
   */
  readonly theme?: "light" | "dark" | "system" | undefined;
  /**
   * Stores files for file, image and signature fields. Without it those
   * fields say that uploads are not available.
   *
   * @since 0.6.0
   */
  readonly upload?: UploadFile | undefined;
}

interface FormcanvasContextValue {
  readonly form: CompiledForm;
  readonly store: StateStore;
  readonly renderers: RendererMap;
  readonly locale: Locale;
  readonly fallback: Locale;
  readonly idPrefix: string;
  /** Prefix of value names: `""` at the top, `"people.0."` inside a row. */
  readonly prefix: string;
  readonly upload: UploadFile | undefined;
}

/**
 * Writes calculated results into the form values where they differ, so
 * renderers show them and submissions carry them. Setting a value runs the
 * watcher again, which then finds nothing left to change.
 */
const syncCalculated = (
  form: CompiledForm,
  values: Readonly<Record<string, unknown>>,
  prefix: string,
  setValue: (name: string, value: unknown) => void,
): void => {
  if (form.calculated.length === 0) return;
  const next = calculateValues(form, values);
  for (const key of form.calculated) {
    if (!Object.is(next[key], values[key])) setValue(prefix + key, next[key]);
  }
};

/** Reads a value at a dot path such as `people.0.name`. */
const getPath = (obj: unknown, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (o, k) =>
        o !== null && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined,
      obj,
    );

/** Writes a value at a dot path, creating objects on the way. */
const setPath = (obj: Record<string, unknown>, path: string, value: unknown): void => {
  const parts = path.split(".");
  const last = parts.pop() ?? path;
  let o = obj;
  for (const k of parts) {
    const next = o[k];
    o = (next !== null && typeof next === "object" ? next : (o[k] = {})) as Record<string, unknown>;
  }
  o[last] = value;
};

/** Field types that have nothing to answer in the focus layout. */
const NO_PAGE = new Set(["hidden", "divider"]);

const Ctx = createContext<FormcanvasContextValue | null>(null);

const useFormcanvas = (): FormcanvasContextValue => {
  const value = useContext(Ctx);
  if (!value) throw new Error("formcanvas fields must be rendered inside <Form>.");
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
  const { store } = useFormcanvas();
  const get = useCallback(() => store.get().fields[key], [store, key]);
  return useSyncExternalStore(store.subscribe, get, get);
}

/**
 * Renders a form document: validation, conditions, steps and submission.
 *
 * State lives in React Hook Form; logic lives in `@formcanvas/engine`. Each
 * field subscribes only to its own value and state, so typing in one field
 * does not re-render the others.
 *
 * @param props - See {@link FormProps}.
 * @returns The form element.
 * @example
 * ```tsx
 * import { Form, createRenderers } from "@formcanvas/react";
 * import { basicRenderers } from "@formcanvas/react/fields";
 * import { createRegistry } from "@formcanvas/engine";
 * import { allFields } from "@formcanvas/engine/fields/all";
 * import "@formcanvas/react/styles.css";
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
    () => calculateValues(form, { ...form.defaults, ...props.defaultValues }),
    // Starting values are read once per compiled form.
    [form],
  );
  const store = useMemo(() => createStateStore(form, initial), [form, initial]);

  const resolver = useCallback<Resolver<Values>>(
    (values, _context, options) => {
      const result = validate(form, values, { state: store.get() });
      if (result.success) return { values: { ...result.data }, errors: {} };
      const names = options.names;
      const errors: FieldErrors<Values> = {};
      for (const issue of result.issues) {
        // A name also covers the rows inside it ("people" covers "people.0.name").
        if (names && !names.some((n) => issue.key === n || issue.key.startsWith(`${n}.`))) continue;
        setPath(errors, issue.key, {
          type: issue.code,
          message: formatIssue(issue, messages, locale, digits),
        });
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
      // A change inside a row ("people.0.name") changes the row field "people".
      store.update(values, name ? [name.split(".")[0] ?? name] : undefined);
      syncCalculated(form, values, "", methods.setValue);
      onChangeRef.current?.(values, name);
    });
    return () => {
      sub.unsubscribe();
    };
  }, [methods, store, form]);

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
      // Hidden fields and dividers never get a page of their own.
      return top
        .filter((k) => !NO_PAGE.has(form.fields.get(k)?.node.type ?? ""))
        .map((k) => ({ step: step.key, fields: [k], check: within(k) }));
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

  const ctx = useMemo<FormcanvasContextValue>(
    () => ({
      form,
      store,
      renderers,
      locale,
      fallback,
      idPrefix,
      prefix: "",
      upload: props.upload,
    }),
    [form, store, renderers, locale, fallback, idPrefix, props.upload],
  );

  const showStepHeading = layout === "classic" || firstOfStep;
  const progress = pages.length ? Math.round(((index + 1) / pages.length) * 100) : 0;

  return (
    <Ctx.Provider value={ctx}>
      <FormProvider {...methods}>
        <form
          className={props.className ? `fc-form ${props.className}` : "fc-form"}
          data-theme={props.theme}
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
            <div className="fc-progress">
              <div
                className="fc-progress-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={resolveText(schema.title, locale, fallback)}
              >
                <span style={{ inlineSize: `${String(progress)}%` }} />
              </div>
              <span className="fc-counter">
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
              <ol className="fc-steps" aria-label={resolveText(schema.title, locale, fallback)}>
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
            <h2 className="fc-step-title">{resolveText(stepDef.title, locale, fallback)}</h2>
          )}
          {showStepHeading && stepDef?.description !== undefined && (
            <p className="fc-step-description">
              {resolveText(stepDef.description, locale, fallback)}
            </p>
          )}
          <div className="fc-fields">
            {page?.fields.map((k) => (
              <Field key={k} fieldKey={k} />
            ))}
          </div>
          {props.actions !== false && (
            <div className="fc-actions">
              {index > 0 && (
                <button
                  type="button"
                  className="fc-button"
                  onClick={() => {
                    setPageIndex(index - 1);
                  }}
                >
                  {labels.back}
                </button>
              )}
              <button type="submit" className="fc-button fc-button-primary">
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
  const { form, renderers, locale, fallback, idPrefix, prefix } = useFormcanvas();
  const state = useFieldState(fieldKey);
  const field = form.fields.get(fieldKey);
  if (!field || !state?.visible) return null;
  const Renderer = renderers.get(field.node.type);
  if (!Renderer) throw new Error(`No renderer for field type "${field.node.type}".`);
  const name = prefix + fieldKey;
  // Dots in row names ("people.0.name") would break `#id` selectors.
  const id = `${idPrefix}-${name.replaceAll(".", "-")}`;
  const text = {
    label: resolveText(field.node.label, locale, fallback),
    help: resolveText(field.node.help, locale, fallback),
    placeholder: resolveText(field.node.placeholder, locale, fallback),
  };
  if (field.rows) {
    return <RowsField name={name} id={id} text={text} state={state} Renderer={Renderer} />;
  }
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
    <ControlledField
      fieldKey={fieldKey}
      name={name}
      id={id}
      text={text}
      state={state}
      Renderer={Renderer}
    />
  );
}

type Renderer = NonNullable<ReturnType<RendererMap["get"]>>;

/** A row type such as a repeater: its rows live in a React Hook Form field array. */
function RowsField(p: {
  name: string;
  id: string;
  text: { label: string; help: string; placeholder: string };
  state: FieldState;
  Renderer: Renderer;
}): ReactNode {
  const ctx = useFormcanvas();
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name: p.name });
  const { errors } = useFormState({ control, name: p.name });
  const field = ctx.form.fields.get(p.name.slice(ctx.prefix.length));
  const sub = field?.rows;
  if (!field || !sub) return null;
  const settings = field.settings as { minRows?: number; maxRows?: number };
  const max = settings.maxRows ?? 10;
  const own = getPath(errors, p.name) as { message?: unknown } | undefined;
  const rows: RowsApi = {
    keys: fields.map((f) => f.id),
    max,
    canAdd: !p.state.disabled && fields.length < max,
    canRemove: !p.state.disabled && fields.length > (settings.minRows ?? 0),
    add: () => {
      append({ ...sub.defaults });
    },
    remove,
    move,
    render: (index) => <RowScope ctx={ctx} form={sub} prefix={`${p.name}.${String(index)}.`} />,
  };
  const { Renderer } = p;
  return (
    <Renderer
      field={field}
      state={p.state}
      locale={ctx.locale}
      fallbackLocale={ctx.fallback}
      id={p.id}
      name={p.name}
      {...p.text}
      error={typeof own?.message === "string" ? own.message : undefined}
      describedBy={`${p.id}-desc`}
      value={undefined}
      onChange={() => undefined}
      onBlur={() => undefined}
      inputRef={null}
      rows={rows}
    />
  );
}

/** The fields of one row, with their own state from that row's values. */
function RowScope(p: {
  ctx: FormcanvasContextValue;
  form: CompiledForm;
  prefix: string;
}): ReactNode {
  const { control } = useFormContext();
  const path = p.prefix.slice(0, -1);
  const values = useWatch({ control, name: path }) as Readonly<Record<string, unknown>> | undefined;
  const { setValue } = useFormContext();
  const [store] = useState(() => createStateStore(p.form, values ?? {}));
  useEffect(() => {
    store.update(values ?? {});
    syncCalculated(p.form, values ?? {}, p.prefix, setValue);
  }, [store, values, p.form, p.prefix, setValue]);
  const value = useMemo<FormcanvasContextValue>(
    () => ({ ...p.ctx, form: p.form, store, prefix: p.prefix }),
    [p.ctx, p.form, store, p.prefix],
  );
  return (
    <Ctx.Provider value={value}>
      <div className="fc-fields">
        {p.form.order
          .filter((k) => p.form.fields.get(k)?.parent === undefined)
          .map((k) => (
            <Field key={k} fieldKey={k} />
          ))}
      </div>
    </Ctx.Provider>
  );
}

function ControlledField(p: {
  fieldKey: string;
  name: string;
  id: string;
  text: { label: string; help: string; placeholder: string };
  state: FieldState;
  Renderer: NonNullable<ReturnType<RendererMap["get"]>>;
}): ReactNode {
  const { form, locale, fallback, upload } = useFormcanvas();
  const { control } = useFormContext();
  const { field: rhf, fieldState } = useController({ name: p.name, control });
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
      name={p.name}
      {...p.text}
      error={fieldState.error?.message}
      describedBy={`${p.id}-desc`}
      value={rhf.value as unknown}
      onChange={rhf.onChange}
      onBlur={rhf.onBlur}
      inputRef={rhf.ref}
      upload={upload}
    />
  );
}
