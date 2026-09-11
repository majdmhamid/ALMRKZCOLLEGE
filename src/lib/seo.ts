import type { Metadata } from "next";
import { site } from "@content/site";
import { LOCALES, ogLocale, t, type Locale } from "./i18n";

interface PageMeta {
  locale: Locale;
  /** المسار بدون بادئة اللغة، مثل "/courses/welding" */
  path: string;
  title: string;
  description: string;
  image?: string;
}

/**
 * يبني بيانات SEO لكل صفحة: العنوان، الوصف، الرابط الأساسي، hreflang للغتين، وبطاقة المشاركة.
 */
export function pageMetadata({ locale, path, title, description, image }: PageMeta): Metadata {
  const clean = path === "/" ? "" : path;
  const languages = Object.fromEntries(LOCALES.map((l) => [l, `${site.url}/${l}${clean}`]));
  return {
    title,
    description,
    alternates: {
      canonical: `${site.url}/${locale}${clean}`,
      languages: { ...languages, "x-default": `${site.url}/ar${clean}` },
    },
    openGraph: {
      title,
      description,
      url: `${site.url}/${locale}${clean}`,
      siteName: t(site.name, locale),
      locale: ogLocale(locale),
      type: "website",
      images: [{ url: image ?? "/images/hero/home.webp", width: 1920, height: 1280, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** بيانات Schema.org للكلية — تظهر لجوجل كمؤسسة تعليمية */
export function organizationJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${site.url}/#organization`,
    name: t(site.name, locale),
    alternateName: [site.name.ar, site.name.he, "Al-Merkaz College for Professional Training"],
    url: `${site.url}/${locale}`,
    logo: `${site.url}/images/brand/logo.png`,
    image: `${site.url}/images/hero/home.webp`,
    foundingDate: String(site.foundedYear),
    telephone: site.phoneIntl,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: t(site.address, locale),
      addressLocality: locale === "ar" ? "أم الفحم" : "אום אל-פחם",
      addressCountry: "IL",
    },
    sameAs: [site.social.facebook, site.social.youtube].filter(Boolean),
  };
}

export function courseJsonLd(locale: Locale, course: { name: string; description: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    url: course.url,
    inLanguage: locale,
    provider: { "@id": `${site.url}/#organization` },
  };
}
