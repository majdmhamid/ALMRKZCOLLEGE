"use client";

import { Plus } from "lucide-react";
import type { StaffMember } from "@content/types";
import { StaffCard } from "@/components/cards";
import { t } from "@/lib/i18n";
import { PageIntro, StatusBadge } from "../../_components/bits";
import { AddCard, CardTools, InlineText, OtherLang, SiteSurface } from "../../_components/cardkit";
import { PhotoDrop } from "../../_components/media";
import { Sortable, SortableItem } from "../../_components/Sortable";
import { useAdmin } from "../../_lib/store";
import { newKey, useList } from "../../_lib/useList";

export default function StaffPage() {
  const { data, locale } = useAdmin();
  const list = useList("staff");
  const dict = data.dict(locale);

  const addMember = () => {
    const slug = newKey("staff");
    list.add({ slug, name: { ar: "", he: "" }, role: { ar: "", he: "" }, image: "" } as StaffMember);
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-key="${slug}"] input.inline-edit`)?.focus());
  };

  return (
    <div>
      <PageIntro
        title="الطاقم"
        text="هاي بطاقات الطاقم بصفحة «عن الكلية». اكتب الاسم والوظيفة مباشرة على البطاقة، واضغط على الصورة لتبديلها."
        actions={
          <button type="button" className="btn btn-primary" onClick={addMember}>
            <Plus size={18} /> عضو جديد
          </button>
        }
      />
      <SiteSurface tone="surface" label="صفحة عن الكلية · الطاقم">
        <div className="mb-10 text-center">
          <h2 className="h2">{dict.about.staffTitle}</h2>
          <span className="heading-bar mx-auto" aria-hidden="true" />
          <p className="lead mt-4">{dict.about.staffSubtitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" lang={locale}>
          <Sortable onMove={list.move}>
            {list.items.map((s) => {
              const key = list.keyOf(s);
              return (
                <SortableItem key={key} id={key}>
                  {(handle) => (
                    <div data-key={key}>
                      <StaffCard
                        reveal={false}
                        name={t(s.name, locale)}
                        role={t(s.role, locale)}
                        image={s.image}
                        slots={{
                          image: <PhotoDrop src={s.image} folder="staff" kind="portrait" onChange={(url) => list.patch(key, { image: url })} sizes="180px" />,
                          name: <InlineText value={s.name[locale] ?? ""} placeholder="الاسم" lang={locale} onChange={(v) => list.patch(key, { name: { ...s.name, [locale]: v } })} className="text-center" />,
                          sub: <InlineText multiline value={s.role[locale] ?? ""} placeholder="الوظيفة" lang={locale} onChange={(v) => list.patch(key, { role: { ...s.role, [locale]: v } })} className="text-center" />,
                          overlay: (
                            <>
                              <StatusBadge status={list.status(s)} />
                              <CardTools handle={handle} onDelete={() => list.remove(key, t(s.name, "ar") || "عضو طاقم")} />
                            </>
                          ),
                        }}
                      />
                      <OtherLang locale={locale} value={s.name} label="الاسم" onChange={(v) => list.patch(key, { name: v })} />
                      <OtherLang locale={locale} value={s.role} label="الوظيفة" onChange={(v) => list.patch(key, { role: v })} />
                    </div>
                  )}
                </SortableItem>
              );
            })}
          </Sortable>
          <AddCard label="أضف عضو" onClick={addMember} className="aspect-square min-h-[180px]" />
        </div>
      </SiteSurface>
    </div>
  );
}
