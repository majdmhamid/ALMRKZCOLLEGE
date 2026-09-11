"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@content/site";
import type { Dictionary } from "@content/i18n";
import { href, switchLocalePath, type Locale } from "@/lib/i18n";
import Ticker from "./Ticker";
import {
  ArrowIcon,
  ChevronIcon,
  ClockIcon,
  FacebookIcon,
  MenuIcon,
  PhoneIcon,
  WhatsAppIcon,
  XIcon,
  YouTubeIcon,
} from "./Icons";

interface NavGroup {
  slug: string;
  name: string;
  tagline?: string;
  image?: string;
  count?: string;
  courses: { slug: string; name: string }[];
}

interface Props {
  locale: Locale;
  dict: Dictionary;
  groups: NavGroup[];
  /** آخر الأخبار لشريط "جديد" في الشريط العلوي */
  ticker?: { label: string; items: { title: string; to: string }[] };
}

export default function Header({ locale, dict, groups, ticker }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const progressRef = useRef<HTMLSpanElement>(null);
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

  // ظل بعد التمرير + إخفاء الترويسة عند النزول وإظهارها عند الصعود + شريط تقدّم القراءة
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      setScrolled(y > 12);
      const dy = y - last;
      if (y < 140) setHidden(false);
      else if (dy > 8) setHidden(true);
      else if (dy < -8) setHidden(false);
      last = y;
      const bar = progressRef.current;
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
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
  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(`${to}/`);

  return (
    <>
      <header
        className={`header-smart sticky top-0 z-40 bg-white/95 backdrop-blur ${scrolled ? "shadow-md" : "shadow-sm"} ${hidden && !open ? "is-hidden" : ""}`}
      >
        {/* شريط علوي: هاتف + واتساب + ساعات + شريط "جديد" + تابعنا + تبديل اللغة */}
        <div className="bg-brand-700 text-white">
          <div className="container-x flex h-9 items-center justify-between gap-3 text-sm">
            <div className="flex shrink-0 items-center gap-4">
              <a
                href={`tel:${site.phoneIntl}`}
                className="inline-flex items-center gap-1.5 hover:underline"
                dir="ltr"
              >
                <PhoneIcon width={16} height={16} />
                {site.phone}
              </a>
              <a
                href={site.whatsappUrl}
                target="_blank"
                rel="noopener"
                className="hidden items-center gap-1.5 hover:underline sm:inline-flex"
              >
                <WhatsAppIcon width={16} height={16} />
                <span dir="ltr">{site.mobile}</span>
              </a>
              <span className="hidden items-center gap-1.5 text-white/85 lg:inline-flex">
                <ClockIcon width={15} height={15} />
                {dict.topbar.hours}
              </span>
            </div>

            {ticker && <Ticker label={ticker.label} items={ticker.items} />}

            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden items-center gap-1 sm:inline-flex">
                <span className="me-1 hidden text-xs text-white/75 lg:inline">
                  {dict.topbar.follow}
                </span>
                <a
                  href={site.social.facebook}
                  target="_blank"
                  rel="noopener"
                  aria-label="Facebook"
                  className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-white/15"
                >
                  <FacebookIcon width={14} height={14} />
                </a>
                <a
                  href={site.social.youtube}
                  target="_blank"
                  rel="noopener"
                  aria-label="YouTube"
                  className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-white/15"
                >
                  <YouTubeIcon width={15} height={15} />
                </a>
              </span>
              <Link
                href={switchLocalePath(pathname, other)}
                hrefLang={other}
                lang={other}
                className="rounded-md bg-white/15 px-2.5 py-0.5 font-bold transition hover:bg-white/25"
              >
                {dict.otherLangName}
              </Link>
            </div>
          </div>
        </div>

        {/* الشريط الرئيسي */}
        <div className="container-x flex h-[72px] items-center justify-between gap-4">
          <Link
            href={href(locale)}
            className="flex shrink-0 items-center gap-3"
            aria-label={dict.nav.home}
          >
            <Image
              src="/images/brand/logo.png"
              alt={site.name[locale]}
              width={150}
              height={38}
              priority
              className="h-9 w-auto md:h-10"
            />
          </Link>

          {/* قائمة سطح المكتب */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="main">
            <div className="group relative">
              <Link
                href={href(locale, "/courses")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 font-bold transition hover:bg-brand-50 hover:text-brand-700 ${isActive(href(locale, "/courses")) ? "text-brand-700" : ""}`}
              >
                {dict.nav.courses}
                <ChevronIcon
                  width={16}
                  height={16}
                  className="transition-transform group-hover:rotate-180"
                />
              </Link>
              {/* قائمة الدورات الكبيرة: صورة لكل مجال + دوراته */}
              <div className="invisible absolute start-0 top-full z-50 w-[780px] translate-y-2 rounded-2xl border border-line bg-white p-5 opacity-0 shadow-lift transition duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="grid grid-cols-3 gap-5">
                  {groups.map((g) => (
                    <div key={g.slug}>
                      <Link
                        href={href(locale, `/courses/${g.slug}`)}
                        className="group/g relative mb-3 block aspect-[16/9] overflow-hidden rounded-xl bg-brand-100"
                      >
                        {g.image && (
                          <Image
                            src={g.image}
                            alt=""
                            fill
                            sizes="240px"
                            className="object-cover transition duration-700 ease-out group-hover/g:scale-105"
                          />
                        )}
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/20 to-transparent"
                          aria-hidden="true"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                          <p className="font-extrabold leading-tight">
                            {g.name}
                          </p>
                          {g.count && (
                            <p className="text-xs text-white/85">{g.count}</p>
                          )}
                        </div>
                      </Link>
                      <ul className="space-y-1.5">
                        {g.courses.map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={href(
                                locale,
                                `/courses/${g.slug}/${c.slug}`,
                              )}
                              className="block rounded-md py-0.5 text-sm leading-snug text-ink-soft transition hover:text-brand-700"
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <Link
                    href={href(locale, "/courses")}
                    className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline"
                  >
                    {dict.nav.allCourses}
                    <ArrowIcon width={16} height={16} />
                  </Link>
                  <span className="text-xs text-ink-muted">
                    {dict.trust[3].text}
                  </span>
                </div>
              </div>
            </div>
            {links.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                className={`rounded-lg px-3 py-2 font-bold transition hover:bg-brand-50 hover:text-brand-700 ${isActive(l.to) ? "text-brand-700" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={href(locale, "/contact#form")}
              className="btn btn-primary btn-sm hidden md:inline-flex"
            >
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
        <span
          ref={progressRef}
          className="scroll-progress"
          aria-hidden="true"
        />
      </header>

      {/* قائمة الموبايل — خارج الترويسة حتى لا يحصرها backdrop-filter */}
      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-[108px] z-40 overflow-y-auto border-t border-line bg-white lg:hidden"
        >
          <nav
            className="container-x flex flex-col py-3 pb-24"
            aria-label="mobile"
          >
            <button
              type="button"
              className="flex items-center justify-between py-3 text-lg font-bold"
              aria-expanded={coursesOpen}
              onClick={() => setCoursesOpen((v) => !v)}
            >
              {dict.nav.courses}
              <ChevronIcon
                className={`transition ${coursesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {coursesOpen && (
              <div className="mb-2 rounded-xl bg-surface p-3">
                {groups.map((g) => (
                  <div key={g.slug} className="mb-3 last:mb-0">
                    <Link
                      href={href(locale, `/courses/${g.slug}`)}
                      className="flex items-center gap-3 py-1 font-extrabold text-brand-700"
                    >
                      {g.image && (
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={g.image}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </span>
                      )}
                      <span>
                        {g.name}
                        {g.count && (
                          <span className="block text-xs font-normal text-ink-muted">
                            {g.count}
                          </span>
                        )}
                      </span>
                    </Link>
                    {g.courses.map((c) => (
                      <Link
                        key={c.slug}
                        href={href(locale, `/courses/${g.slug}/${c.slug}`)}
                        className="block py-1.5 ps-3 text-ink-soft"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                ))}
                <Link
                  href={href(locale, "/courses")}
                  className="block py-1 font-bold text-brand-600"
                >
                  {dict.nav.allCourses}
                </Link>
              </div>
            )}
            {links.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                className="border-t border-line py-3 text-lg font-bold"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={href(locale, "/contact#form")}
                className="btn btn-primary"
              >
                {dict.common.registerInterest}
              </Link>
              <a
                href={site.whatsappUrl}
                target="_blank"
                rel="noopener"
                className="btn btn-whatsapp"
              >
                <WhatsAppIcon />
                {dict.common.whatsappLong}
              </a>
            </div>
            <div className="mt-6 flex items-center gap-3 text-sm text-ink-muted">
              <span>{dict.topbar.follow}</span>
              <a
                href={site.social.facebook}
                target="_blank"
                rel="noopener"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line"
              >
                <FacebookIcon width={16} height={16} />
              </a>
              <a
                href={site.social.youtube}
                target="_blank"
                rel="noopener"
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line"
              >
                <YouTubeIcon width={16} height={16} />
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
