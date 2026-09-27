"use client";

import { Film, Loader2, Plus } from "lucide-react";
import { YouTubeIcon } from "@/components/Icons";
import Image from "next/image";
import { useRef, useState } from "react";
import type { LocalVideo, Video } from "@content/types";
import VideoCard from "@/components/VideoCard";
import { t } from "@/lib/i18n";
import { PageIntro, StatusBadge } from "../../_components/bits";
import { AddCard, CardTools, InlineSelect, InlineText, OtherLang, SiteSurface } from "../../_components/cardkit";
import { FieldGroup, LocalizedField } from "../../_components/fields";
import { ImageField, PhotoDrop } from "../../_components/media";
import { Sortable, SortableItem } from "../../_components/Sortable";
import { uploadVideoFile, youtubeId } from "../../_components/video";
import { useAdmin } from "../../_lib/store";
import { newKey, useList } from "../../_lib/useList";

/** زر اختيار ملف فيديو ورفعه */
function useVideoPicker(onDone: (r: { url: string; seconds: number; posterUrl: string | null }) => void) {
  const { toast } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const el = (
    <input
      ref={input}
      type="file"
      accept="video/mp4"
      hidden
      onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        setBusy(true);
        const r = await uploadVideoFile(f);
        setBusy(false);
        if (!r.ok) return toast({ tone: "error", message: r.message });
        onDone(r);
        toast({ tone: "success", message: "انرفع الفيديو." });
      }}
    />
  );
  return { el, busy, open: () => input.current?.click() };
}

export default function VideosEditor() {
  const { data, locale, update, draft, published } = useAdmin();
  const reels = useList("reels");
  const yt = useList("videos");
  const dict = data.dict(locale);
  const promo = draft.promoVideo;
  const [ytInput, setYtInput] = useState("");
  const [ytError, setYtError] = useState("");

  const promoPicker = useVideoPicker((r) => update("promoVideo", (p) => ({ ...p, src: r.url, seconds: r.seconds || p.seconds, poster: r.posterUrl ?? p.poster })));
  const [replacing, setReplacing] = useState<string | null>(null);
  const reelPicker = useVideoPicker((r) => {
    if (replacing) reels.patch(replacing, { src: r.url, seconds: r.seconds, ...(r.posterUrl ? { poster: r.posterUrl } : {}) });
    else reels.add({ slug: newKey("reel"), src: r.url, poster: r.posterUrl ?? "", seconds: r.seconds, orientation: "portrait", title: { ar: "", he: "" } } as LocalVideo);
    setReplacing(null);
  });

  const linkOptions = [
    { value: "", label: "— بدون —" },
    ...data.groups.flatMap((g) => [{ value: `g:${g.slug}`, label: `مجال: ${t(g.name, "ar")}` }, ...data.coursesInGroup(g.slug).map((c) => ({ value: `c:${g.slug}:${c.slug}`, label: `   دورة: ${t(c.name, "ar")}` }))]),
  ];
  const linkValue = (r: LocalVideo) => (r.course ? `c:${r.group}:${r.course}` : r.group ? `g:${r.group}` : "");
  const linkLabel = (r: LocalVideo) => (r.course ? t(data.getCourse(r.course)?.name, locale) : r.group ? t(data.getGroup(r.group)?.name, locale) : "— ما بيظهر بصفحة دورة —");
  const setLink = (key: string, v: string) => {
    const [kind, g, c] = v.split(":");
    reels.patch(key, kind === "c" ? { group: g, course: c } : kind === "g" ? { group: g, course: undefined } : { group: undefined, course: undefined });
  };

  const addYoutube = () => {
    const id = youtubeId(ytInput);
    if (!id) return setYtError("هاد مش رابط يوتيوب صحيح.");
    if (yt.items.some((v) => v.youtubeId === id)) return setYtError("هاد الفيديو موجود.");
    yt.add({ youtubeId: id, title: { ar: "", he: "" }, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } as Video);
    setYtInput("");
    setYtError("");
  };

  return (
    <div className="space-y-10">
      <PageIntro title="الفيديوهات" text="الفيديو التعريفي، الفيديوهات القصيرة (ريلز) اللي بتظهر بالصفحة الرئيسية وبصفحات الدورات، وفيديوهات يوتيوب. الفيديو لازم يكون MP4." />
      {promoPicker.el}
      {reelPicker.el}

      {/* الفيديو التعريفي */}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <FieldGroup title="الفيديو التعريفي" hint={`بيظهر بالصفحة الرئيسية وبصفحة الصور · ${promo.seconds} ${dict.common.seconds}`}>
          <LocalizedField label="العنوان" value={promo.title} onChange={(title) => update("promoVideo", (p) => ({ ...p, title }))} />
          <ImageField label="صورة الغلاف (قبل التشغيل)" value={promo.poster} onChange={(poster) => update("promoVideo", (p) => ({ ...p, poster }))} folder="videos" aspect="aspect-video" />
          <button type="button" className="btn btn-outline btn-sm" onClick={promoPicker.open} disabled={promoPicker.busy}>
            {promoPicker.busy ? <Loader2 size={16} className="admin-spin" /> : <Film size={16} />} {promoPicker.busy ? "عم نرفع الفيديو…" : "بدّل ملف الفيديو"}
          </button>
        </FieldGroup>
        <SiteSurface tone="surface" label="الصفحة الرئيسية · الفيديو">
          <div lang={locale}>
            <VideoCard src={promo.src} poster={promo.poster} title={t(promo.title, locale)} orientation="landscape" playLabel={dict.common.playVideo} duration={`${promo.seconds} ${dict.common.seconds}`} sizes="600px" />
          </div>
        </SiteSurface>
      </div>

      {/* الريلز */}
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="h3">فيديوهات قصيرة (ريلز)</h2>
            <p className="text-sm text-ink-soft">كل فيديو بتقدر تربطه بمجال أو دورة، فيظهر بجنب صفحتها.</p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => (setReplacing(null), reelPicker.open())} disabled={reelPicker.busy}>
            {reelPicker.busy ? <Loader2 size={16} className="admin-spin" /> : <Plus size={16} />} {reelPicker.busy ? "عم نرفع…" : "فيديو قصير جديد"}
          </button>
        </div>
        <SiteSurface tone="surface" label="الصفحة الرئيسية · الريلز">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4" lang={locale}>
            <Sortable onMove={reels.move}>
              {reels.items.map((r) => {
                const key = reels.keyOf(r);
                return (
                  <SortableItem key={key} id={key}>
                    {(handle) => (
                      <div>
                        <div className="relative">
                          <VideoCard src={r.src} poster={r.poster || "/images/placeholder.webp"} title={t(r.title, locale)} orientation="portrait" playLabel={dict.common.playVideo} duration={`${r.seconds} ${dict.common.seconds}`} sizes="260px" />
                          <StatusBadge status={reels.status(r)} />
                          <CardTools
                            handle={handle}
                            onDelete={() => reels.remove(key, t(r.title, "ar") || "فيديو")}
                            extra={
                              <button type="button" title="بدّل ملف الفيديو" aria-label="بدّل ملف الفيديو" className="inline-flex items-center justify-center rounded-lg bg-white/95 p-1.5 text-ink-muted shadow-sm ring-1 ring-line hover:text-brand-700" onClick={() => (setReplacing(key), reelPicker.open())}>
                                <Film size={16} />
                              </button>
                            }
                          />
                        </div>
                        <div className="mt-3 space-y-1 text-sm">
                          <InlineText value={r.title[locale] ?? ""} placeholder="عنوان الفيديو" lang={locale} onChange={(v) => reels.patch(key, { title: { ...r.title, [locale]: v } })} className="font-bold" />
                          <OtherLang locale={locale} value={r.title} label="العنوان" onChange={(v) => reels.patch(key, { title: v })} />
                          <p className="pt-1 text-xs text-ink-muted">
                            بيظهر بصفحة:{" "}
                            <InlineSelect value={linkValue(r)} label={linkLabel(r)} ariaLabel="الصفحة المرتبطة" className="font-bold text-brand-700" onChange={(v) => setLink(key, v)}>
                              {linkOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </InlineSelect>
                          </p>
                          <details className="pt-1 text-xs">
                            <summary className="cursor-pointer font-bold text-ink-muted">صورة الغلاف</summary>
                            <div className="relative mt-2 aspect-[9/16] w-24 overflow-hidden rounded-lg bg-brand-50">
                              <PhotoDrop src={r.poster} folder="videos" onChange={(poster) => reels.patch(key, { poster })} sizes="96px" label="غيّر" />
                            </div>
                          </details>
                        </div>
                      </div>
                    )}
                  </SortableItem>
                );
              })}
            </Sortable>
            <AddCard label={reelPicker.busy ? "عم نرفع…" : "أضف فيديو قصير"} onClick={() => (setReplacing(null), reelPicker.open())} className="aspect-[9/16]" />
          </div>
        </SiteSurface>
      </div>

      {/* يوتيوب */}
      <div>
        <h2 className="h3 mb-1">فيديوهات يوتيوب</h2>
        <p className="mb-4 text-sm text-ink-soft">بتظهر بصفحة «الصور والفيديو». الصق رابط الفيديو من يوتيوب.</p>
        <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
          <YouTubeIcon className="text-red-600" />
          <input className="input max-w-md flex-1" dir="ltr" placeholder="https://www.youtube.com/watch?v=…" value={ytInput} onChange={(e) => (setYtInput(e.target.value), setYtError(""))} onKeyDown={(e) => e.key === "Enter" && addYoutube()} />
          <button type="button" className="btn btn-primary btn-sm" onClick={addYoutube}>
            <Plus size={16} /> أضف
          </button>
          {ytError && <p className="w-full text-sm font-bold text-red-600">{ytError}</p>}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" lang={locale}>
          <Sortable onMove={yt.move}>
            {yt.items.map((v) => {
              const key = yt.keyOf(v);
              return (
                <SortableItem key={key} id={key}>
                  {(handle) => (
                    <div className="card overflow-hidden">
                      <div className="relative aspect-video bg-ink">
                        <Image src={v.thumbnail} alt="" fill sizes="400px" className="object-cover" />
                        <StatusBadge status={published.videos.some((x) => x.youtubeId === v.youtubeId) ? yt.status(v) : "new"} />
                        <CardTools handle={handle} onDelete={() => yt.remove(key, t(v.title, "ar") || "فيديو يوتيوب")} />
                      </div>
                      <div className="p-4">
                        <InlineText value={v.title[locale] ?? ""} placeholder="عنوان الفيديو" lang={locale} onChange={(val) => yt.patch(key, { title: { ...v.title, [locale]: val } })} className="font-bold" />
                        <OtherLang locale={locale} value={v.title} label="العنوان" onChange={(val) => yt.patch(key, { title: val })} />
                      </div>
                    </div>
                  )}
                </SortableItem>
              );
            })}
          </Sortable>
        </div>
      </div>
    </div>
  );
}
