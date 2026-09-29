'use client'

import React, { useSyncExternalStore } from 'react'

import { motionOff, subscribeMotion } from './client'

/**
 * Background video of the hero (speed only — looks exactly like before).
 *
 * The poster image is what the visitor sees first (with its slow zoom), so the video file
 * (~1 MB) is only requested once the page has finished loading: it no longer competes with the
 * poster, fonts and text for the phone's bandwidth. It then autoplays (muted, looping) as before.
 *
 * Visitors who asked for less motion (device setting or the «stop motion» button in the header),
 * or turned on the browser's data saver, keep the poster and never download the video.
 */
const onLoad = (cb: () => void) => {
  window.addEventListener('load', cb)
  const offMotion = subscribeMotion(cb)
  return () => {
    window.removeEventListener('load', cb)
    offMotion()
  }
}
const pageLoaded = () => document.readyState === 'complete'
const notYet = () => false

const skipVideo = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  motionOff() ||
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true

export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const ready = useSyncExternalStore(onLoad, () => pageLoaded() && !skipVideo(), notYet)
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
