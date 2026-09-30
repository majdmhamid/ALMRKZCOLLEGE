'use client'

import { uploadRequiresServerValidation } from 'payload/shared'

import { call, shrinkImage } from '../cards/api'

export type MediaDoc = {
  id: number
  url?: string | null
  alt?: string | null
  filename?: string | null
  mimeType?: string | null
  sizes?: Record<string, { url?: string | null } | undefined> | null
}

type UploadHandler = (args: { file: File; updateFilename: (name: string) => void }) => Promise<unknown>

export const isVideo = (m?: MediaDoc | null) => Boolean(m?.mimeType?.startsWith('video/'))
export const thumbOf = (m?: MediaDoc | null) => m?.sizes?.card?.url || m?.sizes?.thumbnail?.url || m?.url || ''

const cache = new Map<number, Promise<MediaDoc | null>>()

/** One file of the library (for the preview in the dialog). */
export function getMedia(id: number | null | undefined): Promise<MediaDoc | null> {
  if (!id) return Promise.resolve(null)
  if (!cache.has(id)) {
    cache.set(
      id,
      call<MediaDoc>(`/api/media/${id}?depth=0`, { method: 'GET' }).catch(() => {
        cache.delete(id)
        return null
      }),
    )
  }
  return cache.get(id)!
}

/** Latest files of the library (images or videos), optionally filtered by name / description. */
export async function listMedia(kind: 'image' | 'video', search: string, page = 1) {
  const q = new URLSearchParams({ limit: '30', page: String(page), sort: '-createdAt', depth: '0' })
  q.set('where[and][0][mimeType][contains]', kind)
  if (search.trim()) {
    q.set('where[and][1][or][0][alt][like]', search.trim())
    q.set('where[and][1][or][1][filename][like]', search.trim())
  }
  return call<{ docs: MediaDoc[]; hasNextPage?: boolean }>(`/api/media?${q}`, { method: 'GET' })
}

/**
 * Uploads a file to the library («الصور والفيديو»). The description (alt) is required there.
 * When the site keeps files in the cloud (S3 / Vercel Blob), the admin's own «client upload»
 * handler sends the file straight from the browser — big videos never pass through the server
 * (Vercel refuses requests over 4.5 MB). Locally, the file goes to the server as usual.
 */
export async function uploadMedia(original: File, alt: string, handler: UploadHandler | null): Promise<MediaDoc> {
  const file = original.type.startsWith('image/') ? await shrinkImage(original) : original
  const form = new FormData()
  form.set('_payload', JSON.stringify({ alt: alt.trim() || file.name }))
  if (handler && !uploadRequiresServerValidation({ filename: file.name, mimeType: file.type })) {
    let filename = file.name
    const clientUploadContext = await handler({ file, updateFilename: (n) => (filename = n) })
    form.set(
      'file',
      JSON.stringify({ clientUploadContext, collectionSlug: 'media', filename, mimeType: file.type, size: file.size }),
    )
  } else {
    form.set('file', file)
  }
  const doc = await call<MediaDoc>('/api/media?locale=ar&depth=0', { method: 'POST', body: form })
  cache.set(doc.id, Promise.resolve(doc))
  return doc
}
