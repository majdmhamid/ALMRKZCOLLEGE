import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@content/courses";
import { getPost, news } from "@content/news";
import { ArrowIcon } from "@/components/Icons";
import { Breadcrumbs, NewsCard, PageHero } from "@/components/ui";
import { localeParam } from "@/lib/content";
import { formatDate, getDictionary, href, LOCALES, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  return LOCALES.flatMap((locale) => news.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return pageMetadata({ locale, path: `/news/${post.slug}`, title: t(post.title, locale), description: t(post.excerpt, locale), image: post.images[0] });
}

export default async function NewsPostPage({ params }: Params) {
  const locale = await localeParam(params);
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const dict = getDictionary(locale);
  const course = post.relatedCourse ? getCourse(post.relatedCourse) : undefined;
  const more = news.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <PageHero title={t(post.title, locale)} image={post.images[0]} eyebrow={formatDate(post.date, locale)}>
        <Breadcrumbs className="mt-6 text-ink-soft" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: dict.news.title, to: href(locale, "/news") }, { label: t(post.title, locale) }]} />
      </PageHero>

      <article className="section">
        <div className="container-x max-w-4xl">
          <div className="space-y-4 text-lg leading-relaxed text-ink-soft">
            {post.body[locale].map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {course && (
            <p className="mt-6 rounded-xl bg-brand-50 p-4">
              <span className="font-bold">{dict.news.relatedCourse}: </span>
              <Link href={href(locale, `/courses/${course.group}/${course.slug}`)} className="font-bold text-brand-700 hover:underline">
                {t(course.name, locale)}
              </Link>
            </p>
          )}
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
            {post.images.map((src, i) => (
              <div key={src} className={`relative overflow-hidden rounded-xl ${i === 0 ? "col-span-2 aspect-[16/9] md:col-span-3" : "aspect-[4/3]"}`}>
                <Image src={src} alt={t(post.title, locale)} fill sizes={i === 0 ? "(min-width: 1024px) 900px, 100vw" : "(min-width: 768px) 300px, 50vw"} className="object-cover" />
              </div>
            ))}
          </div>
          <Link href={href(locale, "/news")} className="btn btn-outline mt-10">
            <ArrowIcon width={18} height={18} className="rotate-180" />
            {dict.news.backToNews}
          </Link>
        </div>
      </article>

      {more.length > 0 && (
        <section className="section bg-surface">
          <div className="container-x">
            <h2 className="h2 mb-8">{dict.news.allNews}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {more.map((p) => (
                <NewsCard key={p.slug} post={p} locale={locale} readMore={dict.common.readMore} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
