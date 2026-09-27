"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

const TZ = "Asia/Jerusalem";

/** Arabic uses Latin digits and Levantine month names (أيلول), as people write locally. */
export function intlLocale(locale: string): string {
  return locale === "ar" ? "ar-PS-u-nu-latn" : "he-IL";
}

export function useFormatters() {
  const locale = intlLocale(useLocale());
  return useMemo(() => {
    const month = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: TZ });
    const day = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "numeric", timeZone: TZ });
    const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: TZ });
    const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short", timeZone: TZ });
    const num = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    return {
      month: (iso: string) => month.format(new Date(iso)),
      day: (iso: string) => day.format(new Date(iso)),
      time: (iso: string) => time.format(new Date(iso)),
      dateTime: (iso: string) => dateTime.format(new Date(iso)),
      mb: (bytes: number) =>
        bytes < 1024 * 1024 ? `${num.format(Math.max(bytes, bytes ? 1024 : 0) / 1024)} KB` : `${num.format(bytes / (1024 * 1024))} MB`,
    };
  }, [locale]);
}
