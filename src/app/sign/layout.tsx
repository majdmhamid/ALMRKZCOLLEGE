import type { Metadata, Viewport } from "next";
import { Almarai, Heebo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { dirOf, type Locale } from "@/features/signing/i18n/config";
import "../globals.css";

/** نفس خطوط الموقع: Almarai للعربي، Heebo للعبري */
const almarai = Almarai({ subsets: ["arabic", "latin"], weight: ["300", "400", "700", "800"], variable: "--font-almarai", display: "swap" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
    // روابط التوقيع خاصة — ممنوع تنفهرس
    robots: { index: false, follow: false },
    icons: { icon: "/icon.png" },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#158942" };

/** صفحة التوقيع للعميل (/sign/[token]) — بدون ترويسة الموقع، بلغة المتصفح (عربي/عبري) */
export default async function SignLayout({ children }: { children: ReactNode }) {
  const locale = (await getLocale()) as Locale;
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${almarai.variable} ${heebo.variable}`}>
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
