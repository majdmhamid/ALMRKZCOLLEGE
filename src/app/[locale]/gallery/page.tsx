import type { Metadata } from "next";
import GalleryGrid from "@/components/GalleryGrid";
import { Breadcrumbs, PageHero, SectionHeading } from "@/components/ui";
import VideoCard from "@/components/VideoCard";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { localeParam } from "@/lib/content";
import { getSiteData } from "@/lib/data";
import { href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const data = await getSiteData();
  const dict = data.dict(locale);
  return pageMetadata({ siteName: data.site.name, locale, path: "/gallery", title: dict.gallery.title, description: dict.gallery.metaDescription });
}

export default async function GalleryPage({ params }: Params) {
  const locale = await localeParam(params);
  const data = await getSiteData();
  const { gallery, galleryCategories, promoVideo, reels, videos } = data;
  const dict = data.dict(locale);

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

      <section id="video-section" className="section bg-surface">
        <div className="container-x">
          <SectionHeading title={dict.gallery.videosTitle} />
          <div className="grid gap-6 md:grid-cols-3">
            <VideoCard src={promoVideo.src} poster={promoVideo.poster} title={t(promoVideo.title, locale)} orientation="landscape" playLabel={dict.common.playVideo} duration={`${promoVideo.seconds} ${dict.common.seconds}`} />
            {videos.map((v) => (
              <YouTubeEmbed key={v.youtubeId} id={v.youtubeId} title={t(v.title, locale)} thumbnail={v.thumbnail} />
            ))}
          </div>
          <h3 className="mb-6 mt-12 text-xl font-extrabold">{dict.home.reelsTitle}</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {reels.map((r) => (
              <VideoCard key={r.slug} src={r.src} poster={r.poster} title={t(r.title, locale)} orientation="portrait" playLabel={dict.common.playVideo} duration={`${r.seconds} ${dict.common.seconds}`} sizes="(min-width: 768px) 25vw, 50vw" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
