import { BookOpen, FileText, Heart, LayoutTemplate } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { LocaleSwitch } from "@/features/switch-locale";
import { Logo } from "@/shared/ui";

/** Sidebar, top bar and credit line around every app page. */
export async function AppShell({
  crumbs,
  children,
}: {
  crumbs: readonly string[];
  children: ReactNode;
}) {
  const t = await getTranslations("nav");
  const tb = await getTranslations("brand");
  const nav = [
    { href: "/forms", icon: FileText, label: t("forms"), on: true },
    { href: "/forms", icon: LayoutTemplate, label: t("templates"), on: false },
  ];
  return (
    <div className="grid min-h-screen md:grid-cols-[252px_1fr]">
      <aside className="flex flex-col gap-0.5 px-3 pt-4 pb-3.5">
        <Link href="/forms" className="px-1.5 pb-3.5">
          <Logo />
        </Link>
        <p className="px-2 pt-3 pb-1.5 text-[11px] font-medium tracking-wide text-ink-3 uppercase">
          {t("mainMenu")}
        </p>
        {nav.map((n) => (
          <Link
            key={n.label}
            href={n.href}
            aria-current={n.on ? "page" : undefined}
            className="flex h-[34px] items-center gap-2.5 rounded-[9px] px-2.5 text-[13px] text-ink-2 aria-[current=page]:border aria-[current=page]:border-line aria-[current=page]:bg-surface aria-[current=page]:font-medium aria-[current=page]:text-primary-fg aria-[current=page]:shadow-xs"
          >
            <n.icon size={16} aria-hidden />
            {n.label}
          </Link>
        ))}
        <p className="px-2 pt-3 pb-1.5 text-[11px] font-medium tracking-wide text-ink-3 uppercase">
          {t("support")}
        </p>
        <a
          href="https://github.com/ali-moradi-design/form-builder"
          className="flex h-[34px] items-center gap-2.5 rounded-[9px] px-2.5 text-[13px] text-ink-2"
        >
          <BookOpen size={16} aria-hidden />
          {t("docs")}
        </a>
        <p className="mt-auto flex items-center justify-center gap-1.5 pt-6 text-xs text-ink-3">
          {tb.rich("credit", {
            heart: () => (
              <Heart size={13} className="fill-carmine text-carmine" aria-label="love" />
            ),
          })}
        </p>
      </aside>
      <div className="flex min-w-0 flex-col gap-3.5 px-4 pt-3 pb-4 md:ps-1">
        <header className="flex h-11 items-center gap-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-ink-2">
            {crumbs.map((c, i) =>
              i === crumbs.length - 1 ? (
                <span
                  key={c}
                  aria-current="page"
                  className="rounded-lg border border-line bg-surface px-2.5 py-1 font-medium text-primary-fg shadow-xs"
                >
                  {c}
                </span>
              ) : (
                <span key={c} className="flex items-center gap-2">
                  {c}
                  <span className="text-ink-3">/</span>
                </span>
              ),
            )}
          </nav>
          <div className="grow" />
          <LocaleSwitch />
        </header>
        <main className="flex min-w-0 flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}
