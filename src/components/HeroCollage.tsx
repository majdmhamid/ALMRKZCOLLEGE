"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export interface CollagePhoto {
  src: string;
  alt: string;
  caption: string;
}

/**
 * ثلاث صور حقيقية "عائمة" فوق فيديو الواجهة (سطح المكتب):
 * تطفو ببطء، وتتحرك قليلاً مع حركة الفأرة (بارالاكس) — كل صورة بعمق مختلف.
 * بدون حركة إطلاقاً عند طلب تقليل الحركة.
 */
export default function HeroCollage({ photos }: { photos: CollagePhoto[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-no-motion");
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    // نستمع على القسم كله (الواجهة) لا على الصور فقط
    const area = el.closest("section") ?? el;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const apply = () => {
      raf = 0;
      el.style.setProperty("--mx", tx.toFixed(3));
      el.style.setProperty("--my", ty.toFixed(3));
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    area.addEventListener("pointermove", onMove, { passive: true });
    area.addEventListener("pointerleave", onLeave);
    return () => {
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  const [a, b, c] = photos;
  return (
    <div ref={ref} className="collage absolute inset-0" aria-hidden="true">
      {/* الصورة الكبيرة (طولية) */}
      <figure className="collage-card collage-a">
        <Image src={a.src} alt="" fill sizes="280px" className="object-cover" priority />
        <figcaption>{a.caption}</figcaption>
      </figure>
      {/* صورة عرضية أسفل اليسار */}
      <figure className="collage-card collage-b">
        <Image src={b.src} alt="" fill sizes="300px" className="object-cover" />
        <figcaption>{b.caption}</figcaption>
      </figure>
      {/* صورة مربعة صغيرة */}
      <figure className="collage-card collage-c">
        <Image src={c.src} alt="" fill sizes="200px" className="object-cover" />
        <figcaption>{c.caption}</figcaption>
      </figure>
    </div>
  );
}
