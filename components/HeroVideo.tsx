"use client";

import { useEffect, useRef } from "react";

/** Muted looping background video. Some mobile browsers refuse autoplay until the first interaction, so retry then. */
export default function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const play = () => {
      if (!v.paused) return;
      v.muted = true;
      v.play()?.catch(() => {});
    };
    play();
    const events = ["pointerdown", "touchstart", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, play, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, play));
  }, []);

  return <video ref={ref} className="cover" src={src} poster={poster} muted loop playsInline autoPlay preload="auto" aria-hidden />;
}
