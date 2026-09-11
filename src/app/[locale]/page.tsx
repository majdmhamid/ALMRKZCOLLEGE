import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { featuredCourses, coursesInGroup, getCourse } from "@content/courses";
import { videos } from "@content/media";
import { news } from "@content/news";
import { graduates, partners } from "@content/people";
import { site } from "@content/site";
import { AwardIcon, CompassIcon, GiftIcon, ShieldIcon, UsersIcon, WhatsAppIcon, ArrowIcon, CheckIcon } from "@/components/Icons";
import LeadForm from "@/components/LeadForm";
import { CourseCard, GroupCard, NewsCard, SectionHeading } from "@/components/ui";
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

const trustIcons = [AwardIcon, ShieldIcon, UsersIcon, GiftIcon, CompassIcon];

export default async function HomePage({ params }: Params) {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  const featured = featuredCourses();
  const latestNews = news.slice(0, 3);
  const someGraduates = graduates.slice(0, 8);
  const groupName = (slug: string) => t(sortedGroups.find((g) => g.slug === slug)?.name, locale);

  return (
    <>
      {/* ---------- الواجهة ---------- */}
      <section className="relative isolate overflow-hidden bg-brand-900 text-white">
        <Image src="/images/hero/home.webp" alt="" fill priority sizes="100vw" className="object-cover object-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-l from-brand-900/95 via-brand-900/70 to-brand-900/20" />
        <div className="container-x relative py-20 md:py-28 lg:py-36">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-400/90 px-4 py-1.5 text-sm font-bold text-brand-900">
            <AwardIcon width={16} height={16} />
            {dict.hero.badge}
          </span>
          <h1 className="h1 max-w-3xl">
            {dict.hero.title}
            <span className="mt-1 block text-brand-300">{dict.hero.subtitle}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">{dict.hero.text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href(locale, "/courses")} className="btn btn-secondary btn-lg">
              {dict.hero.ctaCourses}
              <ArrowIcon width={18} height={18} />
            </Link>
            <a href={site.whatsappUrl} target="_blank" rel="noopener" className="btn btn-whatsapp btn-lg">
              <WhatsAppIcon width={22} height={22} />
              {dict.hero.ctaWhatsapp}
            </a>
          </div>
        </div>
      </section>

      {/* ---------- شريط الثقة ---------- */}
      <section className="border-b border-line bg-surface">
        <div className="container-x grid grid-cols-2 gap-x-6 gap-y-6 py-8 md:grid-cols-5">
          {dict.trust.map((item, i) => {
            const Icon = trustIcons[i];
            return (
              <div key={item.title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon width={22} height={22} />
                </span>
                <div>
                  <p className="font-extrabold leading-tight">{item.title}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- المجموعات ---------- */}
      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow={dict.nav.courses} title={dict.home.groupsTitle} text={dict.home.groupsSubtitle} center />
          <div className="grid gap-6 md:grid-cols-3">
            {sortedGroups.map((g) => (
              <GroupCard key={g.slug} group={g} locale={locale} count={courseCount(locale, coursesInGroup(g.slug).length)} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ليش كلية المركز ---------- */}
      <section className="section bg-surface">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-card">
            <Image src="/images/hero/about.webp" alt={dict.about.title} fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
          </div>
          <div>
            <SectionHeading eyebrow={dict.nav.about} title={dict.home.whyTitle} className="mb-6" />
            <ul className="space-y-5">
              {dict.home.whyItems.map((item) => (
                <li key={item.title} className="flex gap-4">
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
            <p className="mt-6 rounded-xl border border-brand-200 bg-white p-4 text-sm text-ink-soft">{dict.course.careerDisclaimer}</p>
            <Link href={href(locale, "/about")} className="btn btn-outline mt-6">
              {dict.common.readMore}
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- أبرز الدورات ---------- */}
      <section className="section">
        <div className="container-x">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">{dict.nav.courses}</span>
              <h2 className="h2">{dict.home.coursesTitle}</h2>
              <p className="lead mt-2">{dict.home.coursesSubtitle}</p>
            </div>
            <Link href={href(locale, "/courses")} className="btn btn-outline">
              {dict.common.allCourses}
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => (
              <CourseCard key={c.slug} course={c} locale={locale} groupName={groupName(c.group)} labels={{ hours: dict.common.hours, sessions: dict.common.sessions, view: dict.common.viewCourse }} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- الخريجون ---------- */}
      <section className="section bg-brand-900 text-white">
        <div className="container-x">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow !text-brand-300">{dict.nav.graduates}</span>
              <h2 className="h2">{dict.home.graduatesTitle}</h2>
              <p className="mt-2 text-lg text-white/80">{dict.home.graduatesSubtitle}</p>
            </div>
            <Link href={href(locale, "/graduates")} className="btn btn-white">
              {dict.common.readMore}
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {someGraduates.map((g) => {
              const course = getCourse(g.course);
              return (
                <div key={g.slug} className="text-center">
                  <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl bg-brand-800">
                    <Image src={g.image} alt={t(g.name, locale)} fill sizes="(min-width: 1024px) 150px, 25vw" className="object-cover" />
                  </div>
                  <p className="mt-2 font-bold leading-tight">{t(g.name, locale)}</p>
                  <p className="text-xs leading-snug text-white/70">{t(course?.name, locale)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- الفيديو ---------- */}
      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow={dict.gallery.videosTitle} title={dict.home.videoTitle} center />
          <div className="grid gap-6 md:grid-cols-2">
            {videos.map((v) => (
              <YouTubeEmbed key={v.youtubeId} id={v.youtubeId} title={t(v.title, locale)} thumbnail={v.thumbnail} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- الأخبار ---------- */}
      <section className="section bg-surface">
        <div className="container-x">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">{dict.nav.news}</span>
              <h2 className="h2">{dict.home.newsTitle}</h2>
            </div>
            <Link href={href(locale, "/news")} className="btn btn-outline">
              {dict.news.allNews}
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {latestNews.map((p) => (
              <NewsCard key={p.slug} post={p} locale={locale} readMore={dict.common.readMore} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- الشركاء ---------- */}
      <section className="border-y border-line py-10">
        <div className="container-x">
          <p className="mb-6 text-center text-sm font-bold text-ink-muted">{dict.home.partnersTitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {partners.map((p) => (
              <Image key={p.slug} src={p.image} alt={t(p.name, locale)} width={120} height={120} className="h-16 w-auto rounded-full object-contain md:h-20" />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- سجّل اهتمامك ---------- */}
      <section id="register" className="section">
        <div className="container-x grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="eyebrow">{dict.common.registerInterest}</span>
            <h2 className="h2">{dict.home.ctaTitle}</h2>
            <p className="lead mt-3">{dict.home.ctaText}</p>
            <ul className="mt-6 space-y-3 text-ink-soft">
              <li className="flex items-center gap-2">
                <CheckIcon className="text-brand-600" /> {dict.trust[3].text}
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="text-brand-600" /> {dict.course.contactForPrice}
              </li>
            </ul>
          </div>
          <div className="card p-6 md:p-8 lg:col-span-3">
            <LeadForm locale={locale} dict={dict.form} whatsappLabel={dict.common.whatsappLong} courses={courseOptions(locale)} source="home" />
          </div>
        </div>
      </section>
    </>
  );
}
