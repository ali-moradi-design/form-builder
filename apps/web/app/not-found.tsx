import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Logo } from "@/shared/ui";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="grid min-h-screen place-content-center justify-items-center gap-3 p-6 text-center">
      <Logo />
      <h1 className="mt-4 text-xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-ink-2">{t("text")}</p>
      <Link href="/forms" className="text-[13px] font-medium text-primary-fg underline">
        {t("home")}
      </Link>
    </main>
  );
}
