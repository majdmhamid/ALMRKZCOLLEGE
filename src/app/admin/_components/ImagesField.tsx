"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useImageUpload } from "./media";

/** مجموعة صور (أول صورة = الغلاف). رفع أكثر من صورة مرة وحدة، ترتيب، حذف. */
export default function ImagesField({ label, value, onChange, folder, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; folder: string; hint?: string }) {
  const { upload } = useImageUpload(folder);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [over, setOver] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    setBusy((n) => n + list.length);
    let acc = value;
    for (const f of list) {
      const url = await upload(f);
      setBusy((n) => n - 1);
      if (url) {
        acc = [...acc.filter((s) => !s.endsWith("/placeholder.webp")), url];
        onChange(acc);
      }
    }
  };

  const move = (i: number, d: -1 | 1) => {
    const out = [...value];
    [out[i], out[i + d]] = [out[i + d], out[i]];
    onChange(out);
  };

  return (
    <div>
      <p className="label">{label}</p>
      {hint && <p className="-mt-1 mb-2 text-xs text-ink-muted">{hint}</p>}
      <div
        className={`grid grid-cols-3 gap-3 rounded-2xl p-1 sm:grid-cols-4 ${over ? "bg-brand-50 ring-2 ring-brand-400" : ""}`}
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
          setOver(false);
          void addFiles(e.dataTransfer.files);
        }}
      >
        {value.map((src, i) => (
          <div key={`${src}-${i}`} className="edit-card group relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-50 ring-1 ring-line">
            <Image src={src} alt="" fill sizes="200px" className="object-cover" />
            {i === 0 && (
              <span className="absolute start-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                <Star size={10} fill="currentColor" /> الغلاف
              </span>
            )}
            <div className="edit-tools absolute inset-x-1.5 bottom-1.5 flex justify-between">
              <span className="flex gap-1">
                <SmallBtn label="قدّم" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowRight size={14} />
                </SmallBtn>
                <SmallBtn label="أخّر" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                  <ArrowLeft size={14} />
                </SmallBtn>
              </span>
              <SmallBtn label="احذف الصورة" onClick={() => onChange(value.filter((_, j) => j !== i))} danger>
                <X size={14} />
              </SmallBtn>
            </div>
          </div>
        ))}
        {Array.from({ length: busy }, (_, i) => (
          <div key={`busy-${i}`} className="flex aspect-[4/3] items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Loader2 className="admin-spin" />
          </div>
        ))}
        <button type="button" onClick={() => input.current?.click()} className="add-card aspect-[4/3] text-sm">
          <ImagePlus size={24} />
          أضف صور
        </button>
      </div>
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
    </div>
  );
}

function SmallBtn({ label, onClick, children, disabled, danger }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled} className={`rounded-md bg-white/95 p-1 shadow-sm disabled:opacity-30 ${danger ? "text-red-600" : "text-ink"}`}>
      {children}
    </button>
  );
}
