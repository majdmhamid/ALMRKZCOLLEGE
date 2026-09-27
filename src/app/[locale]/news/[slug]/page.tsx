import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NewsArticle from "@/components/NewsArticle";
import { localeParam } from "@/lib/content";
import { getPublishedSiteData, getSiteData } from "@/lib/data";
import { LOCALES, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const { news } = await getPublishedSiteData();
  return LOCALES.flatMap((locale) => news.map((p) => ({ locale, slug: p.slug })));
}
/** أخبار جديدة من لوحة التحكم تُبنى عند أول زيارة */
export const dynamicParams = true;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const { slug } = await params;
  const { site, getPost } = await getSiteData();
  const post = getPost(slug);
  if (!post) return {};
  return pageMetadata({ siteName: site.name, locale, path: `/news/${post.slug}`, title: t(post.title, locale), description: t(post.excerpt, locale), image: post.images[0] });
}

export default async function NewsPostPage({ params }: Params) {
  const locale = await localeParam(params);
  const { slug } = await params;
  const data = await getSiteData();
  const post = data.getPost(slug);
  if (!post) notFound();
  const relatedCourse = post.relatedCourse ? data.getCourse(post.relatedCourse) : undefined;
  const more = data.news.filter((p) => p.slug !== post.slug).slice(0, 3);

  return <NewsArticle post={post} relatedCourse={relatedCourse} more={more} dict={data.dict(locale)} locale={locale} />;
}
