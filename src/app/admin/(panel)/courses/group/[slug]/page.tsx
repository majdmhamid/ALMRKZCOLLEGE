"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import type { Group } from "@content/types";
import { GroupCard } from "@/components/ui";
import { courseCount, t } from "@/lib/i18n";
import { PageIntro } from "../../../../_components/bits";
import { SiteSurface } from "../../../../_components/cardkit";
import { FieldGroup, LocalizedField } from "../../../../_components/fields";
import { ImageField } from "../../../../_components/media";
import SplitEditor from "../../../../_components/SplitEditor";
import { useAdmin } from "../../../../_lib/store";
import { useList } from "../../../../_lib/useList";

const ICONS = [
  { src: "/images/icons/welding.png", label: "لحام" },
  { src: "/images/icons/hvac.png", label: "تكييف" },
  { src: "/images/icons/construction.png", label: "بناء" },
];

export default function GroupEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, locale, toast } = useAdmin();
  const list = useList("groups");
  const group = list.get(decodeURIComponent(slug));
  if (!group) return <PageIntro title="المجال مش موجود" />;

  const set = (patch: Partial<Group>) => list.patch(group.slug, patch);
  const count = data.coursesInGroup(group.slug).length;

  const form = (
    <>
      <FieldGroup title="اسم المجال">
        <LocalizedField label="الاسم الكامل" value={group.name} onChange={(name) => set({ name })} placeholder={{ ar: "مثلاً: الحديد واللحام", he: "" }} />
        <LocalizedField label="اسم قصير (للقوائم والبلاطات)" value={group.shortName} onChange={(shortName) => set({ shortName })} placeholder={{ ar: "مثلاً: اللحام", he: "" }} />
        <LocalizedField label="جملة قصيرة تحت الاسم" value={group.tagline} onChange={(tagline) => set({ tagline })} />
        <LocalizedField label="وصف المجال (بصفحة المجال)" value={group.description} onChange={(description) => set({ description })} multiline rows={4} />
      </FieldGroup>
      <FieldGroup title="الصور">
        <ImageField label="صورة المجال" value={group.image} onChange={(image) => set({ image })} folder="groups" aspect="aspect-[4/3]" />
        <div>
          <p className="label">الأيقونة</p>
          <div className="flex flex-wrap gap-3">
            {ICONS.map((ic) => (
              <button key={ic.src} type="button" onClick={() => set({ icon: ic.src })} aria-pressed={group.icon === ic.src} className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-xs font-bold ${group.icon === ic.src ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-300"}`}>
                <Image src={ic.src} alt="" width={40} height={40} />
                {ic.label}
              </button>
            ))}
          </div>
        </div>
      </FieldGroup>
      <FieldGroup title="حذف">
        {count ? (
          <p className="text-sm text-ink-soft">بهذا المجال {courseCount("ar", count)} — لازم تنقلهم لمجال ثاني أو تحذفهم قبل حذف المجال.</p>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50"
            onClick={() => {
              if (data.groups.length <= 1) return toast({ tone: "error", message: "لازم يضل مجال واحد على الأقل." });
              list.remove(group.slug, t(group.name, "ar") || "مجال");
              router.push("/admin/courses");
            }}
          >
            <Trash2 size={16} /> احذف المجال
          </button>
        )}
      </FieldGroup>
    </>
  );

  return (
    <SplitEditor
      backHref="/admin/courses"
      backLabel="كل الدورات"
      title={t(group.name, "ar") || "مجال جديد"}
      status={list.status(group)}
      form={form}
      previews={[
        {
          key: "card",
          label: "بطاقة المجال",
          node: (
            <SiteSurface tone="surface" label="الصفحة الرئيسية · المجالات">
              <div className="mx-auto max-w-sm" lang={locale}>
                <GroupCard group={group} locale={locale} count={courseCount(locale, count)} />
              </div>
            </SiteSurface>
          ),
        },
      ]}
    />
  );
}
