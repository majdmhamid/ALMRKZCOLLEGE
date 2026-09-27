"use client";

import { uploadImage, videoUploadTarget } from "../actions";

const MAX = 80 * 1024 * 1024;

/** يقرأ مدة الفيديو ويلتقط صورة منه (تصير صورة الغلاف) — كله بالمتصفح */
async function inspect(file: File): Promise<{ seconds: number; poster: Blob | null; portrait: boolean }> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    v.src = url;
    await new Promise<void>((res, rej) => {
      v.onloadeddata = () => res();
      v.onerror = () => rej(new Error("video"));
    });
    const seconds = Math.round(v.duration || 0);
    v.currentTime = Math.min(1.2, (v.duration || 2) / 3);
    await new Promise<void>((res) => (v.onseeked = () => res()));
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    const poster = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.88));
    return { seconds, poster, portrait: v.videoHeight > v.videoWidth };
  } catch {
    return { seconds: 0, poster: null, portrait: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type VideoUploadResult = { ok: true; url: string; seconds: number; posterUrl: string | null; portrait: boolean } | { ok: false; message: string };

export async function uploadVideoFile(file: File): Promise<VideoUploadResult> {
  if (file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4")) return { ok: false, message: "لازم يكون ملف فيديو MP4." };
  if (file.size > MAX) return { ok: false, message: "الفيديو كبير كثير (أكثر من 80 ميغا). قصّره أو صغّره أول." };
  const info = await inspect(file);

  let url: string;
  const target = await videoUploadTarget();
  if (target.kind === "signed") {
    const res = await fetch(target.signedUrl, { method: "PUT", headers: { "Content-Type": "video/mp4", "x-upsert": "false" }, body: file });
    if (!res.ok) return { ok: false, message: "ما قدرنا نرفع الفيديو — جرّب كمان مرة." };
    url = target.publicUrl;
  } else {
    const res = await fetch("/admin/upload-video", { method: "POST", headers: { "Content-Type": "video/mp4" }, body: file });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string };
    if (!json.ok || !json.url) return { ok: false, message: "ما قدرنا نرفع الفيديو — جرّب كمان مرة." };
    url = json.url;
  }

  let posterUrl: string | null = null;
  if (info.poster) {
    const form = new FormData();
    form.set("file", new File([info.poster], "poster.jpg", { type: "image/jpeg" }));
    form.set("folder", "videos");
    form.set("kind", "photo");
    const r = await uploadImage(form);
    if (r.ok) posterUrl = r.url;
  }
  return { ok: true, url, seconds: info.seconds, posterUrl, portrait: info.portrait };
}

/** يستخرج رقم فيديو يوتيوب من أي شكل رابط */
export function youtubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : null;
}
