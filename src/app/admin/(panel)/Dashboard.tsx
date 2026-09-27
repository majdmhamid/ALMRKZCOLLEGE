"use client";

import { ArrowLeft, BookOpen, Building2, CheckCircle2, Clapperboard, FileSignature, Handshake, Images, Newspaper, Type, UserRound, Users, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { t } from "@/lib/i18n";
import PublishButton from "../_components/PublishButton";
import { useAdmin } from "../_lib/store";

export default function Dashboard() {
  const { data, changes, publishedAt, locale, signingStats, adminName } = useAdmin();

  const tiles: { href: string; title: string; text: string; icon: LucideIcon; images: string[]; count?: number; external?: boolean }[] = [
    { href: "/admin/courses", title: "الدورات والمجالات", text: "أضف دورة، عدّل الساعات والمحتوى، رتّب البطاقات", icon: BookOpen, images: data.courses.slice(0, 4).map((c) => c.image), count: data.courses.length },
    { href: "/admin/graduates", title: "الخريجون", text: "زيد أو نقّص خريج على نفس بطاقة الموقع", icon: Users, images: data.graduates.slice(0, 4).map((g) => g.image), count: data.graduates.length },
    { href: "/admin/news", title: "الأخبار", text: "خبر جديد بصور وعنوان ونص", icon: Newspaper, images: data.news.slice(0, 4).map((n) => n.images[0]), count: data.news.length },
    { href: "/admin/gallery", title: "معرض الصور", text: "ارفع صور الورشات والفعاليات", icon: Images, images: data.gallery.slice(0, 4).map((g) => g.src), count: data.gallery.length },
    { href: "/admin/videos", title: "الفيديوهات", text: "الفيديو التعريفي، الريلز، ويوتيوب", icon: Clapperboard, images: [data.promoVideo.poster, ...data.reels.slice(0, 3).map((r) => r.poster)], count: data.reels.length + data.videos.length + 1 },
    { href: "/admin/staff", title: "الطاقم", text: "صور وأسماء ووظائف الطاقم", icon: UserRound, images: data.staff.slice(0, 4).map((s) => s.image), count: data.staff.length },
    { href: "/admin/partners", title: "الشركاء", text: "لوغوهات الجهات الشريكة والمعتمِدة", icon: Handshake, images: data.partners.slice(0, 4).map((p) => p.image), count: data.partners.length },
    { href: "/admin/site", title: "معلومات الكلية", text: "الهاتف، الواتساب، العنوان، ساعات الدوام", icon: Building2, images: [] },
    { href: "/admin/texts", title: "نصوص الموقع", text: "العناوين والجمل بكل صفحات الموقع", icon: Type, images: [] },
    {
      href: "/admin/documents",
      title: "التوقيع الإلكتروني",
      text: signingStats ? `${signingStats.waiting} بانتظار التوقيع · ${signingStats.signed} موقّعة` : "رفع مستندات وإرسالها للطلاب للتوقيع",
      icon: FileSignature,
      images: [],
      count: signingStats?.total,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-500 p-6 text-white shadow-lift md:p-8">
        <div className="bg-dots absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm font-bold text-white/80">{t(data.site.name, "ar")}</p>
            <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">أهلاً {adminName.includes("@") ? "" : adminName}</h1>
            <p className="mt-2 max-w-xl text-white/90">كل تعديل هون بينحفظ كمسودة، والزوار ما بشوفوه إلا لما تضغط «نشر». بتقدر دايماً ترجع لنسخة قديمة.</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-ink shadow-card">
            {changes.length ? (
              <>
                <p className="text-sm font-bold text-ink-soft">تعديلات بانتظار النشر</p>
                <p className="my-1 text-4xl font-extrabold text-brand-700">{changes.length}</p>
                <PublishButton count={changes.length} />
              </>
            ) : (
              <p className="flex items-center gap-2 font-bold text-brand-700">
                <CheckCircle2 size={20} /> الموقع محدّث — ما في تعديلات معلّقة
              </p>
            )}
            {publishedAt && <p className="mt-2 text-xs text-ink-muted">آخر نشر: {new Date(publishedAt).toLocaleString("ar-EG-u-nu-latn", { dateStyle: "medium", timeStyle: "short" })}</p>}
          </div>
        </div>
      </div>

      {changes.length > 0 && (
        <div className="card mb-8 p-5">
          <p className="mb-3 font-extrabold">آخر التعديلات (لسا ما انتشرت)</p>
          <ul className="flex flex-wrap gap-2">
            {changes.slice(0, 12).map((c, i) => (
              <li key={i} className="rounded-full bg-surface px-3 py-1.5 text-sm font-bold text-ink-soft">
                {c.label}
              </li>
            ))}
            {changes.length > 12 && <li className="px-2 py-1.5 text-sm text-ink-muted">و{changes.length - 12} غيرها…</li>}
          </ul>
        </div>
      )}

      <h2 className="mb-4 text-lg font-extrabold">شو بدك تعدّل؟</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" lang={locale}>
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const body = (
            <>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-lg font-extrabold">
                    {tile.title}
                    {tile.count !== undefined && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-muted">{tile.count}</span>}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-ink-soft">{tile.text}</p>
                </div>
                <ArrowLeft size={18} className="mt-1 text-brand-600 transition-transform group-hover:-translate-x-1" />
              </div>
              {tile.images.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  {tile.images.map((src, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-brand-50">
                      {src && <Image src={src} alt="" fill sizes="80px" className={tile.href.endsWith("partners") ? "object-contain p-1" : "object-cover"} />}
                    </div>
                  ))}
                </div>
              )}
            </>
          );
          return tile.external ? (
            <a key={tile.href} href={tile.href} className="card card-hover group block p-5">
              {body}
            </a>
          ) : (
            <Link key={tile.href} href={tile.href} className="card card-hover group block p-5">
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
