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
  return { courses, groups, stories, news, staff, partners, leads, newLeads }
}

export type NavCounts = Awaited<ReturnType<typeof navCounts>>
