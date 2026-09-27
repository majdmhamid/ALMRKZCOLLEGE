"use client";

import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { NewsPost } from "@content/types";
import NewsArticle from "@/components/NewsArticle";
import { NewsCard } from "@/components/ui";
import { t } from "@/lib/i18n";
import { PageIntro } from "../../../_components/bits";
import { SiteSurface } from "../../../_components/cardkit";
import { FieldGroup, LocalizedField, LocalizedListField, SelectField, TextField } from "../../../_components/fields";
import ImagesField from "../../../_components/ImagesField";
import PageMini from "../../../_components/PageMini";
import SplitEditor from "../../../_components/SplitEditor";
import { PLACEHOLDER_IMAGE } from "../../../_lib/blanks";
import { useAdmin } from "../../../_lib/store";
import { useList } from "../../../_lib/useList";

export default function NewsEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, locale } = useAdmin();
  const list = useList("news");
  const post = list.get(decodeURIComponent(slug));
  if (!post) return <PageIntro title="الخبر مش موجود" text="يمكن انحذف. ارجع لقائمة الأخبار." />;

  const set = (patch: Partial<NewsPost>) => list.patch(post.slug, patch);
  const dict = data.dict(locale);
  const shown = post.images.length ? post : { ...post, images: [PLACEHOLDER_IMAGE] };
  const related = post.relatedCourse ? data.getCourse(post.relatedCourse) : undefined;
  const more = data.news.filter((p) => p.slug !== post.slug).slice(0, 3);

  const form = (
    <>
      <FieldGroup title="الخبر">
        <LocalizedField label="العنوان" value={post.title} onChange={(title) => set({ title })} />
        <TextField label="التاريخ" type="date" dir="ltr" value={post.date} onChange={(date) => date && set({ date })} />
        <LocalizedField label="جملة مختصرة (بتظهر على البطاقة)" value={post.excerpt} onChange={(excerpt) => set({ excerpt })} multiline rows={2} />
        <LocalizedListField label="نص الخبر" value={post.body} onChange={(body) => set({ body })} multiline addLabel="أضف فقرة" hint="كل فقرة لحالها." />
      </FieldGroup>
      <FieldGroup title="الصور" hint="أول صورة هي الغلاف (على البطاقة وبأعلى الخبر). بتقدر تسحب كم صورة مرة وحدة لهون.">
        <ImagesField label="صور الخبر" value={post.images.filter((s) => s !== PLACEHOLDER_IMAGE)} onChange={(images) => set({ images: images.length ? images : [PLACEHOLDER_IMAGE] })} folder="news" />
      </FieldGroup>
      <FieldGroup title="إضافات">
        <SelectField
          label="دورة مرتبطة بالخبر (اختياري)"
          value={post.relatedCourse ?? ""}
          onChange={(v) => set({ relatedCourse: v || undefined })}
          options={[{ value: "", label: "— بدون —" }, ...data.courses.map((c) => ({ value: c.slug, label: t(c.name, "ar") }))]}
          hint="بيظهر بآخر الخبر رابط لصفحة الدورة."
        />
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50"
          onClick={() => {
            list.remove(post.slug, t(post.title, "ar") || "خبر");
            router.push("/admin/news");
          }}
        >
          <Trash2 size={16} /> احذف الخبر
        </button>
      </FieldGroup>
    </>
  );

  return (
    <SplitEditor
      backHref="/admin/news"
      backLabel="كل الأخبار"
      title={t(post.title, "ar") || "خبر جديد"}
      status={list.status(post)}
      form={form}
      previews={[
        {
          key: "page",
          label: "صفحة الخبر",
          icon: "page",
          node: (
            <div className="site-frame" lang={locale}>
              <div className="site-frame-bar">
                <i />
                <i />
                <i />
                <span className="ms-2 font-bold" dir="ltr">
                  almrkz.net/{locale}/news/{post.slug}
                </span>
              </div>
              <PageMini>
                <NewsArticle post={shown} relatedCourse={related} more={more} dict={dict} locale={locale} />
              </PageMini>
            </div>
          ),
        },
        {
          key: "card",
          label: "البطاقة",
          icon: "card",
          node: (
            <SiteSurface label="بطاقة الخبر">
              <div className="mx-auto max-w-sm" lang={locale}>
                <NewsCard post={shown} locale={locale} readMore={dict.common.readMore} />
              </div>
            </SiteSurface>
          ),
        },
      ]}
    />
  );
}
