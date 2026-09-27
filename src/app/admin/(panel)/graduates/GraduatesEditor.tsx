"use client";

import { Home, Plus } from "lucide-react";
import type { Graduate } from "@content/types";
import { GraduateCard } from "@/components/cards";
import { t } from "@/lib/i18n";
import { PageIntro, StatusBadge } from "../../_components/bits";
import { AddCard, CardTools, InlineSelect, InlineText, OtherLang, SiteSurface } from "../../_components/cardkit";
import { PhotoDrop } from "../../_components/media";
import { Sortable, SortableItem } from "../../_components/Sortable";
import { useAdmin } from "../../_lib/store";
import { newKey, useList } from "../../_lib/useList";

/** كم خريج بيظهر بشريط الصفحة الرئيسية */
const HOME_COUNT = 8;

export default function GraduatesEditor() {
  const { data, locale } = useAdmin();
  const list = useList("graduates");
  const dict = data.dict(locale);

  const addGraduate = () => {
    const slug = newKey("grad");
    list.add({ slug, name: { ar: "", he: "" }, course: data.courses[0]?.slug ?? "", image: "" } as Graduate);
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-key="${slug}"] input.inline-edit`)?.focus());
  };

  return (
    <div>
      <PageIntro
        title="الخريجون"
        text={
          <>
            هاي نفس بطاقات صفحة الخريجين على الموقع. <b>اكتب على الاسم</b> لتعديله، <b>اضغط على الصورة</b> أو اسحب صورة فوقها لتبديلها، واسحب <b>⠿</b> لتغيير الترتيب. أول {HOME_COUNT} خريجين بيظهروا كمان بالصفحة الرئيسية.
          </>
        }
        actions={
          <button type="button" className="btn btn-primary" onClick={addGraduate}>
            <Plus size={18} /> خريج جديد
          </button>
        }
      />

      <SiteSurface label={`صفحة الخريجين · ${list.items.length} خريج`}>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4" lang={locale}>
          <Sortable onMove={list.move}>
            {list.items.map((g, i) => {
              const key = list.keyOf(g);
              const course = data.getCourse(g.course);
              const name = g.name[locale] ?? "";
              return (
                <SortableItem key={key} id={key}>
                  {(handle) => (
                    <div data-key={key}>
                      <GraduateCard
                        reveal={false}
                        name={t(g.name, locale)}
                        image={g.image}
                        graduateOfLabel={dict.graduates.graduateOf}
                        className="hover:translate-y-0"
                        slots={{
                          image: <PhotoDrop src={g.image} alt={name} folder="graduates" kind="portrait" onChange={(url) => list.patch(key, { image: url })} />,
                          name: <InlineText value={name} placeholder="اكتب الاسم" lang={locale} onChange={(v) => list.patch(key, { name: { ...g.name, [locale]: v } })} />,
                          sub: (
                            <p className="mt-1 text-sm leading-snug text-ink-soft">
                              {dict.graduates.graduateOf}{" "}
                              <InlineSelect className="text-brand-700" value={g.course} label={course ? t(course.name, locale) : "— اختر الدورة —"} onChange={(v) => list.patch(key, { course: v })} ariaLabel="الدورة">
                                {!course && <option value={g.course}>— اختر الدورة —</option>}
                                {data.groups.map((grp) => (
                                  <optgroup key={grp.slug} label={t(grp.name, locale)}>
                                    {data.coursesInGroup(grp.slug).map((c) => (
                                      <option key={c.slug} value={c.slug}>
                                        {t(c.name, locale)}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </InlineSelect>
                            </p>
                          ),
                          overlay: (
                            <>
                              <StatusBadge status={list.status(g)} />
                              <CardTools handle={handle} onDelete={() => list.remove(key, t(g.name, "ar") || "خريج")} />
                            </>
                          ),
                        }}
                      />
                      <OtherLang locale={locale} value={g.name} label="الاسم" onChange={(v) => list.patch(key, { name: v })} />
                      {i < HOME_COUNT && (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700">
                          <Home size={12} /> بيظهر بالصفحة الرئيسية
                        </p>
                      )}
                    </div>
                  )}
                </SortableItem>
              );
            })}
          </Sortable>
          <AddCard label="أضف خريج" onClick={addGraduate} className="aspect-[3/4] min-h-[260px]" />
        </div>
      </SiteSurface>
    </div>
  );
}
