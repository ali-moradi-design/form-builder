import { createRegistry, type FieldRegistry } from "@formweave/engine";
import { allFields } from "@formweave/engine/fields/all";
import type { FormDocument } from "@formweave/schema";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { allRenderers } from "./fields/index.js";
import { Form as LocalForm, type FormProps, type Values } from "./Form.js";
import { createRenderers, type RendererMap, type UploadFile } from "./renderers.js";

/**
 * Props of the remote {@link Form}: the props of the local form without the
 * document, plus where to load it from.
 *
 * @since 0.7.0
 */
export interface RemoteFormProps extends Omit<
  FormProps,
  "schema" | "registry" | "renderers" | "onSubmit" | "upload"
> {
  /** The form's link name (slug), as in `/f/<slug>`. */
  readonly formId: string;
  /**
   * Address of the formweave app, without a trailing slash.
   *
   * @defaultValue `""` (the same site)
   */
  readonly endpoint?: string | undefined;
  /**
   * Field types the form may use.
   *
   * @defaultValue every built-in type
   */
  readonly registry?: FieldRegistry | undefined;
  /**
   * Renderers for the field types.
   *
   * @defaultValue every built-in renderer
   */
  readonly renderers?: RendererMap | undefined;
  /**
   * Called after the server stored the answers.
   *
   * @param result - The new response's id and the form version it used.
   */
  readonly onSubmitted?:
    ((result: { id: string | null; version: number | null }) => void) | undefined;
  /** Shown while the form loads. */
  readonly loading?: ReactNode;
  /** Shown after a successful submission. */
  readonly done?: ReactNode;
}

const TEXT = {
  en: {
    loading: "Loading the form…",
    missing: "This form is not available.",
    failed: "Your answers could not be sent. Try again.",
    done: "Thank you! Your answers were sent.",
  },
  fa: {
    loading: "در حال بارگذاری فرم…",
    missing: "این فرم در دسترس نیست.",
    failed: "پاسخ‌ها فرستاده نشد. دوباره امتحان کنید.",
    done: "سپاس! پاسخ‌های شما فرستاده شد.",
  },
} as const;

let defaults: { registry: FieldRegistry; renderers: RendererMap } | undefined;
const builtIns = () =>
  (defaults ??= {
    registry: createRegistry(allFields),
    renderers: createRenderers(allRenderers),
  });

/** Uploads to the app's upload API with progress. */
function uploader(base: string): UploadFile {
  return (file, { field, onProgress }) =>
    new Promise((resolve, reject) => {
      const body = new FormData();
      body.append("file", file, file.name ?? "file");
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${base}/uploads?field=${encodeURIComponent(field)}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded / e.total);
      };
      xhr.onload = () => {
        if (xhr.status === 201)
          resolve(JSON.parse(xhr.responseText) as Awaited<ReturnType<UploadFile>>);
        else reject(new Error(`Upload failed (${String(xhr.status)}).`));
      };
      xhr.onerror = () => {
        reject(new Error("Upload failed."));
      };
      xhr.send(body);
    });
}

/**
 * A published formweave form, loaded from the app's API by its link name.
 * Answers are validated in the browser, sent to the API and validated again
 * there; files go to the upload API.
 *
 * @param props - See {@link RemoteFormProps}.
 * @returns The form, or a loading or error message.
 * @example
 * ```tsx
 * import { Form } from "@formweave/react/remote";
 * import "@formweave/react/styles.css";
 *
 * <Form formId="product-feedback" endpoint="https://forms.example.com" />;
 * ```
 * @since 0.7.0
 */
export function Form(props: RemoteFormProps): ReactNode {
  const { formId, endpoint = "", onSubmitted, loading, done, ...rest } = props;
  const base = `${endpoint}/api/forms/${encodeURIComponent(formId)}`;
  const [doc, setDoc] = useState<FormDocument | null | "missing">(null);
  const [state, setState] = useState<"idle" | "failed" | "done">("idle");
  const upload = useMemo(() => uploader(base), [base]);
  const locale = props.locale ?? (doc && doc !== "missing" ? doc.locales.default : "en");
  const text = locale.startsWith("fa") ? TEXT.fa : TEXT.en;

  useEffect(() => {
    let live = true;
    setDoc(null);
    fetch(base)
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ document: FormDocument }>)
          : Promise.reject(new Error(r.statusText)),
      )
      .then(
        (body) => {
          if (live) setDoc(body.document);
        },
        () => {
          if (live) setDoc("missing");
        },
      );
    return () => {
      live = false;
    };
  }, [base]);

  if (doc === null) return loading ?? <p className="fw-help">{text.loading}</p>;
  if (doc === "missing") return <p className="fw-error">{text.missing}</p>;
  if (state === "done")
    return (
      done ?? (
        <p className="fw-help" role="status">
          {text.done}
        </p>
      )
    );
  const registry = props.registry ?? builtIns().registry;
  const renderers = props.renderers ?? builtIns().renderers;
  const submit = async (values: Readonly<Values>) => {
    setState("idle");
    const r = await fetch(`${base}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values, locale }),
    });
    if (r.status !== 201) {
      setState("failed");
      return;
    }
    const result = (await r.json()) as { id: string | null; version: number | null };
    setState("done");
    onSubmitted?.(result);
  };
  return (
    <>
      <LocalForm
        {...rest}
        schema={doc}
        registry={registry}
        renderers={renderers}
        upload={upload}
        onSubmit={submit}
      />
      {state === "failed" && (
        <p className="fw-error" role="alert">
          {text.failed}
        </p>
      )}
    </>
  );
}
