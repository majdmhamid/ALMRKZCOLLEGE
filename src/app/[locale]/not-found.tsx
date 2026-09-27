import NotFoundView, { type NotFoundTexts } from "@/components/NotFoundView";
import { getSiteData } from "@/lib/data";
import { LOCALES, type Locale } from "@/lib/i18n";

/** صفحة 404: النصوص من المحتوى (باللغتين)، واختيار اللغة حسب الرابط يتم في المتصفح */
export default async function NotFound() {
  const data = await getSiteData();
  const texts = Object.fromEntries(
    LOCALES.map((l) => {
      const dict = data.dict(l);
      return [l, { title: dict.notFound.title, text: dict.notFound.text, home: dict.notFound.home, courses: dict.nav.courses }];
    }),
  ) as Record<Locale, NotFoundTexts>;
  return <NotFoundView texts={texts} />;
}
