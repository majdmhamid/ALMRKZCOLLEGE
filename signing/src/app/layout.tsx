import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Sans_Hebrew } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { dirOf, type Locale } from "@/i18n/config";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const hebrew = IBM_Plex_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hebrew",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
    // Private tool: signing links and the admin area must never be indexed.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f7fb",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  // The current language's font goes first; the other one covers mixed text.
  const [primary, secondary] = locale === "ar" ? ["--font-arabic", "--font-hebrew"] : ["--font-hebrew", "--font-arabic"];

  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      className={`${arabic.variable} ${hebrew.variable}`}
      style={
        {
          "--font-primary": `var(${primary})`,
          "--font-secondary": `var(${secondary})`,
        } as React.CSSProperties
      }
    >
      <body className="min-h-dvh font-sans antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
