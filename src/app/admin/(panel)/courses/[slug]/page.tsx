"use client";

import { Trash2, Wand2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { Course } from "@content/types";
import CourseDetail from "@/components/CourseDetail";
import { CourseCard } from "@/components/ui";
import { t } from "@/lib/i18n";
import { PageIntro } from "../../../_components/bits";
import { SiteSurface } from "../../../_components/cardkit";
import { FieldGroup, LocalizedField, LocalizedListField, NumberField, SelectField, Toggle } from "../../../_components/fields";
import { ImageField } from "../../../_components/media";
import PageMini from "../../../_components/PageMini";
import SplitEditor from "../../../_components/SplitEditor";
import { useAdmin } from "../../../_lib/store";
import { slugify, useList } from "../../../_lib/useList";

export default function CourseEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, locale, published } = useAdmin();
  const list = useList("courses");
  const course = list.get(decodeURIComponent(slug));

  if (!course) {
    return <PageIntro title="الدورة مش موجودة" text="يمكن انحذفت. ارجع لقائمة الدورات." />;
  }

  const set = (patch: Partial<Course>) => list.patch(course.slug, patch);
  const group = data.getGroup(course.group) ?? data.groups[0];
  const dict = data.dict(locale);
  const isPublished = published.courses.some((c) => c.slug === course.slug);
  const others = data.coursesInGroup(group.slug).filter((c) => c.slug !== course.slug);
  const shown = course.image ? course : { ...course, image: group.image };

  const renameSlug = (next: string) => {
    const clean = next.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!clean || clean === course.slug || data.content.courses.some((c) => c.slug === clean)) return;
    list.patch(course.slug, { slug: clean });
    router.replace(`/admin/courses/${clean}`);
  };

  const form = (
    <>
      <FieldGroup title="الأساسيات">
        <LocalizedField label="اسم الدورة" value={course.name} onChange={(name) => set({ name })} placeholder={{ ar: "مثلاً: دورة لحام أرغون", he: "לדוגמה: קורס ריתוך ארגון" }} />
        <SelectField label="المجال" value={course.group} onChange={(g) => set({ group: g })} options={data.groups.map((g) => ({ value: g.slug, label: t(g.name, "ar") }))} />
        <ImageField label="صورة الدورة" value={course.image} onChange={(image) => set({ image })} folder="courses" hint="بتظهر على البطاقة وبأعلى صفحة الدورة. الأفضل صورة عرضية من الورشة." />
        <Toggle label="اعرضها بالصفحة الرئيسية" checked={!!course.featured} onChange={(featured) => set({ featured })} hint="بقسم «أبرز الدورات»." />
      </FieldGroup>

      <FieldGroup title="نص البطاقة" hint="سطرين قصار بيظهروا تحت اسم الدورة.">
        <LocalizedField label="ملخّص" value={course.summary} onChange={(summary) => set({ summary })} multiline rows={2} />
      </FieldGroup>

      <FieldGroup title="أعلى صفحة الدورة">
        <LocalizedField label="جملة جذّابة تحت الاسم" value={course.headline} onChange={(headline) => set({ headline })} placeholder={{ ar: "مثلاً: أطلق مسيرتك المهنية في اللحام", he: "" }} />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="عدد الساعات" value={course.hours} onChange={(hours) => set({ hours })} suffix={dict.common.hours} />
          <NumberField label="عدد اللقاءات" value={course.sessions} onChange={(sessions) => set({ sessions })} suffix={dict.common.sessions} />
        </div>
        <LocalizedField label="الدوام" value={course.schedule} onChange={(schedule) => set({ schedule })} />
      </FieldGroup>

      <FieldGroup title="محتوى صفحة الدورة">
        <LocalizedListField label="فقرات الوصف" value={course.description} onChange={(description) => set({ description })} multiline addLabel="أضف فقرة" hint="اختياري — كل فقرة بتظهر لحالها." />
        <LocalizedField label="لمين الدورة؟" value={course.audience} onChange={(audience) => set({ audience })} multiline />
        <LocalizedListField label="شو رح تتعلّم" value={course.topics} onChange={(topics) => set({ topics })} addLabel="أضف موضوع" />
        <LocalizedListField label="شروط القبول" value={course.requirements} onChange={(requirements) => set({ requirements })} addLabel="أضف شرط" />
        <LocalizedField label="الشهادة" value={course.certificate} onChange={(certificate) => set({ certificate })} multiline rows={2} />
      </FieldGroup>

      <FieldGroup title="المنحة وملاحظات">
        <Toggle
          label="الدورة ملائمة للحصول على منحة (شوفار)"
          checked={course.scholarship}
          onChange={(scholarship) => set({ scholarship })}
          hint={
            <>
              بتظهر بالصفحة بالصياغة الثابتة: «{dict.course.scholarshipText}»
            </>
          }
        />
        <LocalizedField label="ملاحظة إضافية (اختياري)" value={course.notes} onChange={(notes) => set({ notes: notes.ar || notes.he ? notes : undefined })} multiline rows={2} />
        <p className="rounded-xl bg-brand-50 p-3 text-sm text-ink-soft">
          تذكير: الأسعار ما بتنكتب على الموقع، وممنوع أي وعد بتشغيل. الصفحة بتعرض تلقائياً «{dict.course.contactForPrice}».
        </p>
      </FieldGroup>

      <FieldGroup title="متقدّم">
        {isPublished ? (
          <p className="text-sm text-ink-soft">
            رابط الصفحة: <span dir="ltr" className="font-mono font-bold">/courses/{course.group}/{course.slug}</span> — ما بتغيّر بعد النشر حتى ما تخرب الروابط القديمة.
          </p>
        ) : (
          <div>
            <p className="label">رابط الصفحة (أحرف إنجليزية)</p>
            <p className="text-sm text-ink-soft">
              الحالي: <span dir="ltr" className="font-mono font-bold">/courses/{course.group}/{course.slug}</span> — بتقدر تغيّره قبل أول نشر فقط.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <input className="input max-w-xs py-2" dir="ltr" placeholder="welding-argon" onBlur={(e) => renameSlug(e.target.value)} onKeyDown={(e) => e.key === "Enter" && renameSlug((e.target as HTMLInputElement).value)} />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => renameSlug(slugify(course.name.ar, "course", data.content.courses.map((c) => c.slug)))}>
                <Wand2 size={16} /> اقترح من الاسم
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50"
          onClick={() => {
            list.remove(course.slug, t(course.name, "ar") || "دورة");
            router.push("/admin/courses");
          }}
        >
          <Trash2 size={16} /> احذف الدورة
        </button>
      </FieldGroup>
    </>
  );

  return (
    <SplitEditor
      backHref="/admin/courses"
      backLabel="كل الدورات"
      title={t(course.name, "ar") || "دورة جديدة"}
      status={list.status(course)}
      form={form}
      previews={[
        {
          key: "page",
          label: "صفحة الدورة",
          icon: "page",
          node: (
            <div className="site-frame" lang={locale}>
              <div className="site-frame-bar">
                <i />
                <i />
                <i />
                <span className="ms-2 font-bold" dir="ltr">
                  almrkz.net/{locale}/courses/{course.group}/{course.slug}
                </span>
              </div>
              <PageMini>
                <CourseDetail course={shown} group={group} others={others} reel={data.reelFor(course.slug, group.slug)} site={data.site} dict={dict} locale={locale} courseOptions={data.courseOptions(locale)} preview />
              </PageMini>
            </div>
          ),
        },
        {
          key: "card",
          label: "البطاقة",
          icon: "card",
          node: (
            <SiteSurface tone="surface" label="بطاقة الدورة بقائمة الدورات">
              <div className="mx-auto max-w-sm" lang={locale}>
                <CourseCard course={shown} locale={locale} groupName={t(group.shortName, locale)} labels={{ hours: dict.common.hours, sessions: dict.common.sessions, view: dict.common.viewCourse }} />
              </div>
            </SiteSurface>
          ),
        },
      ]}
    />
  );
}
