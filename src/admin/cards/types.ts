export type Locale = 'ar' | 'he'
export type CardKind = 'stories' | 'staff' | 'partners' | 'courses' | 'news' | 'groups'

/** بطاقة واحدة كما تُعرض في اللوحة (مبسّطة من الوثيقة، باللغة الحالية + اللغة الثانية) */
export type Card = {
  id: number
  order: number
  status?: 'draft' | 'published'
  title: string
  titleOther: string
  sub?: string
  subOther?: string
  text?: string
  textOther?: string
  image?: string
  imageId?: number | null
  icon?: string
  relation?: number | null
  relationLabel?: string
  url?: string
  date?: string
  hours?: number | null
  sessions?: number | null
  flag?: boolean
  voucher?: boolean
}

export type CardLabels = {
  hours: string
  sessions: string
  evening: string
  viewCourse: string
  readMore: string
  voucher: string
}
