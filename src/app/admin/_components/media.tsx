"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { uploadImage } from "../actions";
import { useAdmin } from "../_lib/store";

export type ImageKind = "photo" | "portrait" | "logo";

/** يصغّر الصورة بالمتصفح قبل الرفع (صور الموبايل ممكن تكون 10 ميغا) */
async function shrink(file: File, kind: ImageKind): Promise<Blob> {
  const max = kind === "logo" ? 800 : 2400;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 3_000_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const type = kind === "logo" ? "image/png" : "image/jpeg";
    return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), type, 0.9));
  } catch {
    return file;
  }
}

export function useImageUpload(folder: string, kind: ImageKind = "photo") {
  const { toast } = useAdmin();
  const [busy, setBusy] = useState(false);
  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
        toast({ tone: "error", message: "هاد الملف مش صورة." });
        return null;
      }
      setBusy(true);
      try {
        const blob = await shrink(file, kind);
        const form = new FormData();
        form.set("file", new File([blob], file.name, { type: blob.type || file.type }));
        form.set("folder", folder);
        form.set("kind", kind);
        const res = await uploadImage(form);
        if (!res.ok) {
          toast({ tone: "error", message: res.message === "too-big" ? "الصورة كبيرة كثير (أكثر من 15 ميغا)." : "ما قدرنا نرفع الصورة — جرّب صورة ثانية." });
          return null;
        }
        return res.url;
      } catch {
        toast({ tone: "error", message: "ما قدرنا نرفع الصورة — تأكد من الإنترنت وجرّب كمان مرة." });
        return null;
      } finally {
        setBusy(false);
      }
    },
    [folder, kind, toast],
  );
  return { upload, busy };
}

/**
 * طبقة فوق صورة البطاقة: اضغط أو اسحب صورة لتبديلها.
 * تُوضع داخل إطار الصورة (position: relative) وتغطيه.
 */
export function PhotoDrop({ src, alt = "", folder, kind = "photo", onChange, sizes = "300px", fit = "cover", label = "غيّر الصورة" }: { src: string; alt?: string; folder: string; kind?: ImageKind; onChange: (url: string) => void; sizes?: string; fit?: "cover" | "contain"; label?: string }) {
  const { upload, busy } = useImageUpload(folder, kind);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = async (f?: File | null) => {
    if (!f) return;
    const url = await upload(f);
    if (url) onChange(url);
  };
  return (
    <>
      {src && <Image src={src} alt={alt} fill sizes={sizes} className={fit === "cover" ? "object-cover" : "object-contain"} />}
      <button
        type="button"
        className={`photo-drop ${over ? "is-over" : ""} ${busy ? "is-busy" : ""} ${!src ? "is-empty" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          e.stopPropagation();
          setOver(false);
          void pick(e.dataTransfer.files[0]);
        }}
        aria-label={label}
      >
        {busy ? <Loader2 size={26} className="admin-spin" /> : <ImagePlus size={26} />}
        <span>{busy ? "عم نرفع…" : src ? label : "أضف صورة"}</span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0]).finally(() => (e.target.value = ""))} />
    </>
  );
}

/** حقل صورة في استمارة: صورة مصغّرة + زر تبديل */
export function ImageField({ label, value, onChange, folder, kind = "photo", aspect = "aspect-[16/10]", hint, fit = "cover" }: { label: string; value: string; onChange: (url: string) => void; folder: string; kind?: ImageKind; aspect?: string; hint?: ReactNode; fit?: "cover" | "contain" }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className={`relative w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-brand-50 ${aspect}`}>
        <PhotoDrop src={value} folder={folder} kind={kind} onChange={onChange} sizes="400px" fit={fit} />
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
