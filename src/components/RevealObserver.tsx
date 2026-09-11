"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * يراقب كل العناصر التي تحمل السمة data-reveal ويضيف لها الصنف is-in عند دخولها الشاشة،
 * فتظهر تدريجياً (الحركة نفسها في globals.css). لا يعمل عند تفعيل "تقليل الحركة".
 * يعمل مع مكوّنات الخادم لأنّه لا يحتاج سوى سمة HTML.
 */
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const all = () => document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)");
    if (!("IntersectionObserver" in window)) {
      all().forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.1 },
    );
    const observeAll = () => all().forEach((el) => io.observe(el));
    observeAll();
    // عناصر تُضاف لاحقاً (تنقّل بين الصفحات، استمارة، ...)
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
