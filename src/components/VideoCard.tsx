"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "./Icons";

interface Props {
  src: string;
  poster: string;
  title: string;
  /** عمودي (ريلز 9:16) أو عريض (16:9) */
  orientation: "portrait" | "landscape";
  /** نص زر التشغيل لقارئ الشاشة */
  playLabel: string;
  /** نص المدة مثل "20 ثانية" (اختياري) */
  duration?: string;
  className?: string;
  /** أولوية تحميل الصورة (للفيديو الظاهر أول الصفحة) */
  priority?: boolean;
  sizes?: string;
}

/** حدث يُبثّ عند تشغيل أي فيديو حتى تتوقف باقي الفيديوهات في الصفحة */
const PLAY_EVENT = "almrkz:video-play";

/**
 * بطاقة فيديو محلي: تعرض الصورة الثابتة أولاً ولا تحمّل ملف الفيديو إلا عند الضغط
 * (preload="none")، ثم تشغّله مع الصوت وأزرار التحكم. تشغيل فيديو يوقف غيره تلقائياً.
 */
export default function VideoCard({ src, poster, title, orientation, playLabel, duration, className = "", priority, sizes }: Props) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const portrait = orientation === "portrait";

  useEffect(() => {
    const onOther = (e: Event) => {
      const v = videoRef.current;
      if (v && (e as CustomEvent<HTMLVideoElement>).detail !== v && !v.paused) v.pause();
    };
    window.addEventListener(PLAY_EVENT, onOther);
    return () => window.removeEventListener(PLAY_EVENT, onOther);
  }, []);

  const start = () => {
    const v = videoRef.current;
    if (!v) return;
    setPlaying(true);
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => setPlaying(false));
  };

  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-black shadow-card ${portrait ? "aspect-[9/16]" : "aspect-video"} ${className}`}>
      <video
        ref={videoRef}
        src={src}
        preload="none"
        playsInline
        controls={playing}
        poster={poster}
        onPlay={(e) => window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: e.currentTarget }))}
        onEnded={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover"
        aria-label={title}
      />
      {!playing && (
        <button type="button" onClick={start} className="absolute inset-0 h-full w-full text-start" aria-label={`${playLabel}: ${title}`}>
          <Image src={poster} alt="" fill priority={priority} sizes={sizes ?? (portrait ? "(min-width: 1024px) 260px, 70vw" : "(min-width: 1024px) 640px, 100vw")} className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/0" aria-hidden="true" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className={`pulse-ring relative isolate flex items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition group-hover:scale-110 ${portrait ? "h-14 w-14" : "h-16 w-16 md:h-20 md:w-20"}`}>
              <PlayIcon width={portrait ? 28 : 36} height={portrait ? 28 : 36} className="ms-1" />
            </span>
          </span>
          {duration && <span className="absolute top-3 end-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">{duration}</span>}
          <span className={`absolute inset-x-0 bottom-0 p-4 text-white ${portrait ? "text-sm font-bold leading-snug" : "text-base font-bold md:text-lg"}`}>{title}</span>
        </button>
      )}
    </div>
  );
}
