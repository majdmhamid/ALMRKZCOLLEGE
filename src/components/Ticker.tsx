"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Item {
  title: string;
  to: string;
}

/**
 * شريط أخبار صغير في الشريط العلوي: يعرض آخر العناوين واحداً تلو الآخر بحركة انزلاق.
 * يتوقف التبديل عند طلب تقليل الحركة (يبقى العنوان الأول ظاهراً).
 */
export default function Ticker({ label, items }: { label: string; items: Item[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-no-motion");
    if (reduce) return;
    const id = window.setInterval(() => setIndex((v) => (v + 1) % items.length), 4500);
    return () => window.clearInterval(id);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div className="hidden min-w-0 flex-1 items-center gap-2 px-6 md:flex">
      <span className="ticker-dot shrink-0" aria-hidden="true" />
      <span className="shrink-0 rounded-md bg-white/15 px-2 py-0.5 text-xs font-extrabold">{label}</span>
      <div className="ticker relative h-5 min-w-0 flex-1">
        {items.map((it, k) => (
          <Link key={it.to} href={it.to} className={`ticker-item text-sm text-white/95 hover:underline ${k === index ? "is-on" : ""}`} tabIndex={k === index ? 0 : -1} aria-hidden={k !== index}>
            {it.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
