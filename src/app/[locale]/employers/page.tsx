import type { Metadata } from "next";
import Link from "next/link";
import { getCourse } from "@content/courses";
import { BuildingIcon, ShieldIcon, UsersIcon, WrenchIcon, ArrowIcon } from "@/components/Icons";
import LeadForm from "@/components/LeadForm";
import { Breadcrumbs, PageHero, SectionHeading } from "@/components/ui";
import { courseOptions, localeParam } from "@/lib/content";
import { getDictionary, href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/employers", title: dict.employers.title, description: dict.employers.metaDescription, image: "/images/hero/employers.webp" });
}

const icons = [UsersIcon, ShieldIcon, WrenchIcon, BuildingIcon];

export default async function EmployersPage({ params }: Params) {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  const e = dict.employers;
  const height = getCourse("work-at-height")!;

  return (
    <>
      <PageHero title={e.title} text={e.intro} image="/images/hero/employers.webp">
        <Breadcrumbs className="mt-6 text-white/80" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: e.title }]} />
      </PageHero>

      <section className="section">
        <div className="container-x">
          <SectionHeading title={e.servicesTitle} center />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {e.services.map((s, i) => {
              const Icon = icons[i];
              return (
                <div key={s.title} className="card p-6">
                  <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <Icon width={26} height={26} />
                  </span>
                  <h3 className="text-lg font-extrabold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              );
            })}
          </div>
          <Link href={href(locale, `/courses/${height.group}/${height.slug}`)} className="btn btn-outline mt-8">
            {t(height.name, locale)}
            <ArrowIcon width={18} height={18} />
          </Link>
        </div>
      </section>

      <section className="section bg-brand-900 text-white">
        <div className="container-x max-w-4xl text-center">
          <h2 className="h2">{e.hiringTitle}</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/85">{e.hiringText}</p>
          <p className="mt-4 text-sm text-white/60">{dict.course.careerDisclaimer}</p>
        </div>
      </section>

      <section id="form" className="section">
        <div className="container-x grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="h2">{e.formTitle}</h2>
            <p className="lead mt-3">{e.formText}</p>
          </div>
          <div className="card p-6 md:p-8 lg:col-span-3">
            <LeadForm locale={locale} dict={dict.form} whatsappLabel={dict.common.whatsappLong} courses={courseOptions(locale)} source="employers" companyLabel={e.company} />
          </div>
        </div>
      </section>
    </>
  );
}
