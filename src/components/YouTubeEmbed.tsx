"use client";

import Image from "next/image";
import { useState } from "react";
import { PlayIcon } from "./Icons";

/** يعرض صورة الفيديو أولاً ولا يحمّل يوتيوب إلا عند الضغط — أسرع بكثير للصفحة */
export default function YouTubeEmbed({ id, title, thumbnail }: { id: string; title: string; thumbnail: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-card">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 h-full w-full" aria-label={title}>
          <Image src={thumbnail} alt="" fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover opacity-90 transition group-hover:opacity-100" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition group-hover:scale-110">
              <PlayIcon width={32} height={32} className="ms-1" />
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-start text-white">
            <span className="font-bold">{title}</span>
          </span>
        </button>
      )}
    </div>
  );
}
