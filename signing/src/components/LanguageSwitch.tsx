"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, localeNames } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";

/** Segmented Arabic / Hebrew switch. Stores the choice in a cookie and re-renders. */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const current = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={`inline-flex rounded-full border border-line bg-card p-0.5 text-sm ${pending ? "opacity-60" : ""} ${className}`}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={current === locale}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setLocale(locale);
              router.refresh();
            })
          }
          className={`min-h-9 rounded-full px-3.5 font-medium transition-colors ${
            current === locale ? "bg-brand-600 text-white" : "text-muted hover:text-ink"
          }`}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
