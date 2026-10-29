"use client";

import Editor from "@monaco-editor/react";
import type * as MonacoApi from "monaco-editor";
import schema from "@formcanvas/schema/schema.json";
import type { FormDocument } from "@formcanvas/schema";
import { AlertCircle, Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useSyncExternalStore } from "react";
import { useBuilder, useBuilderApi } from "../model/context";
import { formatPath, readJson, toJson } from "../model/json";

const SCHEMA_URI = "https://github.com/ali-moradi-design/form-builder/schema/form-document.json";

const darkQuery = "(prefers-color-scheme: dark)";
function subscribeDark(listener: () => void): () => void {
  const media = window.matchMedia(darkQuery);
  media.addEventListener("change", listener);
  return () => {
    media.removeEventListener("change", listener);
  };
}

function setupMonaco(monaco: typeof MonacoApi): void {
  monaco.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    enableSchemaRequest: false,
    schemas: [{ uri: SCHEMA_URI, fileMatch: ["*"], schema }],
  });
}

/**
 * Two-way JSON editor: a valid edit updates the canvas right away; a change
 * made elsewhere (canvas, settings, undo) replaces the text.
 */
export function JsonPanel() {
  const t = useTranslations("builder");
  const doc = useBuilder((s) => s.doc);
  const { store } = useBuilderApi();
  const dark = useSyncExternalStore(
    subscribeDark,
    () => window.matchMedia(darkQuery).matches,
    () => false,
  );
  const own = useRef<FormDocument | null>(null);
  const [state, setState] = useState(() => ({ text: toJson(doc), doc }));
  // A document change that did not come from this editor resets the text.
  if (state.doc !== doc && doc !== own.current) setState({ text: toJson(doc), doc });
  const read = readJson(state.text);

  return (
    <section aria-label={t("json")} className="flex h-full min-h-[420px] flex-col" data-own-undo="">
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 className="text-[15px] font-semibold">{t("jsonTitle")}</h2>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] text-ink-2">
          {t("twoWay")}
        </span>
        <button
          type="button"
          aria-label={t("copy")}
          title={t("copy")}
          onClick={() => {
            void navigator.clipboard.writeText(state.text);
          }}
          className="ms-auto grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-surface-2 focus-visible:outline-3 focus-visible:outline-primary-soft"
        >
          <Copy size={15} aria-hidden />
        </button>
      </div>
      <div className="min-h-0 grow border-y border-line" dir="ltr">
        <Editor
          language="json"
          path="form.json"
          value={state.text}
          theme={dark ? "vs-dark" : "light"}
          beforeMount={setupMonaco}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            ariaLabel: t("jsonTitle"),
          }}
          onChange={(text) => {
            if (text === undefined) return;
            const result = readJson(text);
            if (result.kind === "ok") {
              store.getState().edit(() => result.doc, "json");
              own.current = store.getState().doc;
              setState({ text, doc: own.current });
            } else {
              setState((s) => ({ ...s, text }));
            }
          }}
        />
      </div>
      <p role="status" className="flex items-start gap-1.5 px-4 py-2.5 text-[12.5px]" dir="auto">
        {read.kind === "ok" ? (
          <>
            <Check size={14} className="mt-0.5 shrink-0 text-primary-fg" aria-hidden />
            <span className="font-medium text-primary-fg">{t("validSchema")}</span>
            <span className="text-ink-3">{t("synced")}</span>
          </>
        ) : (
          <>
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-carmine" aria-hidden />
            <span className="text-ink-2">
              {read.kind === "syntax"
                ? t("jsonSyntax", { message: read.message })
                : read.issues
                    .slice(0, 3)
                    .map((i) => `${formatPath(i.path)}: ${i.message}`)
                    .join(" · ")}
            </span>
          </>
        )}
      </p>
    </section>
  );
}
