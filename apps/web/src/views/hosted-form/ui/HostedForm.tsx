"use client";

import { isRtl, resolveText } from "@formweave/engine/i18n";
import { Form, type Values } from "@formweave/react";
import type { FormDocument, Locale } from "@formweave/schema";
import { CircleCheck, Heart, Languages, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { registry, renderers, uploadTo } from "@/shared/formweave";
import { cn } from "@/shared/lib";
import { Button, LogoMark } from "@/shared/ui";

/** Result of submitting, as returned by the server. */
export type SubmitResult = { readonly ok: true } | { readonly ok: false; readonly reason: string };

const LANGUAGE_NAMES: Readonly<Record<string, string>> = { en: "English", fa: "فارسی" };

/** A published form on its own page, one question at a time. */
export function HostedForm({
  slug,
  document,
  initialLocale,
  defaultValues,
  submit,
  embed = false,
  demo = false,
}: {
  slug: string;
  document: FormDocument;
  initialLocale: Locale;
  defaultValues?: Readonly<Values>;
  submit: (slug: string, values: Values, locale: string, honeypot: string) => Promise<SubmitResult>;
  /** Shown in a frame on another site: no page chrome, and the height is sent to the parent. */
  embed?: boolean;
  /** A form of the shared demo account: shows a warning not to enter real data. */
  demo?: boolean;
}) {
  const t = useTranslations("hosted");
  const tb = useTranslations("brand");
  const supported = document.locales.supported ?? [document.locales.default];
  const [locale, setLocale] = useState(initialLocale);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState<string | false>(false);
  const [round, setRound] = useState(0);
  const trap = useRef<HTMLInputElement>(null);
  const [upload] = useState(() => uploadTo(slug));
  const next = supported[(supported.indexOf(locale) + 1) % supported.length] ?? locale;
  const dir = isRtl(locale) ? "rtl" : "ltr";
  const root = useRef<HTMLDivElement>(null);

  // Tell the embedding page how tall the form is, so its frame can fit.
  useEffect(() => {
    const el = root.current;
    if (!embed || !el || window.parent === window) return;
    const post = () => {
      window.parent.postMessage(
        { type: "formweave:height", slug, height: el.getBoundingClientRect().height },
        "*",
      );
    };
    const observer = new ResizeObserver(post);
    observer.observe(el);
    post();
    return () => {
      observer.disconnect();
    };
  }, [embed, slug]);
  useEffect(() => {
    if (embed && done && window.parent !== window)
      window.parent.postMessage({ type: "formweave:submitted", slug }, "*");
  }, [embed, done, slug]);

  return (
    <div
      ref={root}
      dir={dir}
      lang={locale}
      data-embed={embed ? "" : undefined}
      className={
        embed
          ? "relative flex flex-col"
          : "relative flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(40%_35%_at_85%_20%,color-mix(in_oklab,var(--amber)_16%,transparent),transparent),radial-gradient(35%_40%_at_10%_90%,color-mix(in_oklab,var(--plum)_12%,transparent),transparent)]"
      }
    >
      {demo && (
        <p
          role="note"
          className="flex items-center justify-center gap-2 bg-carmine px-4 py-2 text-center text-[13px] font-medium text-white"
        >
          <TriangleAlert size={15} aria-hidden className="shrink-0" />
          {t("demoWarning")}
        </p>
      )}
      <header
        className={
          embed ? "flex items-center gap-3 px-4 pt-4" : "flex items-center gap-3 px-6 py-5 sm:px-10"
        }
      >
        {!embed && <LogoMark size={34} />}
        <h1 className="grow truncate text-base font-medium">
          {resolveText(document.title, locale, document.locales.default)}
        </h1>
        {supported.length > 1 && (
          <Button
            onClick={() => {
              setLocale(next);
            }}
          >
            <Languages size={16} aria-hidden />
            <span lang={next}>{LANGUAGE_NAMES[next] ?? next}</span>
          </Button>
        )}
      </header>
      <main
        className={
          embed
            ? "flex w-full flex-col px-4 py-4"
            : "mx-auto flex w-full max-w-[720px] grow flex-col justify-center px-6 py-8"
        }
      >
        {done ? (
          <div className="grid justify-items-start gap-3" role="status">
            <CircleCheck size={40} className="text-primary-fg" aria-hidden />
            <h2 className="text-3xl font-semibold tracking-tight">{t("thanks")}</h2>
            <p className="text-ink-2">{t("sent")}</p>
            <Button
              onClick={() => {
                setDone(false);
                setRound((r) => r + 1);
              }}
            >
              {t("again")}
            </Button>
          </div>
        ) : (
          <>
            <Form
              key={`${locale}-${String(round)}`}
              schema={document}
              registry={registry}
              renderers={renderers}
              locale={locale}
              layout="focus"
              defaultValues={defaultValues}
              className="fw-form fw-hosted"
              upload={upload}
              onSubmit={async (values) => {
                setFailed(false);
                const result = await submit(slug, values, locale, trap.current?.value ?? "");
                if (result.ok) setDone(true);
                else setFailed(result.reason);
              }}
            />
            {/* Honeypot: hidden from people and screen readers; bots tend to fill it. */}
            <input
              ref={trap}
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute -start-[9999px] size-px opacity-0"
            />
            {failed && (
              <p role="alert" className="mt-4 text-[13px] text-carmine dark:text-[#e2566b]">
                {t(failed === "rateLimited" ? "slowDown" : "failed")}
              </p>
            )}
          </>
        )}
      </main>
      <footer
        className={cn(
          "flex items-center justify-center gap-1.5 text-xs text-ink-3",
          embed ? "pb-3" : "pb-6",
        )}
      >
        {tb.rich("credit", {
          heart: () => <Heart size={13} className="fill-carmine text-carmine" aria-label="love" />,
        })}
      </footer>
    </div>
  );
}
