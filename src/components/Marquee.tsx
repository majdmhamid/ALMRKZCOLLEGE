import Image from "next/image";
import type { Partner } from "@content/types";
import { t, type Locale } from "@/lib/i18n";

/**
 * شريط لوغوهات الشركاء يتحرك باستمرار (CSS فقط). يتوقف عند تمرير الفأرة،
 * ويتحول لصف ثابت عند طلب تقليل الحركة.
 */
export default function Marquee({ partners, locale }: { partners: Partner[]; locale: Locale }) {
  const set = (dup: boolean) => (
    <ul className={`flex shrink-0 items-center justify-around gap-10 px-5 md:gap-16 ${dup ? "marquee-dup" : ""}`} aria-hidden={dup || undefined} style={{ minWidth: "100%" }}>
      {partners.map((p) => (
        <li key={p.slug} className="flex shrink-0 items-center gap-3">
          <Image src={p.image} alt={dup ? "" : t(p.name, locale)} width={96} height={96} className="h-14 w-14 rounded-full object-contain md:h-16 md:w-16" />
          <span className="whitespace-nowrap text-sm font-bold text-ink-soft">{t(p.name, locale)}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee" dir="ltr">
      <div className="marquee-track">
        {set(false)}
        {set(true)}
      </div>
    </div>
  );
}
