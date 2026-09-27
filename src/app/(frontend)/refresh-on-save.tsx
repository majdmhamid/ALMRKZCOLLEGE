'use client'

import { RefreshRouteOnSave as PayloadRefresh } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

/**
 * Live preview inside /admin: reload the page whenever the editor saves.
 * Kept in its own file so the live-preview library is only downloaded in preview mode,
 * never by ordinary visitors.
 */
export function RefreshRouteOnSave({ serverURL }: { serverURL: string }) {
  const router = useRouter()
  return <PayloadRefresh refresh={() => router.refresh()} serverURL={serverURL} />
}
