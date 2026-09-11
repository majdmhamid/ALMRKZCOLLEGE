"use client";

import { useEffect, useState } from "react";

const reduceMotion = () => typeof window !== "undefined" && (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-no-motion"));

/**
 * كلمة تتبدّل (اللحام ← التكييف ← البناء والسلامة) بحركة انزلاق.
 * عند طلب تقليل الحركة يتوقف التبديل وتبقى الكلمة الأولى (والقائمة كاملة في aria-label).
 */
export default function RotatingWords({ words, interval = 2600, className = "" }: { words: string[]; interval?: number; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const id = window.setInterval(() => {
      if (reduceMotion()) return;
      setIndex((v) => (v + 1) % words.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  const prev = (index + words.length - 1) % words.length;
  return (
    <span className={`rotating ${className}`} aria-label={words.join("، ")}>
      {words.map((w, k) => (
        <span key={w} aria-hidden="true" className={`rotating-word ${k === index ? "is-on" : k === prev ? "is-out" : ""}`}>
          {w}
        </span>
      ))}
    </span>
  );
}
