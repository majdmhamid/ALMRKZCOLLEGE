'use client'

import React, { useSyncExternalStore } from 'react'

/**
 * Background video of the hero (speed only — looks exactly like before).
 *
 * The poster image is what the visitor sees first, so the video file (~1 MB) is only requested
 * once the page has finished loading: it no longer competes with the poster, fonts and text for
 * the phone's bandwidth. It then autoplays (muted, looping) as it always did.
 */
const onLoad = (cb: () => void) => {
  window.addEventListener('load', cb)
  return () => window.removeEventListener('load', cb)
}
const pageLoaded = () => document.readyState === 'complete'
const notYet = () => false

export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const ready = useSyncExternalStore(onLoad, pageLoaded, notYet)
  return (
    <video
      muted
      loop
      playsInline
      autoPlay
      preload={ready ? 'auto' : 'none'}
      poster={poster}
      src={ready ? src : undefined}
      className="cover"
    />
  )
}
