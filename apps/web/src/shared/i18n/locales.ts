/** Locales the app is translated into. */
export const LOCALES = ["en", "fa"] as const;

/** One of {@link LOCALES}. */
export type AppLocale = (typeof LOCALES)[number];

/** Cookie that stores the reader's choice. */
export const LOCALE_COOKIE = "locale";
