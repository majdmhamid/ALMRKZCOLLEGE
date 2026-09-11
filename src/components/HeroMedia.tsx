"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Props {
  /** صورة تظهر فوراً قبل تحميل الفيديو (وهي أول لقطة فيه) */
  poster: string;
  /** ملفات الفيديو (webm أخف، mp4 لكل المتصفحات) */
  sources: { src: string; type: string }[];
  /** صور لعرض شرائح احتياطي إذا تعذّر تشغيل الفيديو (مثلاً وضع توفير البطارية) */
  slides: string[];
  alt: string;
}

type Mode = "pending" | "video" | "slides" | "still";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-no-motion");

/**
 * خلفية الواجهة الحيّة: فيديو صامت قصير يبدأ فوق صورة تتحرك ببطء (Ken Burns).
 * - لا يُحمَّل الفيديو أصلاً عند طلب "تقليل الحركة" (من النظام أو من أداة الوصولية).
 * - إذا رفض المتصفح التشغيل التلقائي ينتقل لعرض شرائح من الصور.
 */
export default function HeroMedia({ poster, sources, slides, alt }: Props) {
  const [mode, setMode] = useState<Mode>("pending");
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const decide = () => {
      if (reduceMotion()) {
        setMode("still");
        videoRef.current?.pause();
        return;
      }
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      setMode((m) => (m === "pending" || m === "still" ? (conn?.saveData ? "slides" : "video") : m));
    };
    decide();
    // متابعة زر "إيقاف الحركة" في أداة الوصولية (يبدّل صنفاً على <html>)
    const mo = new MutationObserver(decide);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", decide);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", decide);
    };
  }, []);

  useEffect(() => {
    if (mode !== "video") return;
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => setMode("slides"));
  }, [mode]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-brand-50" aria-hidden="true">
      <Image src={poster} alt="" fill priority sizes="100vw" className={`object-cover object-center ${mode === "still" ? "" : "kenburns"}`} />

      {mode === "video" && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          poster={poster}
          disablePictureInPicture
          onPlaying={() => setReady(true)}
          onError={() => setMode("slides")}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      )}

      {mode === "slides" &&
        slides.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={alt}
            fill
            sizes="100vw"
            className="slide-fade kenburns object-cover object-center opacity-0"
            style={{ "--d": `${i * 4000}ms` } as React.CSSProperties}
          />
        ))}
    </div>
  );
}
