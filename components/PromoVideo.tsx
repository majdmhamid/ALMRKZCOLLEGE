"use client";

import { useState } from "react";
import { PlayIcon } from "./Icons";

type Props = {
  src: string;
  poster: string;
  dur: string;
  labels: { play: string; kind: string; title: string; sub: string };
};

/** 16:9 poster with a play button; swaps to the real video player on click. */
export default function PromoVideo({ src, poster, dur, labels }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <div data-reveal className="promo lift">
      {playing ? (
        <video src={src} poster={poster} controls autoPlay playsInline className="cover promo-player" />
      ) : (
        <button type="button" className="promo-poster" onClick={() => setPlaying(true)} aria-label={`${labels.play}: ${labels.title}`}>
          <img src={poster} alt="" loading="lazy" decoding="async" className="cover" />
          <div className="promo-shade" />
          <span className="play-btn play-btn-lg ring">
            <PlayIcon size={38} style={{ marginLeft: 4 }} />
          </span>
          <span dir="ltr" className="dur-badge dur-badge-lg">
            <span className="dot" />
            {dur}
          </span>
          <div className="promo-caption">
            <span className="promo-kind">16:9 · {labels.kind}</span>
            <p className="promo-title">{labels.title}</p>
            <p className="promo-sub">{labels.sub}</p>
          </div>
        </button>
      )}
    </div>
  );
}
