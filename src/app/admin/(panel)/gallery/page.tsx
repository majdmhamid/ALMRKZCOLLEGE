"use client";

import { ImagePlus, Loader2, Plus, Tags, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { GalleryImage } from "@content/types";
import { t } from "@/lib/i18n";
import { Dialog, PageIntro, StatusBadge } from "../../_components/bits";
import { CardTools, SiteSurface } from "../../_components/cardkit";
import { LocalizedField } from "../../_components/fields";
import { useImageUpload } from "../../_components/media";
import { Sortable, SortableItem } from "../../_components/Sortable";
import { useAdmin } from "../../_lib/store";
import { newKey, useList } from "../../_lib/useList";

export default function GalleryEditor() {
  const { data, locale, update, draft, toast } = useAdmin();
  const list = useList("gallery");
  const cats = data.galleryCategories;
  const [filter, setFilter] = useState<string>(cats[0]?.slug ?? "all");
  const [editing, setEditing] = useState<string | null>(null);
  const [catsOpen, setCatsOpen] = useState(false);
  const [busy, setBusy] = useState(0);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { upload } = useImageUpload("gallery");
  const dict = data.dict(locale);

  const visible = filter === "all" ? list.items : list.items.filter((g) => g.category === filter);
  const uploadCategory = filter === "all" ? cats[0]?.slug ?? "events" : filter;
  const defaultAlt = (cat: string) => list.items.find((g) => g.category === cat)?.alt ?? { ar: "", he: "" };

  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (!arr.length) return;
    setBusy((n) => n + arr.length);
    let added = 0;
    for (const f of arr) {
      const url = await upload(f);
      setBusy((n) => n - 1);
      if (url) {
        added++;
        list.add({ src: url, category: uploadCategory, alt: defaultAlt(uploadCategory) } as GalleryImage, "start");
      }
    }
    if (added) toast({ tone: "success", message: `انضافت ${added} ${added === 1 ? "صورة" : "صور"} لـ«${t(cats.find((c) => c.slug === uploadCategory)?.label, "ar")}»` });
  };

  const current = editing ? list.get(editing) : undefined;

  return (
    <div>
      <PageIntro
        title="معرض الصور"
        text={
          <>
            اختار التصنيف فوق، وبعدين <b>اسحب صور من الكمبيوتر لهون</b> أو اضغط «ارفع صور» — بتقدر ترفع كتير صور مرة وحدة. اسحب <b>⠿</b> لتغيير الترتيب، واضغط على الصورة لتعديل وصفها أو تصنيفها.
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setCatsOpen(true)}>
              <Tags size={18} /> التصنيفات
            </button>
            <button type="button" className="btn btn-primary" onClick={() => input.current?.click()}>
              <ImagePlus size={18} /> ارفع صور
            </button>
          </>
        }
      />
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <SiteSurface label={`صفحة الصور والفيديو · ${list.items.length} صورة`}>
        <div className="mb-8 flex flex-wrap gap-2" lang={locale}>
          {[{ slug: "all", label: { ar: "الكل", he: "הכל" } }, ...cats].map((c) => {
            const n = c.slug === "all" ? list.items.length : list.items.filter((g) => g.category === c.slug).length;
            return (
              <button key={c.slug} type="button" onClick={() => setFilter(c.slug)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${filter === c.slug ? "bg-brand-600 text-white" : "bg-surface text-ink hover:bg-brand-100"}`}>
                {c.slug === "all" ? dict.gallery.all : t(c.label, locale)} <span className="opacity-70">({n})</span>
              </button>
            );
          })}
        </div>

        <div
          className={`grid grid-cols-2 gap-3 rounded-2xl md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${over ? "bg-brand-50 ring-4 ring-brand-300" : ""}`}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("Files")) {
              e.preventDefault();
              setOver(true);
            }
          }}
          onDragLeave={(e) => e.currentTarget === e.target && setOver(false)}
          onDrop={(e) => {
            if (!e.dataTransfer.files.length) return;
            e.preventDefault();
            setOver(false);
            void addFiles(e.dataTransfer.files);
          }}
        >
          <button type="button" onClick={() => input.current?.click()} className="add-card aspect-square text-sm">
            <ImagePlus size={28} />
            <span className="px-3 text-center">
              ارفع صور لـ
              <br />«{t(cats.find((c) => c.slug === uploadCategory)?.label, "ar")}»
            </span>
          </button>
          {Array.from({ length: busy }, (_, i) => (
            <div key={`b${i}`} className="flex aspect-square items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Loader2 size={28} className="admin-spin" />
            </div>
          ))}
          <Sortable onMove={list.move}>
            {visible.map((g) => {
              const key = list.keyOf(g);
              return (
                <SortableItem key={key} id={key}>
                  {(handle) => (
                    <>
                      <button type="button" onClick={() => setEditing(key)} className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-brand-100">
                        <Image src={g.src} alt={t(g.alt, locale)} fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover transition duration-500 group-hover:scale-105" />
                        {filter === "all" && <span className="absolute bottom-2 start-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-brand-800">{t(cats.find((c) => c.slug === g.category)?.label, locale)}</span>}
                      </button>
                      <StatusBadge status={list.status(g)} />
                      <CardTools handle={handle} onDelete={() => list.remove(key, "صورة")} />
                    </>
                  )}
                </SortableItem>
              );
            })}
          </Sortable>
        </div>
      </SiteSurface>

      {/* تعديل صورة */}
      <Dialog
        open={!!current}
        onClose={() => setEditing(null)}
        title="تفاصيل الصورة"
        footer={
          <>
            <button
              type="button"
              className="me-auto inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:underline"
              onClick={() => {
                if (editing) list.remove(editing, "صورة");
                setEditing(null);
              }}
            >
              <Trash2 size={15} /> احذف الصورة
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing(null)}>
              تمام
            </button>
          </>
        }
      >
        {current && (
          <div className="space-y-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-50">
              <Image src={current.src} alt="" fill sizes="500px" className="object-contain" />
            </div>
            <div>
              <p className="label">التصنيف</p>
              <div className="flex flex-wrap gap-2">
                {cats.map((c) => (
                  <button key={c.slug} type="button" onClick={() => list.patch(editing!, { category: c.slug })} className={`rounded-full px-3 py-1.5 text-sm font-bold ${current.category === c.slug ? "bg-brand-600 text-white" : "bg-surface hover:bg-brand-100"}`}>
                    {t(c.label, "ar")}
                  </button>
                ))}
              </div>
            </div>
            <LocalizedField label="وصف الصورة (للمكفوفين ولجوجل)" value={current.alt} onChange={(alt) => list.patch(editing!, { alt })} multiline rows={2} />
          </div>
        )}
      </Dialog>

      {/* التصنيفات */}
      <Dialog open={catsOpen} onClose={() => setCatsOpen(false)} title="تصنيفات الصور" wide footer={<button type="button" className="btn btn-primary btn-sm" onClick={() => setCatsOpen(false)}>تمام</button>}>
        <div className="space-y-4">
          {draft.galleryCategories.map((c, i) => {
            const used = list.items.filter((g) => g.category === c.slug).length;
            return (
              <div key={c.slug} className="rounded-2xl border border-line p-4">
                <LocalizedField label={`تصنيف ${i + 1} · ${used} صورة`} value={c.label} onChange={(label) => update("galleryCategories", (prev) => prev.map((x) => (x.slug === c.slug ? { ...x, label } : x)))} />
                {!used && (
                  <button type="button" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:underline" onClick={() => update("galleryCategories", (prev) => prev.filter((x) => x.slug !== c.slug))}>
                    <X size={14} /> احذف التصنيف
                  </button>
                )}
              </div>
            );
          })}
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-bold text-brand-700 hover:bg-brand-50" onClick={() => update("galleryCategories", (prev) => [...prev, { slug: newKey("cat"), label: { ar: "تصنيف جديد", he: "קטגוריה חדשה" } }])}>
            <Plus size={16} /> أضف تصنيف
          </button>
        </div>
      </Dialog>
    </div>
  );
}
