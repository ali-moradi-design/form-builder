import { Heart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { SignInForm } from "@/features/session";
import { LocaleSwitch } from "@/features/switch-locale";
import { getUser } from "@/shared/auth";
import { Logo } from "@/shared/ui";

/** Sign in, create an account, or open the demo. */
export async function SignInPage() {
  if (await getUser()) redirect("/forms");
  const t = await getTranslations("auth");
  const tb = await getTranslations("brand");
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-14">
        <header className="flex items-center justify-between">
          <Logo />
          <LocaleSwitch />
        </header>
        <main className="my-auto py-10">
          <SignInForm />
        </main>
        <footer className="flex items-center justify-center gap-1.5 text-xs text-ink-3">
          {tb.rich("credit", {
            heart: () => (
              <Heart size={13} className="fill-carmine text-carmine" aria-label="love" />
            ),
          })}
        </footer>
      </div>
      <aside
        aria-hidden
        className="relative m-4 hidden flex-col justify-end overflow-hidden rounded-[22px] bg-[radial-gradient(120%_90%_at_85%_10%,#9a031e_0%,#5f0f40_55%,#3d0a2a_100%)] p-12 text-[#fff4e8] lg:flex"
      >
        <div className="absolute end-14 top-16 grid w-[340px] -rotate-3 gap-3 rounded-2xl bg-surface p-5 text-ink shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45)]">
          <div className="flex items-center gap-2">
            <span className="grid size-[26px] place-items-center rounded-full bg-orange text-xs font-semibold text-white">
              1
            </span>
            <b className="text-sm">{t("artStep")}</b>
          </div>
          <span className="text-[13px] font-medium">{t("artQuestion")}</span>
          <span className="h-10 rounded-[10px] border border-line-strong" />
          <div className="flex gap-1.5 text-[13px]">
            <span className="rounded-lg border border-line-strong px-3 py-1.5">{t("artFree")}</span>
            <span className="rounded-lg border border-teal bg-primary-soft px-3 py-1.5 text-primary-fg">
              {t("artTeam")}
            </span>
          </div>
        </div>
        <code
          dir="ltr"
          className="absolute end-40 top-[330px] rotate-3 rounded-xl bg-amber px-3.5 py-2.5 font-mono text-xs text-[#3d0a2a] shadow-[0_20px_40px_-18px_rgb(0_0_0/0.5)]"
        >
          {'{ "op": "eq", "args": [{ "var": "plan" }, "team"] }'}
        </code>
        <h2 className="max-w-[460px] text-[32px] leading-tight font-semibold tracking-tight">
          {t("artTitle")}
        </h2>
        <p className="mt-2.5 max-w-[440px] opacity-80">{t("artText")}</p>
      </aside>
    </div>
  );
}
