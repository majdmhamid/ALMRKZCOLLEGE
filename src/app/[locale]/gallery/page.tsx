import type { Metadata } from "next";
import { gallery, galleryCategories, videos } from "@content/media";
import GalleryGrid from "@/components/GalleryGrid";
import { Breadcrumbs, PageHero, SectionHeading } from "@/components/ui";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { localeParam } from "@/lib/content";
import { getDictionary, href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/gallery", title: dict.gallery.title, description: dict.gallery.metaDescription });
}

export default async function GalleryPage({ params }: Params) {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero title={dict.gallery.title} text={dict.gallery.intro} image="/images/gallery/welding/1839470956260603.webp">
        <Breadcrumbs className="mt-6 text-ink-soft" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: dict.gallery.title }]} />
      </PageHero>

      <section className="section">
        <div className="container-x">
          <GalleryGrid
            items={gallery.map((g) => ({ src: g.src, category: g.category, alt: t(g.alt, locale) }))}
            categories={galleryCategories.map((c) => ({ slug: c.slug, label: t(c.label, locale) }))}
            allLabel={dict.gallery.all}
            closeLabel={dict.gallery.closeImage}
          />
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-x">
          <SectionHeading title={dict.gallery.videosTitle} />
          <div className="grid gap-6 md:grid-cols-2">
            {videos.map((v) => (
              <YouTubeEmbed key={v.youtubeId} id={v.youtubeId} title={t(v.title, locale)} thumbnail={v.thumbnail} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
