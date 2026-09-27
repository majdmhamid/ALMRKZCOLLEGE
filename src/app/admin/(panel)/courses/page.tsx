"use client";

import { Pencil, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Group } from "@content/types";
import { CourseCard } from "@/components/ui";
import { courseCount, t } from "@/lib/i18n";
import { PageIntro, StatusBadge } from "../../_components/bits";
import { AddCard, CardTools } from "../../_components/cardkit";
import { Sortable, SortableItem } from "../../_components/Sortable";
import { useAdmin } from "../../_lib/store";
import { blankCourse, blankGroup } from "../../_lib/blanks";
import { slugify, useList } from "../../_lib/useList";

export default function CoursesOverview() {
  const router = useRouter();
  const { data, locale, draft } = useAdmin();
  const courses = useList("courses");
  const groups = useList("groups");
  const dict = data.dict(locale);
  const labels = { hours: dict.common.hours, sessions: dict.common.sessions, view: dict.common.viewCourse };

  const addCourse = (g: Group) => {
    const slug = slugify("", "course", draft.courses.map((c) => c.slug));
    courses.add(blankCourse(g, slug, data.coursesInGroup(g.slug).length + 1));
    router.push(`/admin/courses/${slug}?new=1`);
  };

  const addGroup = () => {
    const slug = slugify("", "field", draft.groups.map((g) => g.slug));
    groups.add(blankGroup(slug, data.groups.length + 1));
    router.push(`/admin/courses/group/${slug}?new=1`);
  };

  const moveInGroup =(group: string) => (from: string, to: string) => {
    const ids = data.coursesInGroup(group).map((c) => c.slug);
    const a = ids.indexOf(from);
    const b = ids.indexOf(to);
    if (a < 0 || b < 0) return;
    ids.splice(b, 0, ...ids.splice(a, 1));
    ids.forEach((slug, i) => courses.patch(slug, { order: i + 1 }));
  };

  return (
    <div>
      <PageIntro
        title="الدورات والمجالات"
        text={
          <>
            كل مجال ودوراته — نفس بطاقات الموقع. <b>اضغط على دورة</b> لتعديل كل تفاصيلها مع معاينة حيّة لصفحتها، و<b>⭐</b> بتحدد إذا بتظهر بالصفحة الرئيسية. اسحب <b>⠿</b> لتغيير الترتيب.
          </>
        }
        actions={
          <button type="button" className="btn btn-outline" onClick={addGroup}>
            <Plus size={18} /> مجال جديد
          </button>
        }
      />

      <div className="space-y-12" lang={locale}>
        {data.groups.map((g) => {
          const list = data.coursesInGroup(g.slug);
          return (
            <section key={g.slug} className="site-frame">
              <div className="flex flex-wrap items-center gap-4 border-b border-line bg-surface p-4 md:p-5">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-100">
                  <Image src={g.image} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-xl font-extrabold">
                    {t(g.name, locale)}
                    <StatusBadgeInline status={groups.status(g)} />
                  </p>
                  <p className="text-sm text-ink-soft">
                    {t(g.tagline, locale)} · {courseCount(locale, list.length)}
                  </p>
                </div>
                <Link href={`/admin/courses/group/${g.slug}`} className="btn btn-outline btn-sm">
                  <Pencil size={16} /> تعديل المجال
                </Link>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => addCourse(g)}>
                  <Plus size={16} /> دورة جديدة
                </button>
              </div>
              <div className="grid gap-6 bg-white p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-3 xl:grid-cols-4">
                <Sortable onMove={moveInGroup(g.slug)}>
                  {list.map((c) => (
                    <SortableItem key={c.slug} id={c.slug} className="h-full">
                      {(handle) => (
                        <>
                          <CourseCard course={c.image ? c : { ...c, image: g.image }} locale={locale} groupName={t(g.shortName, locale)} labels={labels} className="h-full" />
                          {/* الضغط على البطاقة يفتح التعديل بدل رابط الموقع */}
                          <Link href={`/admin/courses/${c.slug}`} className="absolute inset-0 z-[2] rounded-2xl ring-brand-400 transition hover:ring-2" aria-label={`تعديل ${t(c.name, "ar")}`} />
                          {!t(c.name, locale) && <p className="pointer-events-none absolute inset-x-5 top-[62%] z-[3] text-lg font-extrabold text-ink-muted">دورة بدون اسم — اضغط للتعديل</p>}
                          <StatusBadge status={courses.status(c)} />
                          <CardTools
                            handle={handle}
                            onDelete={() => courses.remove(c.slug, t(c.name, "ar") || "دورة")}
                            extra={
                              <button
                                type="button"
                                title={c.featured ? "بتظهر بالصفحة الرئيسية — اضغط لإخفائها" : "اعرضها بالصفحة الرئيسية"}
                                aria-pressed={!!c.featured}
                                onClick={() => courses.patch(c.slug, { featured: !c.featured })}
                                className={`inline-flex items-center justify-center rounded-lg p-1.5 shadow-sm ring-1 ${c.featured ? "bg-amber-400 text-amber-950 ring-amber-500" : "bg-white/95 text-ink-muted ring-line hover:text-amber-600"}`}
                              >
                                <Star size={16} fill={c.featured ? "currentColor" : "none"} />
                              </button>
                            }
                          />
                          {c.featured && (
                            <span className="pointer-events-none absolute bottom-3 end-3 z-[3] inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-900">
                              <Star size={11} fill="currentColor" /> بالرئيسية
                            </span>
                          )}
                        </>
                      )}
                    </SortableItem>
                  ))}
                </Sortable>
                <AddCard label="دورة جديدة بهذا المجال" onClick={() => addCourse(g)} className="min-h-[340px]" />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadgeInline({ status }: { status: "new" | "changed" | null }) {
  if (!status) return null;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${status === "new" ? "bg-brand-600 text-white" : "bg-amber-400 text-amber-950"}`}>{status === "new" ? "جديد" : "معدّل"}</span>;
}
