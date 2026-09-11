"use client";

import { useEffect, useRef } from "react";

/**
 * شرارات لحام خفيفة تطفو فوق فيديو الواجهة (canvas خفيف جداً).
 * - لا تعمل عند طلب تقليل الحركة أو وضع توفير البيانات.
 * - تتوقف عندما تخرج الواجهة من الشاشة أو تُخفى التبويبة.
 */
export default function HeroSparks({ count = 36, className = "" }: { count?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-no-motion");
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (reduce() || conn?.saveData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    const size = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    const n = window.innerWidth < 768 ? Math.round(count / 2) : count;
    const colors = ["#f59e0b", "#fbbf24", "#ffffff", "#84cc16"];
    const ps = Array.from({ length: n }, (_, i) => ({
      x: Math.random() * 2000,
      y: Math.random() * 1200,
      r: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.55 + 0.25),
      a: Math.random() * Math.PI * 2,
      c: colors[i % colors.length],
    }));

    let raf = 0;
    let running = false;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        p.a += 0.02;
        if (p.y < -10) {
          p.y = H + 10;
          p.x = Math.random() * W;
        }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        ctx.globalAlpha = 0.3 + Math.abs(Math.sin(p.a)) * 0.65;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x % (W + 20), p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    const start = () => {
      if (running || reduce()) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(([e]) => (e?.isIntersecting && !document.hidden ? start() : stop()), { threshold: 0.05 });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    // زر "إيقاف الحركة" في أداة الوصولية
    const mo = new MutationObserver(() => (reduce() ? (stop(), ctx.clearRect(0, 0, W, H)) : start()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [count]);

  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply ${className}`} aria-hidden="true" />;
}
