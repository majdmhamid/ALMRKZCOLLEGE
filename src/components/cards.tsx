/**
 * بطاقات الأشخاص (الخريجون، الطاقم، الشركاء) — نفس البطاقة تُستعمل في الموقع وفي لوحة التحكم.
 * لوحة التحكم تمرّر "slots" (خانات قابلة للتعديل) بدل النص أو الصورة، فيبقى الشكل مطابقاً تماماً.
 */
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export interface CardSlots {
  /** يستبدل الصورة (مثلاً زر تغيير الصورة) — يوضع داخل إطار الصورة */
  image?: ReactNode;
  name?: ReactNode;
  sub?: ReactNode;
  /** طبقة فوق البطاقة (أزرار لوحة التحكم) */
  overlay?: ReactNode;
}

const Img = ({ src, alt, sizes, className }: { src: string; alt: string; sizes: string; className: string }) =>
  src ? <Image src={src} alt={alt} fill sizes={sizes} className={className} /> : null;

/* ---------- بطاقة خريج (صفحة الخريجين) ---------- */
export function GraduateCard({
  name,
  image,
  courseName,
  courseHref,
  graduateOfLabel,
  style,
  reveal = true,
  slots,
  className = "",
}: {
  name: string;
  image: string;
  courseName?: string;
  courseHref?: string;
  graduateOfLabel: string;
  style?: CSSProperties;
  reveal?: boolean;
  slots?: CardSlots;
  className?: string;
}) {
  return (
    <article data-reveal={reveal ? "" : undefined} style={style} className={`card card-hover relative overflow-hidden ${className}`}>
      <div className="relative aspect-[3/4] bg-brand-100">
        {slots?.image ?? <Img src={image} alt={name} sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />}
      </div>
      <div className="p-4">
        <h2 className="font-extrabold">{slots?.name ?? name}</h2>
        {slots?.sub ??
          (courseName && (
            <p className="mt-1 text-sm leading-snug text-ink-soft">
              {graduateOfLabel}{" "}
              {courseHref ? (
                <Link href={courseHref} className="text-brand-700 hover:underline">
                  {courseName}
                </Link>
              ) : (
                <span className="text-brand-700">{courseName}</span>
              )}
            </p>
          ))}
      </div>
      {slots?.overlay}
    </article>
  );
}

/* ---------- صورة خريج صغيرة (شريط الخريجين في الصفحة الرئيسية) ---------- */
export function GraduateTile({ name, image, courseName, style, className = "", reveal = true }: { name: string; image: string; courseName?: string; style?: CSSProperties; className?: string; reveal?: boolean }) {
  return (
    <div data-reveal={reveal ? "" : undefined} style={style} className={`group text-center ${className}`}>
      <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl bg-brand-100 shadow-card">
        <Img src={image} alt={name} sizes="(min-width: 1024px) 150px, 40vw" className="object-cover transition duration-700 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/60 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" aria-hidden="true" />
      </div>
      <p className="mt-2 font-bold leading-tight">{name}</p>
      <p className="text-xs leading-snug text-ink-soft">{courseName}</p>
    </div>
  );
}

/* ---------- بطاقة عضو طاقم (صفحة عن الكلية) ---------- */
export function StaffCard({ name, role, image, style, reveal = true, slots, className = "" }: { name: string; role: string; image: string; style?: CSSProperties; reveal?: boolean; slots?: CardSlots; className?: string }) {
  return (
    <div data-reveal={reveal ? "" : undefined} style={style} className={`relative text-center ${className}`}>
      <div className="relative mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-full border-4 border-white bg-brand-100 shadow-card">
        {slots?.image ?? <Img src={image} alt={name} sizes="180px" className="object-cover" />}
      </div>
      <h3 className="mt-3 font-extrabold">{slots?.name ?? name}</h3>
      <div className="text-sm leading-snug text-ink-soft">{slots?.sub ?? <p>{role}</p>}</div>
      {slots?.overlay}
    </div>
  );
}

/* ---------- شعار شريك (صفحة عن الكلية) ---------- */
export function PartnerBadge({ name, image, slots, className = "" }: { name: string; image: string; slots?: CardSlots; className?: string }) {
  return (
    <div className={`relative flex flex-col items-center gap-2 ${className}`}>
      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-white">
        {slots?.image ?? (image ? <Image src={image} alt="" width={120} height={120} className="h-24 w-24 rounded-full object-contain" /> : null)}
      </div>
      <span className="text-sm font-bold">{slots?.name ?? name}</span>
      {slots?.overlay}
    </div>
  );
}
