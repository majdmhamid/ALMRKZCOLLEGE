import type { OwnerInfo } from '@/lib/media-slots-server'
import type { Slot } from '@/lib/media-slots'

export type MediaInfo = {
  id: number | string
  url: string
  /** small picture (a picture's own, empty for a video) */
  thumb: string
  filename: string
  filesize: number | null
  mimeType: string
  alt: string
}

/** A place + whether the latest draft differs from what visitors see now */
export type SlotView = Slot & { changed: boolean }

export type HubData = {
  slots: SlotView[]
  media: Record<string, MediaInfo>
  owners: Record<string, OwnerInfo>
  /** ?focus=<slot key> — opened from «مستعمل في:» in the media library */
  focus: string | null
}
