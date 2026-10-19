"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, LOCALES, type AppLocale } from "@/shared/i18n";

/** Stores the reader's language for a year. */
export async function setLocale(locale: AppLocale): Promise<void> {
  if (!LOCALES.includes(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
