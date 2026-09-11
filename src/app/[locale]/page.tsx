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
import HeroCollage from "@/components/HeroCollage";
import HeroMedia from "@/components/HeroMedia";
import HeroSparks from "@/components/HeroSparks";
import LeadForm from "@/components/LeadForm";
import Marquee from "@/components/Marquee";
import RotatingWords from "@/components/RotatingWords";
import Tilt from "@/components/Tilt";
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

/** الصور العائمة فوق الفيديو (سطح المكتب) — صور حقيقية من الورشات والميدان */
const collageSrcs = ["/images/gallery/welding/768616178606144.webp", "/images/news/hvac-practical-lessons/2.webp", "/images/courses/scaffolding-builder.webp"];

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
  const collage = collageSrcs.map((src, i) => ({ src, alt: "", caption: dict.hero.collage[i] ?? "" }));

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
      {/* ---------- الواجهة الحيّة: فيديو + كولاج صور عائمة + شرارات ---------- */}
      <section className="relative isolate overflow-hidden">
        <HeroMedia poster="/images/hero/poster.webp" sources={[{ src: "/videos/hero.mp4", type: "video/mp4" }]} slides={heroSlides} alt={dict.hero.title} />
        {/* تدرّج أبيض: على الموبايل من الأسفل، وعلى الشاشات الكبيرة من جهة النص */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 via-45% to-white/0 to-80% lg:bg-gradient-to-l lg:from-white lg:via-white/95 lg:via-42% lg:to-white/30 lg:to-72%" aria-hidden="true" />
        <HeroSparks />

        <div className="container-x relative flex min-h-[calc(100svh-108px)] flex-col justify-end pb-24 pt-20 lg:min-h-[680px] lg:justify-center lg:py-14">
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
            {/* الكلمة المتبدّلة: اللحام ← التكييف ← البناء والسلامة */}
            <p className="hero-in mt-2 text-base font-bold text-ink-soft md:text-lg" style={delay(220)}>
              {dict.hero.rotatingPrefix} <RotatingWords words={dict.hero.rotating} className="font-extrabold text-brand-700" />
            </p>
            <p className="hero-in mt-2 max-w-xl text-[15px] leading-relaxed text-ink-soft md:mt-3 md:text-lg" style={delay(260)}>
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
            <div className="hero-in mt-4 hidden flex-wrap items-center gap-x-5 gap-y-2 sm:flex md:mt-5" style={delay(400)}>
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

            {/* بلاطات "اختر مجالك" — تفاصيل أكثر في أول شاشة */}
            <div className="hero-in mt-6 md:mt-8" style={delay(480)}>
              <p className="mb-2 text-xs font-bold text-ink-muted md:text-sm">{dict.hero.fieldsTitle}</p>
              <ul className="grid grid-cols-3 gap-2 sm:gap-3">
                {sortedGroups.map((g) => (
                  <li key={g.slug}>
                    <Link href={href(locale, `/courses/${g.slug}`)} className="field-tile group flex h-full flex-col items-center gap-2 rounded-2xl border border-line bg-white/90 p-2.5 text-center shadow-sm backdrop-blur sm:flex-row sm:p-3 sm:text-start">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl sm:h-14 sm:w-14">
                        <Image src={g.image} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-extrabold leading-tight sm:text-sm">{t(g.shortName, locale)}</span>
                        <span className="hidden text-xs text-ink-muted sm:block">{courseCount(locale, coursesInGroup(g.slug).length)}</span>
                      </span>
                      <ArrowIcon width={16} height={16} className="ms-auto hidden shrink-0 text-brand-600 transition-transform group-hover:-translate-x-1 sm:block" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* جهة الفيديو (سطح المكتب): صور عائمة + بطاقة وزارة العمل + بطاقة 2008 */}
          <div className="pointer-events-none absolute inset-y-8 start-[56%] end-4 hidden lg:block" aria-hidden="true">
            <HeroCollage photos={collage} />
            <div className="float-y absolute bottom-[26%] end-[2%] flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lift backdrop-blur" style={delay(700)}>
              <Image src="/images/partners/ministry-of-labor.png" alt="" width={44} height={44} className="h-11 w-11 rounded-full object-contain ring-1 ring-line" />
              <div>
                <p className="text-sm font-extrabold leading-tight">{dict.hero.ministryTitle}</p>
                <p className="text-xs text-ink-soft">{dict.hero.ministryText}</p>
              </div>
            </div>
            <div className="float-y absolute start-[3%] top-[41%] rounded-2xl bg-brand-600 px-5 py-3 text-white shadow-brand" style={delay(1600)}>
              <p className="text-3xl font-extrabold leading-none" dir="ltr">
                {site.foundedYear}
              </p>
              <p className="mt-1 text-xs font-bold text-white/85">{dict.trust[0].text}</p>
            </div>
          </div>

          {/* تلميح التمرير (موبايل) */}
          <a href="#stats" className="bounce-hint absolute bottom-20 start-1/2 -translate-x-1/2 text-brand-700 lg:hidden" aria-label={dict.hero.scrollHint}>
            <ChevronIcon width={28} height={28} />
          </a>
        </div>
      </section>

      {/* ---------- الأرقام المتحركة ---------- */}
      <section id="stats" className="relative border-y border-line bg-surface">
        <div className="bg-dots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="container-x relative grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x rtl:md:divide-x-reverse">
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

      {/* ---------- المجموعات (بطاقات تميل مع الفأرة) ---------- */}
      <section className="section bg-glow">
        <div className="container-x">
          <SectionHeading eyebrow={dict.nav.courses} title={dict.home.groupsTitle} text={dict.home.groupsSubtitle} center />
          <div className="grid gap-6 md:grid-cols-3">
            {sortedGroups.map((g, i) => (
              <Tilt key={g.slug} className="tilt-shine h-full rounded-2xl">
                <GroupCard group={g} locale={locale} count={courseCount(locale, coursesInGroup(g.slug).length)} style={delay(i * 120)} />
              </Tilt>
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

      {/* ---------- كيف تبدأ معنا؟ (خط يُرسم والأرقام تتلوّن) ---------- */}
      <section className="section bg-surface">
        <div className="container-x">
          <SectionHeading eyebrow={dict.steps.eyebrow} title={dict.steps.title} text={dict.steps.text} center />
          <ol data-reveal className="steps grid gap-8 md:grid-cols-4 md:gap-6">
            {dict.steps.items.map((s, i) => (
              <li key={s.title} className="flex gap-4 md:flex-col md:items-center md:text-center" style={delay(i * 350)}>
                <span className="step-num shrink-0">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-extrabold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- لمحة من ورشاتنا (شريط صور يتحرك باستمرار) ---------- */}
      <section className="section bg-surface-2/60 pb-10">
        <div className="container-x">
          <SectionHeading eyebrow={dict.nav.gallery} title={dict.home.galleryTitle} text={dict.home.galleryText} center className="mb-8" />
        </div>
        <div className="marquee photo-marquee" dir="ltr">
          <div className="marquee-track">
            {[false, true].map((dup) => (
              <ul key={String(dup)} className={`flex shrink-0 gap-4 px-2 ${dup ? "marquee-dup" : ""}`} aria-hidden={dup || undefined}>
                {strip.map((img, i) => (
                  <li key={`${img.src}-${i}`} className="relative h-52 w-72 shrink-0 overflow-hidden rounded-2xl bg-brand-100 shadow-card md:h-64 md:w-[22rem]">
                    <Link href={href(locale, "/gallery")} className="group relative block h-full" tabIndex={dup ? -1 : 0}>
                      <Image src={img.src} alt={dup ? "" : t(img.alt, locale)} fill sizes="352px" className="object-cover transition duration-700 ease-out group-hover:scale-105" />
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
        <div className="container-x mt-8 text-center">
          <Link href={href(locale, "/gallery")} className="btn btn-outline">
            {dict.nav.gallery}
            <ArrowIcon width={18} height={18} />
          </Link>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-900/60 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" aria-hidden="true" />
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
