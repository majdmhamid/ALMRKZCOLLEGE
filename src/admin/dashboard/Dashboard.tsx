import type { CollectionSlug, ServerProps } from 'payload'
import Link from 'next/link'
import React from 'react'

import type { Lead, Media } from '@/payload-types'
import './dashboard.scss'

/**
 * رئيسية لوحة التحكم: ترحيب، شو لسا ما انتشر، آخر الطلبات، وبلاطات للأقسام (بصور حقيقية من المحتوى).
 */
type Tile = { href: string; title: string; text: string; slug?: CollectionSlug; imageField?: string; count?: number; images?: string[] }

const VERSIONED: { slug: CollectionSlug; label: string; titleField: string }[] = [
  { slug: 'success-stories', label: 'خريج', titleField: 'graduateName' },
  { slug: 'courses', label: 'دورة', titleField: 'name' },
  { slug: 'news', label: 'خبر', titleField: 'title' },
  { slug: 'course-groups', label: 'مجال', titleField: 'name' },
]

const thumb = (m: unknown) => {
  const d = m && typeof m === 'object' ? (m as Media) : undefined
  return d?.sizes?.thumbnail?.url || d?.url || ''
}

async function signingStats() {
  try {
    const [{ getDb }, { documentStats }] = await Promise.all([import('@/features/signing/server/db'), import('@/features/signing/server/repo/documents')])
    return await documentStats(await getDb())
  } catch {
    return null
  }
}

export async function Dashboard(props: ServerProps) {
  const { payload, user } = props
  if (!payload) return null
  const name = (user as { name?: string } | null)?.name || ''

  const find = (slug: CollectionSlug, extra: Record<string, unknown> = {}) =>
    payload
      .find({ collection: slug, limit: 4, depth: 1, locale: 'ar', sort: 'order', overrideAccess: true, ...extra } as never)
      .catch(() => ({ docs: [], totalDocs: 0 }))

  const [stories, courses, news, staff, partners, leads, newLeads, ...drafts] = await Promise.all([
    find('success-stories'),
    find('courses'),
    find('news', { sort: '-publishedAt' }),
    find('staff'),
    find('partners'),
    find('leads', { sort: '-createdAt', limit: 5, depth: 1 }),
    payload.count({ collection: 'leads', where: { status: { equals: 'new' } }, overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
    ...VERSIONED.map((v) =>
      payload
        .find({ collection: v.slug, where: { _status: { equals: 'draft' } }, draft: true, limit: 50, depth: 0, locale: 'ar', overrideAccess: true } as never)
        .then((r) => r.docs.map((d) => ({ ...v, id: (d as { id: number }).id, title: String((d as unknown as Record<string, unknown>)[v.titleField] ?? '') })))
        .catch(() => []),
    ),
  ])
  const signing = await signingStats()
  const pending: { slug: string; label: string; id: number | string; title: string; href?: string }[] = (
    drafts as { slug: string; label: string; id: number; title: string }[][]
  ).flat()
  // الصفحة الرئيسية كمان إلها مسودة (تعديل ما انتشر)
  const home = (await payload.findGlobal({ slug: 'homepage', draft: true, depth: 0, overrideAccess: true }).catch(() => null)) as { _status?: string } | null
  if (home?._status === 'draft') pending.unshift({ slug: 'homepage', label: 'صفحة', id: 'homepage', title: 'الصفحة الرئيسية للموقع', href: '/admin/globals/homepage' })

  const pics = (r: { docs: unknown[] }, field: string) => r.docs.map((d) => thumb((d as Record<string, unknown>)[field])).filter(Boolean)
  const tiles: Tile[] = [
    { href: '/admin/collections/success-stories', title: 'الخريجون', text: 'زيد أو عدّل خريج على نفس بطاقة الموقع', count: stories.totalDocs, images: pics(stories, 'photo') },
    { href: '/admin/collections/courses', title: 'الدورات', text: 'الاسم، الساعات، المحتوى، والصورة', count: courses.totalDocs, images: pics(courses, 'coverImage') },
    { href: '/admin/collections/news', title: 'الأخبار', text: 'خبر جديد بصور وعنوان ونص', count: news.totalDocs, images: pics(news, 'coverImage') },
    { href: '/admin/collections/staff', title: 'الطاقم', text: 'صور وأسماء ووظائف الطاقم', count: staff.totalDocs, images: pics(staff, 'photo') },
    { href: '/admin/collections/partners', title: 'الشركاء', text: 'لوغوهات الجهات الشريكة', count: partners.totalDocs, images: pics(partners, 'logo') },
    { href: '/admin/globals/homepage', title: 'الصفحة الرئيسية للموقع', text: 'ترتيب الأقسام، العناوين، الفيديو' },
    { href: '/admin/globals/gallery', title: 'معرض الصور والفيديو', text: 'صور الورشات والفعاليات' },
    { href: '/admin/globals/site-settings', title: 'معلومات الكلية', text: 'الهاتف، الواتساب، العنوان، اللوغو' },
    {
      href: '/admin/documents',
      title: 'التوقيع الإلكتروني',
      text: signing ? `${signing.waiting} بانتظار التوقيع · ${signing.signed} موقّعة` : 'رفع مستند وإرساله للطلاب للتوقيع',
      count: signing?.total,
    },
  ]

  return (
    <main className="almrkz-dash gutter--left gutter--right">
      <section className="almrkz-dash__hero">
        <div>
          <p className="almrkz-dash__eyebrow">كلية المركز للتأهيل المهني</p>
          <h1>أهلاً {name}</h1>
          <p>
            كل تعديل بالخريجين والدورات والأخبار والمجالات والصفحة الرئيسية بينحفظ كمسودة، والزوار ما بشوفوه إلا لما تضغط «انشر».
            الطاقم والشركاء والإعدادات بيتحدّثوا فوراً.
          </p>
        </div>
        <div className="almrkz-dash__status">
          {pending.length ? (
            <>
              <p className="almrkz-dash__status-label">تعديلات لسا ما انتشرت</p>
              <p className="almrkz-dash__status-num">{pending.length}</p>
              <ul>
                {pending.slice(0, 5).map((p) => (
                  <li key={`${p.slug}-${p.id}`}>
                    <Link href={p.href ?? `/admin/collections/${p.slug}/${p.id}`}>
                      {p.label}: {p.title || 'بدون اسم'}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="almrkz-dash__ok">✓ الموقع محدّث — ما في تعديلات معلّقة</p>
          )}
        </div>
      </section>

      <div className="almrkz-dash__cols">
        <section>
          <h2>شو بدك تعدّل؟</h2>
          <div className="almrkz-dash__tiles">
            {tiles.map((t) => (
              <Link key={t.href} href={t.href} className="almrkz-tile">
                <span className="almrkz-tile__head">
                  <b>{t.title}</b>
                  {t.count !== undefined && <span className="almrkz-tile__count">{t.count}</span>}
                </span>
                <span className="almrkz-tile__text">{t.text}</span>
                {!!t.images?.length && (
                  <span className="almrkz-tile__imgs">
                    {t.images.slice(0, 4).map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt="" loading="lazy" />
                    ))}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        <aside className="almrkz-dash__leads">
          <h2>
            آخر الطلبات
            {newLeads.totalDocs > 0 && <span className="almrkz-dash__new">{newLeads.totalDocs} جديد</span>}
          </h2>
          {leads.docs.length ? (
            <ul>
              {(leads.docs as Lead[]).map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/collections/leads/${l.id}`}>
                    <b>{l.name}</b>
                    <span dir="ltr">{l.phone}</span>
                    <small>
                      {typeof l.course === 'object' && l.course ? (l.course as { name?: string }).name : l.courseOther || ''} ·{' '}
                      {new Date(l.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                    </small>
                    {l.status === 'new' && <em>جديد</em>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="almrkz-dash__empty">لسا ما وصل ولا طلب من استمارة «سجّل اهتمامك».</p>
          )}
          <Link className="almrkz-dash__all" href="/admin/collections/leads">
            كل الطلبات ←
          </Link>
        </aside>
      </div>
    </main>
  )
}
