"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronIcon } from "./Icons";

interface Props {
  children: ReactNode;
  /** أصناف إضافية للصف (مثلاً تحويله لشبكة على الشاشات الكبيرة) */
  className?: string;
  labels: { prev: string; next: string; swipe: string };
  /** إخفاء الأسهم على الشاشات الكبيرة (عندما يتحول الصف إلى شبكة) */
  arrowsOnDesktop?: boolean;
}

/**
 * صف قابل للسحب بالإصبع على الموبايل (scroll-snap، بدون JavaScript للحركة نفسها)،
 * مع سهمين للفأرة على الشاشات الكبيرة وتلميح "اسحب" على الموبايل.
 */
export default function Carousel({ children, className = "", labels, arrowsOnDesktop = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth + 8);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const step = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const amount = Math.max(240, el.clientWidth * 0.85);
    el.scrollBy({ left: (rtl ? -1 : 1) * direction * amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div ref={ref} className={`snap-row ${className}`}>
        {children}
      </div>
      {canScroll && (
        <>
          <p className="mt-2 text-center text-xs text-ink-muted lg:hidden">{labels.swipe}</p>
          {arrowsOnDesktop && (
            <div className="pointer-events-none absolute inset-y-0 -inset-x-3 hidden items-center justify-between lg:flex">
              <button type="button" onClick={() => step(-1)} aria-label={labels.prev} className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-brand-700 shadow-card transition hover:bg-brand-50">
                <ChevronIcon className="rotate-90 rtl:-rotate-90" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label={labels.next} className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-brand-700 shadow-card transition hover:bg-brand-50">
                <ChevronIcon className="-rotate-90 rtl:rotate-90" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
