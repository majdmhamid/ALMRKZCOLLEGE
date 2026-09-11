"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@content/site";
import type { Dictionary } from "@content/i18n";
import { href, switchLocalePath, type Locale } from "@/lib/i18n";
import { ChevronIcon, MenuIcon, PhoneIcon, WhatsAppIcon, XIcon } from "./Icons";

interface NavGroup {
  slug: string;
  name: string;
  courses: { slug: string; name: string }[];
}

interface Props {
  locale: Locale;
  dict: Dictionary;
  groups: NavGroup[];
}

export default function Header({ locale, dict, groups }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const other: Locale = locale === "ar" ? "he" : "ar";

  // عند الانتقال لصفحة جديدة تُغلق قائمة الموبايل (تعديل الحالة أثناء الرندر — النمط الموصى به من React)
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setCoursesOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ظل خفيف للترويسة بعد التمرير
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: href(locale, "/about"), label: dict.nav.about },
    { to: href(locale, "/graduates"), label: dict.nav.graduates },
    { to: href(locale, "/gallery"), label: dict.nav.gallery },
    { to: href(locale, "/news"), label: dict.nav.news },
    { to: href(locale, "/employers"), label: dict.nav.employers },
    { to: href(locale, "/contact"), label: dict.nav.contact },
  ];
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur transition-shadow duration-300 ${scrolled ? "shadow-md" : "shadow-sm"}`}>
      {/* شريط علوي: هاتف + واتساب + تبديل اللغة (لمسة خضراء) */}
      <div className="bg-brand-700 text-white">
        <div className="container-x flex h-9 items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <a href={`tel:${site.phoneIntl}`} className="inline-flex items-center gap-1.5 hover:underline" dir="ltr">
              <PhoneIcon width={16} height={16} />
              {site.phone}
            </a>
            <a href={site.whatsappUrl} target="_blank" rel="noopener" className="hidden items-center gap-1.5 hover:underline sm:inline-flex">
              <WhatsAppIcon width={16} height={16} />
              <span dir="ltr">{site.mobile}</span>
            </a>
          </div>
          <Link href={switchLocalePath(pathname, other)} hrefLang={other} lang={other} className="rounded-md bg-white/15 px-2.5 py-0.5 font-bold transition hover:bg-white/25">
            {dict.otherLangName}
          </Link>
        </div>
      </div>

      {/* الشريط الرئيسي */}
      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <Link href={href(locale)} className="flex shrink-0 items-center gap-3" aria-label={dict.nav.home}>
          <Image src="/images/brand/logo.png" alt={site.name[locale]} width={150} height={38} priority className="h-9 w-auto md:h-10" />
        </Link>

        {/* قائمة سطح المكتب */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="main">
          <div className="group relative">
            <Link
              href={href(locale, "/courses")}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 font-bold transition hover:bg-brand-50 hover:text-brand-700 ${isActive(href(locale, "/courses")) ? "text-brand-700" : ""}`}
            >
              {dict.nav.courses}
              <ChevronIcon width={16} height={16} className="transition-transform group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute start-0 top-full z-50 w-[560px] translate-y-2 rounded-2xl border border-line bg-white p-4 opacity-0 shadow-lift transition duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="grid grid-cols-3 gap-4">
                {groups.map((g) => (
                  <div key={g.slug}>
                    <Link href={href(locale, `/courses/${g.slug}`)} className="mb-2 block font-extrabold text-brand-700 hover:underline">
                      {g.name}
                    </Link>
                    <ul className="space-y-1.5">
                      {g.courses.map((c) => (
                        <li key={c.slug}>
                          <Link href={href(locale, `/courses/${g.slug}/${c.slug}`)} className="block rounded-md py-0.5 text-sm leading-snug text-ink-soft transition hover:text-brand-700">
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Link href={href(locale, "/courses")} className="mt-4 block border-t border-line pt-3 text-sm font-bold text-brand-600 hover:underline">
                {dict.nav.allCourses} ←
              </Link>
            </div>
          </div>
          {links.map((l) => (
            <Link key={l.to} href={l.to} className={`rounded-lg px-3 py-2 font-bold transition hover:bg-brand-50 hover:text-brand-700 ${isActive(l.to) ? "text-brand-700" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href={href(locale, "/contact#form")} className="btn btn-primary btn-sm hidden md:inline-flex">
            {dict.common.registerInterest}
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line transition hover:bg-surface lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.nav.close : dict.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* قائمة الموبايل */}
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[108px] z-40 overflow-y-auto border-t border-line bg-white lg:hidden">
          <nav className="container-x flex flex-col py-3 pb-24" aria-label="mobile">
            <button type="button" className="flex items-center justify-between py-3 text-lg font-bold" aria-expanded={coursesOpen} onClick={() => setCoursesOpen((v) => !v)}>
              {dict.nav.courses}
              <ChevronIcon className={`transition ${coursesOpen ? "rotate-180" : ""}`} />
            </button>
            {coursesOpen && (
              <div className="mb-2 rounded-xl bg-surface p-3">
                {groups.map((g) => (
                  <div key={g.slug} className="mb-3 last:mb-0">
                    <Link href={href(locale, `/courses/${g.slug}`)} className="block py-1 font-extrabold text-brand-700">
                      {g.name}
                    </Link>
                    {g.courses.map((c) => (
                      <Link key={c.slug} href={href(locale, `/courses/${g.slug}/${c.slug}`)} className="block py-1.5 ps-3 text-ink-soft">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                ))}
                <Link href={href(locale, "/courses")} className="block py-1 font-bold text-brand-600">
                  {dict.nav.allCourses}
                </Link>
              </div>
            )}
            {links.map((l) => (
              <Link key={l.to} href={l.to} className="border-t border-line py-3 text-lg font-bold">
                {l.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Link href={href(locale, "/contact#form")} className="btn btn-primary">
                {dict.common.registerInterest}
              </Link>
              <a href={site.whatsappUrl} target="_blank" rel="noopener" className="btn btn-whatsapp">
                <WhatsAppIcon />
                {dict.common.whatsappLong}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
