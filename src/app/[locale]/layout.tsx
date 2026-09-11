import type { Metadata } from "next";
import { Almarai, Heebo } from "next/font/google";
import type { ReactNode } from "react";
import { site } from "@content/site";
import "../globals.css";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import Analytics from "@/components/Analytics";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MobileBar from "@/components/MobileBar";
import RevealObserver from "@/components/RevealObserver";
import WhatsAppButton from "@/components/WhatsAppButton";
import { JsonLd } from "@/components/ui";
import { navGroups, localeParam } from "@/lib/content";
import { getDictionary, LOCALES } from "@/lib/i18n";
import { organizationJsonLd } from "@/lib/seo";

/* الخطوط: Almarai للعربي، Heebo للعبري (تُحمّل مرة واحدة وتُخدم من موقعنا) */
const almarai = Almarai({ subsets: ["arabic", "latin"], weight: ["300", "400", "700", "800"], variable: "--font-almarai", display: "swap" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });

/**
 * سكربت صغير يعمل قبل رسم الصفحة:
 *  - يضيف الصنف "js" (حركات الظهور التدريجي تعمل فقط معه، فلا تختفي العناصر إذا تعطّل JavaScript)
 *  - يطبّق إعدادات الوصولية المحفوظة (إيقاف الحركة، التباين، حجم الخط) فوراً بدون وميض
 */
const bootScript = `(function(){var h=document.documentElement;h.classList.add('js');try{var p=JSON.parse(localStorage.getItem('almrkz-a11y')||'{}');if(p.motion)h.classList.add('a11y-no-motion');if(p.contrast)h.classList.add('a11y-contrast');if(p.links)h.classList.add('a11y-links');if(p.text===1)h.classList.add('a11y-text-lg');if(p.text===2)h.classList.add('a11y-text-xl');}catch(e){}})();`;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}
/** أي لغة غير ar/he تعطي 404 */
export const dynamicParams = false;

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name[locale]} — ${site.city[locale]}`,
      template: `%s | ${site.shortName[locale]}`,
    },
    description: dict.hero.text,
    applicationName: site.shortName[locale],
    robots: { index: true, follow: true },
    icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode } & Params) {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  const groups = navGroups(locale);

  return (
    <html lang={locale} dir="rtl" className={`${almarai.variable} ${heebo.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-brand-700">
          {dict.nav.home}
        </a>
        <Header locale={locale} dict={dict} groups={groups} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} dict={dict} groups={groups} />
        {/* مساحة للشريط الثابت أسفل الشاشة على الموبايل */}
        <div className="h-16 lg:hidden" aria-hidden="true" />
        <MobileBar locale={locale} labels={{ call: dict.common.call, whatsapp: dict.common.whatsapp, register: dict.common.registerInterest }} />
        <WhatsAppButton label={dict.common.whatsappLong} />
        <AccessibilityWidget locale={locale} dict={dict.accessibility.widget} />
        <RevealObserver />
        <JsonLd data={organizationJsonLd(locale)} />
        <Analytics />
      </body>
    </html>
  );
}
