"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { href, isLocale, type Locale } from "@/lib/i18n";

export interface NotFoundTexts {
  title: string;
  text: string;
  home: string;
  courses: string;
}

/** محتوى صفحة 404 — اللغة تؤخذ من الرابط الحالي، والنصوص تصل من الخادم باللغتين */
export default function NotFoundView({ texts }: { texts: Record<Locale, NotFoundTexts> }) {
  const pathname = usePathname();
  const seg = pathname.split("/")[1];
  const locale: Locale = isLocale(seg) ? seg : "ar";
  const tx = texts[locale];
  return (
    <section className="section">
      <div className="container-x max-w-2xl text-center">
        <p className="text-7xl font-extrabold text-brand-200">404</p>
        <h1 className="h2 mt-2">{tx.title}</h1>
        <p className="lead mt-3">{tx.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={href(locale)} className="btn btn-primary">
            {tx.home}
          </Link>
          <Link href={href(locale, "/courses")} className="btn btn-outline">
            {tx.courses}
          </Link>
        </div>
      </div>
    </section>
  );
}
