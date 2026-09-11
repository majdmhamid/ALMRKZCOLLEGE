"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary, href, isLocale, type Locale } from "@/lib/i18n";

export default function NotFound() {
  const pathname = usePathname();
  const seg = pathname.split("/")[1];
  const locale: Locale = isLocale(seg) ? seg : "ar";
  const dict = getDictionary(locale);
  return (
    <section className="section">
      <div className="container-x max-w-2xl text-center">
        <p className="text-7xl font-extrabold text-brand-200">404</p>
        <h1 className="h2 mt-2">{dict.notFound.title}</h1>
        <p className="lead mt-3">{dict.notFound.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={href(locale)} className="btn btn-primary">
            {dict.notFound.home}
          </Link>
          <Link href={href(locale, "/courses")} className="btn btn-outline">
            {dict.nav.courses}
          </Link>
        </div>
      </div>
    </section>
  );
}
