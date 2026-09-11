"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { GalleryCategory } from "@content/types";
import { ChevronIcon, XIcon } from "./Icons";

interface Item {
  src: string;
  category: GalleryCategory;
  alt: string;
}

interface Props {
  items: Item[];
  categories: { slug: GalleryCategory; label: string }[];
  allLabel: string;
  closeLabel: string;
}

export default function GalleryGrid({ items, categories, allLabel, closeLabel }: Props) {
  const [filter, setFilter] = useState<GalleryCategory | "all">("all");
  const [index, setIndex] = useState<number | null>(null);
  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (d: number) => setIndex((i) => (i === null ? null : (i + d + visible.length) % visible.length)),
    [visible.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(1);
      if (e.key === "ArrowRight") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="filter">
        {[{ slug: "all" as const, label: allLabel }, ...categories].map((c) => (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={filter === c.slug}
            onClick={() => {
              setFilter(c.slug);
              setIndex(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${filter === c.slug ? "bg-brand-600 text-white" : "bg-surface text-ink hover:bg-brand-100"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((it, i) => (
          <button key={it.src} type="button" onClick={() => setIndex(i)} className="group relative aspect-square overflow-hidden rounded-xl bg-brand-100 focus-visible:outline-brand-600">
            <Image src={it.src} alt={it.alt} fill sizes="(min-width: 1024px) 300px, (min-width: 768px) 33vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
          </button>
        ))}
      </div>

      {index !== null && visible[index] && (
        <div role="dialog" aria-modal="true" aria-label={visible[index].alt} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={close}>
          <button type="button" onClick={close} aria-label={closeLabel} className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <XIcon width={26} height={26} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="previous"
            className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:start-6"
          >
            <ChevronIcon width={28} height={28} className="rotate-90" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="next"
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:end-6"
          >
            <ChevronIcon width={28} height={28} className="-rotate-90" />
          </button>
          <div className="relative h-full w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={visible[index].src} alt={visible[index].alt} fill sizes="100vw" className="object-contain" priority />
          </div>
          <p className="absolute bottom-4 text-sm text-white/80">
            {index + 1} / {visible.length}
          </p>
        </div>
      )}
    </div>
  );
}
