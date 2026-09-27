"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NewsCard } from "@/components/ui";
import { t } from "@/lib/i18n";
import { PageIntro, StatusBadge } from "../../_components/bits";
import { AddCard, CardTools, SiteSurface } from "../../_components/cardkit";
import { useAdmin } from "../../_lib/store";
import { blankNews } from "../../_lib/blanks";
import { newKey, useList } from "../../_lib/useList";

export default function NewsOverview() {
  const router = useRouter();
  const { data, locale } = useAdmin();
  const list = useList("news");
  const dict = data.dict(locale);

  const addPost = () => {
    const slug = newKey("news");
    list.add(blankNews(slug), "start");
    router.push(`/admin/news/${slug}?new=1`);
  };

  return (
    <div>
      <PageIntro
        title="الأخبار"
        text="الأخبار مرتّبة حسب التاريخ (الأحدث أول). آخر 3 أخبار بتظهر بالصفحة الرئيسية وبشريط «جديد» فوق. اضغط على خبر لتعديله."
        actions={
          <button type="button" className="btn btn-primary" onClick={addPost}>
            <Plus size={18} /> خبر جديد
          </button>
        }
      />
      <SiteSurface label={`صفحة الأخبار · ${data.news.length} خبر`}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" lang={locale}>
          <AddCard label="اكتب خبر جديد" onClick={addPost} className="min-h-[320px]" />
          {data.news.map((p) => (
            <div key={p.slug} className="edit-card relative">
              <NewsCard post={p} locale={locale} readMore={dict.common.readMore} />
              <Link href={`/admin/news/${p.slug}`} className="absolute inset-0 z-[2] rounded-2xl ring-brand-400 transition hover:ring-2" aria-label={`تعديل ${t(p.title, "ar")}`} />
              {!t(p.title, locale) && <p className="pointer-events-none absolute inset-x-5 top-[62%] z-[3] text-lg font-extrabold text-ink-muted">خبر بدون عنوان — اضغط للتعديل</p>}
              <StatusBadge status={list.status(p)} />
              <CardTools onDelete={() => list.remove(p.slug, t(p.title, "ar") || "خبر")} />
            </div>
          ))}
        </div>
      </SiteSurface>
    </div>
  );
}
