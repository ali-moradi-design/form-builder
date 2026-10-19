"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/shared/ui";
import { setLocale } from "../api/set-locale";

/** Switches between English and Persian. */
export function LocaleSwitch() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = locale === "fa" ? "en" : "fa";
  return (
    <Button
      disabled={pending}
      onClick={() => {
        start(async () => {
          await setLocale(next);
          router.refresh();
        });
      }}
    >
      <Languages size={16} aria-hidden />
      <span className="sr-only">{t("language")}:</span>
      {next === "fa" ? "فارسی" : "English"}
    </Button>
  );
}
