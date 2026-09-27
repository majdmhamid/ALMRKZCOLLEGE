"use client";

import { Link2, Plus } from "lucide-react";
import Image from "next/image";
import type { Partner } from "@content/types";
import { PartnerBadge } from "@/components/cards";
import { t } from "@/lib/i18n";
import { PageIntro, StatusBadge } from "../../_components/bits";
import { AddCard, CardTools, InlineText, OtherLang, SiteSurface } from "../../_components/cardkit";
import { PhotoDrop } from "../../_components/media";
import { Sortable, SortableItem } from "../../_components/Sortable";
import { useAdmin } from "../../_lib/store";
import { newKey, useList } from "../../_lib/useList";

export default function PartnersPage() {
  const { data, locale } = useAdmin();
  const list = useList("partners");
  const dict = data.dict(locale);

  const addPartner = () => {
    const slug = newKey("partner");
    list.add({ slug, name: { ar: "", he: "" }, image: "" } as Partner);
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-key="${slug}"] input.inline-edit`)?.focus());
  };

  return (
    <div className="space-y-8">
      <PageIntro
        title="الشركاء"
        text="لوغوهات الجهات الشريكة والمعتمِدة. بتظهر بشريط متحرك بالصفحة الرئيسية وبصفحة «عن الكلية». الأفضل لوغو بخلفية شفافة (PNG)."
        actions={
          <button type="button" className="btn btn-primary" onClick={addPartner}>
            <Plus size={18} /> شريك جديد
          </button>
        }
      />

      <SiteSurface label="صفحة عن الكلية · الشركاء">
        <div className="mb-10 text-center">
          <h2 className="h2">{dict.about.partnersTitle}</h2>
          <span className="heading-bar mx-auto" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap items-start justify-center gap-8" lang={locale}>
          <Sortable onMove={list.move}>
            {list.items.map((p) => {
              const key = list.keyOf(p);
              return (
                <SortableItem key={key} id={key} className="w-44 pt-2">
                  {(handle) => (
                    <div data-key={key}>
                      <PartnerBadge
                        name={t(p.name, locale)}
                        image={p.image}
                        slots={{
                          image: <PhotoDrop src={p.image} folder="partners" kind="logo" fit="contain" sizes="120px" label="غيّر اللوغو" onChange={(url) => list.patch(key, { image: url })} />,
                          name: <InlineText value={p.name[locale] ?? ""} placeholder="اسم الجهة" lang={locale} onChange={(v) => list.patch(key, { name: { ...p.name, [locale]: v } })} className="text-center" />,
                          overlay: (
                            <>
                              <StatusBadge status={list.status(p)} />
                              <CardTools handle={handle} onDelete={() => list.remove(key, t(p.name, "ar") || "شريك")} />
                            </>
                          ),
                        }}
                      />
                      <OtherLang locale={locale} value={p.name} label="الاسم" onChange={(v) => list.patch(key, { name: v })} />
                      <label className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-white/70 px-2.5 py-1.5 text-xs">
                        <Link2 size={14} className="shrink-0 text-ink-muted" />
                        <input className="min-w-0 flex-1 bg-transparent py-0.5 outline-none" dir="ltr" placeholder="رابط الموقع (اختياري)" value={p.url ?? ""} onChange={(e) => list.patch(key, { url: e.target.value || undefined })} />
                      </label>
                    </div>
                  )}
                </SortableItem>
              );
            })}
          </Sortable>
          <AddCard label="أضف شريك" onClick={addPartner} className="h-40 w-44" />
        </div>
      </SiteSurface>

      <SiteSurface tone="surface" label="الصفحة الرئيسية · شريط الشركاء المتحرك">
        <p className="mb-5 text-center text-sm font-bold text-ink-muted">{dict.home.partnersTitle}</p>
        <ul className="flex flex-wrap items-center justify-center gap-10" lang={locale}>
          {list.items.map((p) => (
            <li key={p.slug} className="flex items-center gap-3">
              {p.image && <Image src={p.image} alt="" width={96} height={96} className="h-14 w-14 rounded-full object-contain md:h-16 md:w-16" />}
              <span className="whitespace-nowrap text-sm font-bold text-ink-soft">{t(p.name, locale)}</span>
            </li>
          ))}
        </ul>
      </SiteSurface>
    </div>
  );
}
