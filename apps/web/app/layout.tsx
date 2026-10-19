import { isRtl } from "@formweave/engine/i18n";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Comic_Neue, Geist, Vazirmatn } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const vazirmatn = Vazirmatn({ subsets: ["arabic", "latin"], variable: "--font-vazirmatn" });
const comic = Comic_Neue({ subsets: ["latin"], weight: "700", variable: "--font-comic" });

export const metadata: Metadata = {
  title: "formweave",
  description: "Schema-driven forms with a visual builder.",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${geist.variable} ${vazirmatn.variable} ${comic.variable}`}
    >
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
