/**
 * صفحة الدورة كاملة (بدون بيانات جوجل) — مكوّن نقي بدون جلب بيانات:
 * يُستعمل في صفحة الدورة على الموقع، وفي المعاينة الحيّة داخل لوحة التحكم (مع preview).
 */
import Link from "next/link";
import type { Dictionary } from "@content/i18n";
import type { Course, Group, LocalVideo } from "@content/types";
import { AwardIcon, CalendarIcon, ClockIcon, CompassIcon, GiftIcon, LayersIcon, PhoneIcon, WhatsAppIcon } from "@/components/Icons";
import LeadForm from "@/components/LeadForm";
import VideoCard from "@/components/VideoCard";
import { Breadcrumbs, CourseCard, PageHero, delay } from "@/components/ui";
import { href, t, type Locale } from "@/lib/i18n";
import type { Site } from "@/lib/site-data";

interface Props {
  course: Course;
  group: Group;
  /** باقي دورات المجموعة */
  others: Course[];
  reel?: LocalVideo;
  site: Site;
  dict: Dictionary;
  locale: Locale;
  courseOptions: { value: string; label: string }[];
  /** معاينة لوحة التحكم: الاستمارة تظهر كشكل ثابت بدون إرسال */
  preview?: boolean;
}

export default function CourseDetail({ course, group, others, reel, site, dict, locale, courseOptions, preview }: Props) {
  const d = dict.course;

  const info = [
    { icon: ClockIcon, label: d.hours, value: `${course.hours} ${dict.common.hours}` },
    { icon: LayersIcon, label: d.sessions, value: `${course.sessions} ${dict.common.sessions}` },
    { icon: CalendarIcon, label: d.schedule, value: t(course.schedule, locale) },
    { icon: CalendarIcon, label: d.nextStart, value: d.nextStartValue, highlight: true },
  ];

  return (
    <>
      <PageHero title={t(course.name, locale)} text={t(course.headline, locale)} image={course.image} eyebrow={t(group.name, locale)}>
        <Breadcrumbs
          className="mt-6 text-ink-soft"
          items={[
            { label: dict.common.breadcrumbHome, to: href(locale) },
            { label: dict.courses.title, to: href(locale, "/courses") },
            { label: t(group.name, locale), to: href(locale, `/courses/${group.slug}`) },
            { label: t(course.name, locale) },
          ]}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#form" className="btn btn-primary">
            {d.registerTitle}
          </a>
          <a href={site.whatsappUrl} target="_blank" rel="noopener" className="btn btn-whatsapp">
            <WhatsAppIcon />
            {dict.common.whatsapp}
          </a>
        </div>
      </PageHero>

      {/* شريط معلومات الدورة (بطاقات صغيرة تظهر تباعاً) */}
      <section className="border-b border-line bg-surface">
        <div className="container-x grid grid-cols-2 gap-3 py-5 md:grid-cols-4">
          {info.map((it, i) => (
            <div key={it.label} data-reveal style={delay(i * 80)} className={`flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-card ${it.highlight ? "border-brand-300" : "border-line"}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${it.highlight ? "bg-brand-600 text-white" : "bg-brand-100 text-brand-700"}`}>
                <it.icon width={20} height={20} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-muted">{it.label}</p>
                <p className={`text-sm font-bold leading-snug ${it.highlight ? "text-brand-700" : ""}`}>{it.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-3">
          {/* ---------- المحتوى ---------- */}
          <div className="space-y-10 lg:col-span-2">
            {course.description && (
              <div data-reveal className="space-y-4 text-lg leading-relaxed text-ink-soft">
                {course.description[locale].map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            <div data-reveal>
              <h2 className="h3 mb-3">{d.forWhom}</h2>
              <p className="leading-relaxed text-ink-soft">{t(course.audience, locale)}</p>
            </div>

            <div data-reveal>
              <h2 className="h3 mb-4">{d.whatYouLearn}</h2>
              <ul className="check-list space-y-3">
                {course.topics[locale].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div data-reveal>
              <h2 className="h3 mb-4">{d.requirements}</h2>
              <ul className="check-list space-y-3">
                {course.requirements[locale].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div data-reveal className="card flex gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <AwardIcon width={26} height={26} />
              </span>
              <div>
                <h2 className="text-lg font-extrabold">{d.certificate}</h2>
                <p className="mt-1 leading-relaxed text-ink-soft">{t(course.certificate, locale)}</p>
              </div>
            </div>

            {course.scholarship && (
              <div data-reveal className="flex gap-4 rounded-2xl border border-brand-300 bg-brand-50 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <GiftIcon width={26} height={26} />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold">{d.scholarshipTitle}</h2>
                  <p className="mt-1 leading-relaxed">{d.scholarshipText}</p>
                </div>
              </div>
            )}

            <div data-reveal className="rounded-2xl border border-line p-5">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <CompassIcon width={26} height={26} />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold">{d.careerTitle}</h2>
                  <p className="mt-1 leading-relaxed text-ink-soft">{d.careerText}</p>
                </div>
              </div>
              <p className="mt-4 border-t border-line pt-3 text-sm font-bold text-ink-soft">{d.careerDisclaimer}</p>
            </div>

            {course.notes && (
              <p data-reveal className="rounded-xl bg-surface p-4 text-sm">
                <strong>{d.notes}:</strong> {t(course.notes, locale)}
              </p>
            )}

            <p className="text-sm text-ink-muted">{d.contactForPrice}</p>
          </div>

          {/* ---------- العمود الجانبي ---------- */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div data-reveal="start" className="card hidden p-6 lg:block">
              <h2 className="mb-4 text-lg font-extrabold">{d.infoTitle}</h2>
              <dl className="space-y-4">
                {info.map((it) => (
                  <div key={it.label} className="flex items-start gap-3">
                    <it.icon className="mt-0.5 shrink-0 text-brand-600" />
                    <div>
                      <dt className="text-xs text-ink-muted">{it.label}</dt>
                      <dd className={`font-bold ${it.highlight ? "text-brand-700" : ""}`}>{it.value}</dd>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3">
                  <LayersIcon className="mt-0.5 shrink-0 text-brand-600" />
                  <div>
                    <dt className="text-xs text-ink-muted">{d.group}</dt>
                    <dd className="font-bold">
                      <Link href={href(locale, `/courses/${group.slug}`)} className="hover:underline">
                        {t(group.name, locale)}
                      </Link>
                    </dd>
                  </div>
                </div>
              </dl>
              <div className="mt-6 flex flex-col gap-2">
                <a href={site.whatsappUrl} target="_blank" rel="noopener" className="btn btn-whatsapp">
                  <WhatsAppIcon />
                  {dict.common.whatsappLong}
                </a>
                <a href={`tel:${site.phoneIntl}`} className="btn btn-outline">
                  <PhoneIcon />
                  <span dir="ltr">{site.phone}</span>
                </a>
              </div>
            </div>

            {reel && (
              <div data-reveal="scale" className="card p-4">
                <h2 className="mb-3 text-base font-extrabold">{d.videoTitle}</h2>
                <VideoCard src={reel.src} poster={reel.poster} title={t(reel.title, locale)} orientation="portrait" playLabel={dict.common.playVideo} duration={`${reel.seconds} ${dict.common.seconds}`} className="mx-auto max-w-[280px]" sizes="280px" />
              </div>
            )}

            <div id="form" data-reveal="scale" className="card scroll-mt-28 border-brand-200 p-6 shadow-lift">
              <h2 className="text-lg font-extrabold">{d.registerTitle}</h2>
              <p className="mb-4 text-sm text-ink-soft">{d.registerText}</p>
              {preview ? (
                <FormPlaceholder dict={dict} whatsappLabel={dict.common.whatsapp} courseName={t(course.name, locale)} />
              ) : (
                <LeadForm locale={locale} dict={dict.form} whatsappLabel={dict.common.whatsapp} whatsappUrl={site.whatsappUrl} courses={courseOptions} defaultCourse={course.slug} source={`course:${course.slug}`} compact />
              )}
            </div>
          </aside>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section bg-surface">
          <div className="container-x">
            <h2 className="h2 mb-8">{d.otherCourses}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((c, i) => (
                <CourseCard key={c.slug} course={c} locale={locale} labels={{ hours: dict.common.hours, sessions: dict.common.sessions, view: dict.common.viewCourse }} style={delay(i * 100)} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/** شكل ثابت للاستمارة (للمعاينة فقط) — نفس الحقول، بدون إرسال */
function FormPlaceholder({ dict, whatsappLabel, courseName }: { dict: Dictionary; whatsappLabel: string; courseName: string }) {
  const f = dict.form;
  const field = (label: string, required?: boolean, value = "") => (
    <div>
      <span className="label">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <div className="input min-h-11 bg-surface text-ink-muted">{value}</div>
    </div>
  );
  return (
    <div className="pointer-events-none select-none space-y-4 opacity-70" aria-hidden="true">
      <div className="space-y-4">
        {field(f.name, true)}
        {field(f.phone, true)}
        {field(f.course, false, courseName)}
        {field(f.email)}
        {field(f.message)}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="btn btn-primary btn-lg">{f.submit}</span>
        <span className="btn btn-whatsapp">
          <WhatsAppIcon />
          {whatsappLabel}
        </span>
      </div>
      <p className="text-xs text-ink-muted">{f.privacy}</p>
    </div>
  );
}
