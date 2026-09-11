"use client";

import type { MouseEvent } from "react";
import { site } from "@content/site";
import { href, type Locale } from "@/lib/i18n";
import { PhoneIcon, WhatsAppIcon } from "./Icons";

interface Props {
  locale: Locale;
  labels: { call: string; whatsapp: string; register: string };
}

/**
 * شريط ثابت أسفل الشاشة على الموبايل: اتصال · واتساب · سجّل اهتمامك.
 * زر التسجيل ينزل للاستمارة الموجودة في نفس الصفحة إن وُجدت، وإلا يفتح صفحة "اتصل بنا".
 */
export default function MobileBar({ locale, labels }: Props) {
  const goToForm = (e: MouseEvent<HTMLAnchorElement>) => {
    const local = document.getElementById("form") ?? document.getElementById("register");
    if (!local) return; // لا استمارة في هذه الصفحة → الرابط يودّي لصفحة اتصل بنا
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-no-motion");
    local.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    const first = local.querySelector<HTMLInputElement>("input:not([type=hidden])");
    if (first) window.setTimeout(() => first.focus({ preventScroll: true }), reduce ? 0 : 500);
  };

  const item = "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-bold leading-none";

  return (
    <nav
      aria-label={labels.register}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 shadow-[0_-8px_24px_-12px_rgb(16_40_20/0.25)] backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch divide-x divide-line rtl:divide-x-reverse">
        <a href={`tel:${site.phoneIntl}`} className={`${item} text-ink hover:bg-surface`}>
          <PhoneIcon width={22} height={22} className="text-brand-600" />
          {labels.call}
        </a>
        <a href={site.whatsappUrl} target="_blank" rel="noopener" className={`${item} text-ink hover:bg-surface`}>
          <WhatsAppIcon width={24} height={24} className="text-whatsapp" />
          {labels.whatsapp}
        </a>
        <a href={href(locale, "/contact#form")} onClick={goToForm} className={`${item} bg-brand-600 text-white hover:bg-brand-700`}>
          <span className="text-base font-extrabold">{labels.register}</span>
        </a>
      </div>
    </nav>
  );
}
