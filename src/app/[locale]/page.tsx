import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { courses, featuredCourses, coursesInGroup, getCourse } from "@content/courses";
import { gallery, videos } from "@content/media";
import { news } from "@content/news";
import { graduates, partners } from "@content/people";
import { site } from "@content/site";
import { AwardIcon, GiftIcon, ShieldIcon, WhatsAppIcon, ArrowIcon, CheckIcon, ChevronIcon, LayersIcon, UsersIcon, ClockIcon } from "@/components/Icons";
import Carousel from "@/components/Carousel";
import Counter from "@/components/Counter";
import HeroMedia from "@/components/HeroMedia";
import LeadForm from "@/components/LeadForm";
import Marquee from "@/components/Marquee";
import { CourseCard, GroupCard, NewsCard, SectionHeading, delay } from "@/components/ui";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { courseOptions, localeParam, sortedGroups } from "@/lib/content";
import { courseCount, getDictionary, href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  const meta = pageMetadata({ locale, path: "/", title: `${site.name[locale]} — ${site.city[locale]}`, description: dict.hero.text });
  return { ...meta, title: { absolute: `${site.name[locale]} — ${site.city[locale]} | ${dict.hero.badge}` } };
}

/** صور عرض الشرائح الاحتياطي في الواجهة (إذا تعذّر تشغيل الفيديو) */
const heroSlides = ["/images/hero/poster.webp", "/images/hero/home.webp", "/images/hero/about.webp", "/images/groups/hvac.webp"];

/** صور شريط "لمحة من ورشاتنا" — اختيار متنوع من معرض الصور الحقيقي */
const pick = (category: string, n: number, skip = 0) => gallery.filter((g) => g.category === category).slice(skip, skip + n);
const strip = [...pick("welding", 3), ...pick("hvac", 2), ...pick("construction", 3, 1), ...pick("events", 2)];

export default async function HomePage({ params }: Params) {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  const featured = featuredCourses();
  const latestNews = news.slice(0, 3);
  const someGraduates = graduates.slice(0, 8);
  const groupName = (slug: string) => t(sortedGroups.find((g) => g.slug === slug)?.name, locale);
  const carouselLabels = { prev: dict.common.prev, next: dict.common.next, swipe: dict.common.swipe };
  const years = new Date().getFullYear() - site.foundedYear;

  const stats = [
    { value: years, label: dict.stats.years, icon: AwardIcon },
    { value: courses.length, label: dict.stats.courses, icon: LayersIcon },
    { value: sortedGroups.length, label: dict.stats.groups, icon: ClockIcon },
    { value: partners.length, label: dict.stats.partners, icon: UsersIcon },
  ];
  const pills = [
    { icon: ShieldIcon, text: dict.trust[1].title },
    { icon: AwardIcon, text: dict.trust[0].title },
    { icon: GiftIcon, text: dict.trust[3].title },
  ];

  return (
    <>
      {/* ---------- الواجهة الحيّة ---------- */}
      <section className="relative isolate overflow-hidden">
        <HeroMedia poster="/images/hero/poster.webp" sources={[{ src: "/videos/hero.mp4", type: "video/mp4" }]} slides={heroSlides} alt={dict.hero.title} />
        {/* تدرّج أبيض: على الموبايل من الأسفل، وعلى الشاشات الكبيرة من جهة النص */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 via-45% to-white/0 to-80% lg:bg-gradient-to-l lg:from-white lg:via-white/95 lg:via-42% lg:to-white/5 lg:to-72%" aria-hidden="true" />

        <div className="container-x relative flex min-h-[calc(100svh-108px)] flex-col justify-end pb-24 pt-24 lg:min-h-[640px] lg:justify-center lg:py-24">
          <div className="max-w-2xl">
            <span className="hero-in chip mb-3" style={delay(0)}>
              <AwardIcon width={16} height={16} className="text-brand-600" />
              {dict.hero.badge}
            </span>
            <h1 className="hero-in text-[2.1rem] font-extrabold leading-[1.15] text-ink md:text-5xl md:leading-[1.12] lg:text-6xl" style={delay(100)}>
              {dict.hero.title}
              <span className="mt-1 block text-brand-600">{dict.hero.subtitle}</span>
            </h1>
            <p className="hero-in mt-2 text-lg font-bold text-brand-800 md:mt-3 md:text-xl" style={delay(180)}>
              {dict.hero.slogan}
            </p>
            <p className="hero-in mt-2 max-w-xl text-[15px] leading-relaxed text-ink-soft md:mt-3 md:text-lg" style={delay(240)}>
              {dict.hero.text}
            </p>
            <div className="hero-in mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap md:mt-7" style={delay(320)}>
              <a href="#register" className="btn btn-primary sm:btn-lg">
                {dict.common.registerInterest}
                <ArrowIcon width={18} height={18} className="hidden sm:block" />
              </a>
              <a href={site.whatsappUrl} target="_blank" rel="noopener" className="pulse-ring btn btn-whatsapp relative isolate sm:btn-lg">
                <WhatsAppIcon width={22} height={22} />
                <span className="sm:hidden">{dict.common.whatsapp}</span>
                <span className="hidden sm:inline">{dict.hero.ctaWhatsapp}</span>
              </a>
            </div>
            <div className="hero-in mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 md:mt-5" style={delay(400)}>
              <Link href={href(locale, "/courses")} className="inline-flex items-center gap-1 font-bold text-brand-700 hover:underline">
                {dict.hero.ctaCourses}
                <ArrowIcon width={16} height={16} />
              </Link>
              <ul className="flex flex-wrap gap-2">
                {pills.map((p) => (
                  <li key={p.text} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800 ring-1 ring-brand-200">
                    <p.icon width={14} height={14} />
                    {p.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* بطاقات عائمة فوق الفيديو (سطح المكتب فقط) */}
          <div className="pointer-events-none absolute inset-y-0 start-[58%] end-8 hidden lg:block" aria-hidden="true">
            <div className="float-y absolute top-[22%] start-0 rounded-2xl bg-white/90 px-5 py-3 shadow-lift backdrop-blur" style={delay(0)}>
              <p className="text-3xl font-extrabold text-brand-700" dir="ltr">
                {site.foundedYear}
              </p>
              <p className="text-sm font-bold text-ink-soft">{dict.trust[0].text}</p>
            </div>
            <div className="float-y absolute bottom-[22%] end-0 rounded-2xl bg-white/90 px-5 py-3 shadow-lift backdrop-blur" style={delay(1200)}>
              <p className="text-3xl font-extrabold text-brand-700" dir="ltr">
                {courses.length}
              </p>
              <p className="text-sm font-bold text-ink-soft">{dict.stats.courses}</p>
            </div>
          </div>

          {/* تلميح التمرير (موبايل) */}
          <a href="#stats" className="bounce-hint absolute bottom-20 start-1/2 -translate-x-1/2 text-brand-700 lg:hidden" aria-label={dict.hero.scrollHint}>
            <ChevronIcon width={28} height={28} />
          </a>
        </div>
      </section>

      {/* ---------- الأرقام المتحركة ---------- */}
      <section id="stats" className="border-y border-line bg-surface">
        <div className="container-x grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x rtl:md:divide-x-reverse">
          {stats.map((s, i) => (
            <div key={s.label} data-reveal style={delay(i * 90)} className="flex items-center gap-3 px-2 py-6 md:justify-center md:py-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <s.icon width={22} height={22} />
              </span>
              <div>
                <p className="text-3xl font-extrabold leading-none text-brand-700 md:text-4xl">
                  <Counter value={s.value} />
                </p>
                <p className="mt-1 text-sm font-bold text-ink-soft">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- المجموعات ---------- */}
      <section className="section bg-glow">
        <div className="container-x">
          <SectionHeading eyebrow={dict.nav.courses} title={dict.home.groupsTitle} text={dict.home.groupsSubtitle} center />
          <div className="grid gap-6 md:grid-cols-3">
            {sortedGroups.map((g, i) => (
              <GroupCard key={g.slug} group={g} locale={locale} count={courseCount(locale, coursesInGroup(g.slug).length)} style={delay(i * 120)} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- أبرز الدورات (قابلة للسحب على الموبايل) ---------- */}
      <section className="section bg-surface">
        <div className="container-x">
          <div data-reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">{dict.nav.courses}</span>
              <h2 className="h2">{dict.home.coursesTitle}</h2>
              <span className="heading-bar" aria-hidden="true" />
              <p className="lead mt-3">{dict.home.coursesSubtitle}</p>
            </div>
            <Link href={href(locale, "/courses")} className="btn btn-outline">
              {dict.common.allCourses}
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
          <Carousel labels={carouselLabels} className="-mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {featured.map((c, i) => (
              <CourseCard key={c.slug} course={c} locale={locale} groupName={groupName(c.group)} labels={{ hours: dict.common.hours, sessions: dict.common.sessions, view: dict.common.viewCourse }} className="w-[82%] sm:w-[46%] lg:w-auto" style={delay(i * 100)} />
            ))}
          </Carousel>
        </div>
      </section>

      {/* ---------- ليش كلية المركز ---------- */}
      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div data-reveal="scale" className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lift">
              <Image src="/images/hero/about.webp" alt={dict.about.title} fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-5 -end-3 rounded-2xl bg-brand-600 px-5 py-3 text-white shadow-brand md:-end-6">
              <p className="text-2xl font-extrabold" dir="ltr">
                {site.foundedYear}
              </p>
              <p className="text-xs font-bold text-white/85">{dict.trust[1].title}</p>
            </div>
          </div>
          <div>
            <SectionHeading eyebrow={dict.nav.about} title={dict.home.whyTitle} className="mb-6" />
            <ul className="space-y-5">
              {dict.home.whyItems.map((item, i) => (
                <li key={item.title} data-reveal style={delay(i * 100)} className="flex gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                    <CheckIcon width={18} height={18} />
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{item.title}</h3>
                    <p className="text-ink-soft">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p data-reveal className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-ink-soft">
              {dict.course.careerDisclaimer}
            </p>
            <Link href={href(locale, "/about")} className="btn btn-outline mt-6">
              {dict.common.readMore}
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- لمحة من ورشاتنا (شريط صور قابل للسحب) ---------- */}
      <section className="section bg-surface-2/60 pb-10">
        <div className="container-x">
          <SectionHeading eyebrow={dict.nav.gallery} title={dict.home.galleryTitle} text={dict.home.galleryText} center className="mb-8" />
        </div>
        <div className="container-x">
          <Carousel labels={carouselLabels} className="-mx-4 px-4 sm:mx-0 sm:px-0">
            {strip.map((img, i) => (
              <Link key={img.src} href={href(locale, "/gallery")} data-reveal="scale" style={delay(i * 60)} className="group relative aspect-[4/3] w-[70%] overflow-hidden rounded-2xl bg-brand-100 shadow-card sm:w-[42%] lg:w-[23.5%]">
                <Image src={img.src} alt={t(img.alt, locale)} fill sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 70vw" className="object-cover transition duration-700 ease-out group-hover:scale-105" />
              </Link>
            ))}
          </Carousel>
          <div className="mt-6 text-center">
            <Link href={href(locale, "/gallery")} className="btn btn-outline">
              {dict.nav.gallery}
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- الخريجون ---------- */}
      <section className="section">
        <div className="container-x">
          <div data-reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">{dict.nav.graduates}</span>
              <h2 className="h2">{dict.home.graduatesTitle}</h2>
              <span className="heading-bar" aria-hidden="true" />
              <p className="lead mt-3">{dict.home.graduatesSubtitle}</p>
            </div>
            <Link href={href(locale, "/graduates")} className="btn btn-outline">
              {dict.common.readMore}
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
          <Carousel labels={carouselLabels} className="-mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-8 lg:overflow-visible">
            {someGraduates.map((g, i) => {
              const course = getCourse(g.course);
              return (
                <div key={g.slug} data-reveal style={delay(i * 70)} className="group w-[42%] text-center sm:w-[30%] lg:w-auto">
                  <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl bg-brand-100 shadow-card">
                    <Image src={g.image} alt={t(g.name, locale)} fill sizes="(min-width: 1024px) 150px, 40vw" className="object-cover transition duration-700 ease-out group-hover:scale-105" />
                  </div>
                  <p className="mt-2 font-bold leading-tight">{t(g.name, locale)}</p>
                  <p className="text-xs leading-snug text-ink-soft">{t(course?.name, locale)}</p>
                </div>
              );
            })}
          </Carousel>
        </div>
      </section>

      {/* ---------- الفيديو ---------- */}
      <section className="section bg-surface">
        <div className="container-x">
          <SectionHeading eyebrow={dict.gallery.videosTitle} title={dict.home.videoTitle} center />
          <div className="grid gap-6 md:grid-cols-2">
            {videos.map((v, i) => (
              <div key={v.youtubeId} data-reveal="scale" style={delay(i * 120)}>
                <YouTubeEmbed id={v.youtubeId} title={t(v.title, locale)} thumbnail={v.thumbnail} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- الأخبار ---------- */}
      <section className="section">
        <div className="container-x">
          <div data-reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">{dict.nav.news}</span>
              <h2 className="h2">{dict.home.newsTitle}</h2>
              <span className="heading-bar" aria-hidden="true" />
            </div>
            <Link href={href(locale, "/news")} className="btn btn-outline">
              {dict.news.allNews}
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {latestNews.map((p, i) => (
              <NewsCard key={p.slug} post={p} locale={locale} readMore={dict.common.readMore} style={delay(i * 100)} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- الشركاء (شريط متحرك) ---------- */}
      <section className="border-y border-line bg-surface py-8">
        <p className="mb-5 text-center text-sm font-bold text-ink-muted">{dict.home.partnersTitle}</p>
        <Marquee partners={partners} locale={locale} />
      </section>

      {/* ---------- سجّل اهتمامك ---------- */}
      <section id="register" className="section bg-glow scroll-mt-24">
        <div className="container-x grid gap-10 lg:grid-cols-5">
          <div data-reveal className="lg:col-span-2">
            <span className="eyebrow">{dict.common.registerInterest}</span>
            <h2 className="h2">{dict.home.ctaTitle}</h2>
            <span className="heading-bar" aria-hidden="true" />
            <p className="lead mt-4">{dict.home.ctaText}</p>
            <ul className="mt-6 space-y-3 text-ink-soft">
              <li className="flex items-center gap-2">
                <CheckIcon className="shrink-0 text-brand-600" /> {dict.trust[3].text}
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="shrink-0 text-brand-600" /> {dict.course.contactForPrice}
              </li>
            </ul>
          </div>
          <div data-reveal="scale" style={delay(120)} className="card p-6 md:p-8 lg:col-span-3">
            <LeadForm locale={locale} dict={dict.form} whatsappLabel={dict.common.whatsappLong} courses={courseOptions(locale)} source="home" />
          </div>
        </div>
      </section>
    </>
  );
}
