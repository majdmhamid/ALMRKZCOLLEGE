import "server-only";
import { cache } from "react";
import { getContent, getPublishedContent } from "@/lib/cms/content";
import { buildSiteData } from "@/lib/site-data";

/** بيانات الموقع للطلب الحالي (المنشور، أو المسودة في وضع المعاينة) */
export const getSiteData = cache(async () => buildSiteData(await getContent()));

/** بيانات المحتوى المنشور — لـ generateStaticParams و sitemap (خارج الطلبات) */
export const getPublishedSiteData = async () => buildSiteData(await getPublishedContent());
