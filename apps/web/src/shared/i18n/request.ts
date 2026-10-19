import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALES, type AppLocale } from "./locales";

export default getRequestConfig(async () => {
  const store = await cookies();
  const wanted = store.get("locale")?.value;
  const locale: AppLocale = LOCALES.includes(wanted as AppLocale) ? (wanted as AppLocale) : "en";
  const messages = (await import(`../../../messages/${locale}.json`)) as {
    default: Record<string, unknown>;
  };
  return { locale, messages: messages.default };
});
