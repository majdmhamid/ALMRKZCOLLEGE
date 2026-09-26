"use client";

import { UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

/** Drag-and-drop area (click to browse). Hands every dropped file up; checks happen in the dialog. */
export function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const t = useTranslations("uploadZone");
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), input.current?.click())}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = [...e.dataTransfer.files];
        if (files.length) onFiles(files);
      }}
      data-testid="upload-zone"
      className={`mb-6 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
        over ? "border-admin bg-blue-50" : "border-slate-300 bg-card hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      <UploadCloud className={`size-8 ${over ? "text-admin" : "text-slate-400"}`} />
      <div className="font-semibold">{over ? t("drop") : t("title")}</div>
      <div className="text-xs text-muted">{t("hint")}</div>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </div>
  );
}
