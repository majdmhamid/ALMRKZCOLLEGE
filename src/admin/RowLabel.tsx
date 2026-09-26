'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

/** Shows the item's own text on collapsed rows instead of «عنصر 01». */
export const LabelRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ label?: string }>()
  return <span>{data?.label || `عنصر ${String((rowNumber ?? 0) + 1)}`}</span>
}

export const TitleRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ title?: string }>()
  return <span>{data?.title || `عمود ${String((rowNumber ?? 0) + 1)}`}</span>
}
