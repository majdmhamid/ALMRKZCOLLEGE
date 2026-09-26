import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { notFound } from "next/navigation";
import { dict } from "@/content/i18n";
import { site } from "@/content/site";
import { isLocale, locales } from "@/content/types";
import "../globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], weight: ["400", "700", "800"], variable: "--font-heebo", display: "swap" });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: `${site.name[locale]} — ${site.city[locale]}`,
    description: dict[locale].footer.aboutText,
    alternates: { languages: { he: "/he", ar: "/ar" } },
    icons: { icon: "/assets/brand/logo.png" },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#07371b" };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir="rtl" className={heebo.variable}>
      <body>
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
