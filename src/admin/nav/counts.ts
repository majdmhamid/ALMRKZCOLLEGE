import type { Payload } from 'payload'

/** أعداد صغيرة للقائمة الجانبية وللرئيسية. أي خطأ = بدون رقم (القائمة ما بتوقف). */
export async function navCounts(payload: Payload) {
  const count = async (collection: string, where?: Record<string, unknown>) => {
    try {
      const r = await payload.count({ collection: collection as 'courses', where: where as never, overrideAccess: true })
      return r.totalDocs
    } catch {
      return undefined
    }
  }
  const [courses, groups, stories, news, staff, partners, leads, newLeads] = await Promise.all([
    count('courses'),
    count('course-groups'),
    count('success-stories'),
    count('news'),
    count('staff'),
    count('partners'),
    count('leads'),
    count('leads', { status: { equals: 'new' } }),
  ])
  const signing = await signingCounts()
  return { courses, groups, stories, news, staff, partners, leads, newLeads, ...signing }
}

/** التوقيع الإلكتروني: كم مستند بانتظار التوقيع، وكم توقيع جديد ما انشاف */
async function signingCounts(): Promise<{ docsWaiting?: number; docsUnread?: number }> {
  try {
    const [{ getDb }, { documentStats }, { unreadCount }] = await Promise.all([
      import('@/features/signing/server/db'),
      import('@/features/signing/server/repo/documents'),
      import('@/features/signing/server/repo/notifications'),
    ])
    const db = await getDb()
    const [stats, unread] = await Promise.all([documentStats(db), unreadCount(db)])
    return { docsWaiting: stats.waiting, docsUnread: unread }
  } catch (e) {
    console.error('[nav] signing counts', e)
    return {}
  }
}

export type NavCounts = Awaited<ReturnType<typeof navCounts>>
