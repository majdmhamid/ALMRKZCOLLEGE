'use client'

import { toast } from '@payloadcms/ui'
import { ChevronLeft, ChevronRight, GripVertical, House, ImagePlus, Loader2, Pencil, Plus, Rocket, Star, Table2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react'

import { publishAll, publishDoc } from './actions'
import { ApiError, createDoc, deleteDoc, updateDoc, uploadMedia } from './api'
import { groupStateText } from '@/lib/group-visibility'
import { homeState, type HomeState } from '@/lib/home-stories'

import type { Card, CardKind, CardLabels, Locale } from './types'

/** اسم الحقل بقاعدة البيانات لكل خانة بالبطاقة */
const FIELDS: Record<CardKind, { title: string; sub?: string; text?: string; image: string; relation?: string; flag?: string; url?: string }> = {
  stories: { title: 'graduateName', sub: 'currentRole', text: 'quote', image: 'photo', relation: 'course', flag: 'featured' },
  staff: { title: 'name', sub: 'role', image: 'photo' },
  partners: { title: 'name', image: 'logo', url: 'url' },
  courses: { title: 'name', sub: 'shortDescription', image: 'coverImage', flag: 'featured' },
  news: { title: 'title', sub: 'excerpt', image: 'coverImage', flag: 'pinned' },
  groups: { title: 'name', sub: 'tagline', image: 'image' },
}

const FLAG_LABEL: Partial<Record<CardKind, [on: string, off: string]>> = {
  courses: ['دورة مميّزة بالرئيسية', 'اعرضها بالرئيسية'],
  news: ['مثبّت فوق', 'ثبّته فوق'],
}

const NEW_LABEL: Record<CardKind, string> = {
  stories: 'خريج جديد',
  staff: 'عضو طاقم جديد',
  partners: 'شريك جديد',
  courses: 'دورة جديدة',
  news: 'خبر جديد',
  groups: 'مجال جديد',
}

/** أقسام بدها صفحة تعديل كاملة للإضافة (حقول كثيرة إجبارية) */
const CREATE_IN_FORM: CardKind[] = ['courses', 'news', 'groups']

type Props = {
  kind: CardKind
  collection: string
  title: string
  description: string
  cards: Card[]
  locale: Locale
  versioned: boolean
  labels: CardLabels
  courseOptions: { value: number; label: string; group?: string }[]
  canCreate: boolean
  canDelete: boolean
  /** تنبيه إذا النجمة ☆ ما إلها تأثير (اختيار يدوي بالرئيسية) */
  flagNote?: string
  /** لغة اللوحة (مش لغة المحتوى) — لنصوص مثل «ظاهر بالموقع» */
  lang?: 'ar' | 'he'
}

export function CardsGrid(props: Props) {
  const { kind, collection, cards: initial, locale, versioned, canCreate } = props
  const router = useRouter()
  const [cards, setCards] = useState(initial)
  const [pending, start] = useTransition()
  const fileForNew = useRef<HTMLInputElement>(null)
  // بعد التحديث من السيرفر (إضافة، حذف، نشر) منبلّش من البيانات الجديدة
  const [seen, setSeen] = useState(initial)
  if (seen !== initial) {
    setSeen(initial)
    setCards(initial)
  }

  const drafts = cards.filter((c) => c.status === 'draft').length
  const nextOrder = cards.reduce((m, c) => Math.max(m, c.order || 0), 0) + 1

  const patchLocal = useCallback((id: number, patch: Partial<Card>) => setCards((all) => all.map((c) => (c.id === id ? { ...c, ...patch } : c))), [])

  const addNew = async (logo?: File) => {
    if (CREATE_IN_FORM.includes(kind)) {
      router.push(`/admin/collections/${collection}/create?locale=${locale}`)
      return
    }
    try {
      const data: Record<string, unknown> = { order: nextOrder }
      if (kind === 'stories') data.graduateName = 'خريج جديد'
      if (kind === 'staff') Object.assign(data, { name: 'اسم جديد', role: 'الوظيفة' })
      if (kind === 'partners') {
        if (!logo) return fileForNew.current?.click()
        const m = await uploadMedia(logo, 'شريك جديد', locale)
        Object.assign(data, { name: 'شريك جديد', logo: m.id })
      }
      await createDoc(collection, data, { locale, draft: versioned })
      toast.success('انضاف — عدّل الاسم والصورة على البطاقة.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'ما قدرنا نضيف — جرّب كمان مرة.')
    }
  }

  const publishEverything = () =>
    start(async () => {
      const r = await publishAll(collection)
      if (r.ok) toast.success(r.count ? `انتشر ${r.count} — الموقع صار محدّث.` : 'ما في تعديلات للنشر.')
      else toast.error(r.count ? `انتشر ${r.count}. ${r.message}` : r.message, { duration: 20000 })
      router.refresh()
    })

  // الترتيب بالسحب (أو بالأسهم ‹ › على بطاقات قصص النجاح)
  const [dragging, setDragging] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const drop = async (targetId: number) => {
    if (dragging == null || dragging === targetId) return
    const ids = cards.map((c) => c.id)
    const from = ids.indexOf(dragging)
    const to = ids.indexOf(targetId)
    ids.splice(to, 0, ...ids.splice(from, 1))
    await saveOrder(ids)
  }
  const move = async (id: number, step: -1 | 1) => {
    const ids = cards.map((c) => c.id)
    const from = ids.indexOf(id)
    const to = from + step
    if (from < 0 || to < 0 || to >= ids.length) return
    ids.splice(to, 0, ...ids.splice(from, 1))
    await saveOrder(ids)
  }
  const saveOrder = async (ids: number[]) => {
    const reordered = ids.map((id, i) => ({ ...cards.find((c) => c.id === id)!, order: i + 1 }))
    const changed = reordered.filter((c) => cards.find((x) => x.id === c.id)!.order !== c.order)
    setCards(reordered.map((c) => (changed.includes(c) && versioned ? { ...c, status: 'draft' } : c)))
    try {
      await Promise.all(changed.map((c) => updateDoc(collection, c.id, { order: c.order }, { locale, draft: versioned })))
      toast.success(versioned ? 'انحفظ الترتيب كمسودة — اضغط «انشر» ليظهر على الموقع.' : 'انحفظ الترتيب.')
      // منجيب الترتيب من السيرفر كمان مرة (لو وصل تحديث قديم بالنص وخربط الترتيب على الشاشة)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'ما انحفظ الترتيب.')
      router.refresh()
    }
  }

  return (
    <main className="cards-view gutter--left gutter--right">
      <header className="cards-view__head">
        <div>
          <h1>{props.title}</h1>
          <span className="cards-view__bar" aria-hidden="true" />
          {props.description && <p className="cards-view__desc">{props.description}</p>}
          <p className="cards-view__hint">
            {kind === 'courses' || kind === 'news' || kind === 'groups' ? (
              <>
                اكتب مباشرة على <b>الاسم</b> و<b>الوصف</b>، اضغط على <b>الصورة</b> لتبديلها، أو اضغط <b>✎</b> لكل التفاصيل مع معاينة الصفحة.
              </>
            ) : (
              <>
                اكتب مباشرة على <b>البطاقة</b>، اضغط على <b>الصورة</b> أو اسحب صورة فوقها لتبديلها، واسحب <b>⠿</b> لتغيير الترتيب.
              </>
            )}{' '}
            بتعدّل هلأ <b>{locale === 'ar' ? 'بالعربي' : 'بالعبري'}</b> — السطر الصغير تحت كل بطاقة للغة الثانية.
            {!versioned && <> التعديل بيظهر على الموقع فوراً.</>}
            {kind === 'stories' && (
              <>
                {' '}
                لتطلع قصة بالصفحة الرئيسية: اضغط <b>«اعرضها بالرئيسية»</b> على بطاقتها وبعدين <b>«انشر»</b>. ترتيب البطاقات هون = ترتيبها بالرئيسية.
              </>
            )}
          </p>
          {props.flagNote && <p className="cards-view__note">{props.flagNote}</p>}
        </div>
        <div className="cards-view__actions">
          {versioned && drafts > 0 && (
            <button type="button" className="btn btn--style-primary btn--size-medium" onClick={publishEverything} disabled={pending}>
              {pending ? <Loader2 size={16} className="spin" /> : <Rocket size={16} />} انشر كل التعديلات ({drafts})
            </button>
          )}
          {canCreate && (
            <button type="button" className={`btn ${versioned && drafts ? 'btn--style-secondary' : 'btn--style-primary'} btn--size-medium`} onClick={() => addNew()}>
              <Plus size={16} /> {NEW_LABEL[kind]}
            </button>
          )}
          <a className="btn btn--style-secondary btn--size-medium" href={`/admin/collections/${collection}?view=table&locale=${locale}`}>
            <Table2 size={16} /> عرض كجدول
          </a>
        </div>
      </header>
      <input
        ref={fileForNew}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void addNew(f)
        }}
      />

      <div className="cards-frame">
        <div className="cards-frame__bar">
          <i />
          <i />
          <i />
          <span>هيك بتظهر على الموقع</span>
        </div>
        <div className="site-scope cards-frame__body" dir="rtl" lang={locale}>
          {/* عنوان لقارئ الشاشة: عناوين البطاقات تحت h3 (زي الموقع) */}
          <h2 className="sr-only">{props.title}</h2>
          <div className={`cards-grid cards-grid--${kind}`}>
            {cards.map((c) => (
              <div
                key={c.id}
                className={`edit-card ${dragging === c.id ? 'is-dragging' : ''} ${over === c.id && dragging !== c.id ? 'drop-target' : ''}`}
                onDragOver={(e) => {
                  if (dragging == null) return
                  e.preventDefault()
                  setOver(c.id)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  void drop(c.id)
                  setDragging(null)
                  setOver(null)
                }}
              >
                <EditableCard
                  {...props}
                  card={c}
                  onLocal={(patch) => patchLocal(c.id, patch)}
                  onMove={kind === 'stories' ? (step) => void move(c.id, step) : undefined}
                  isFirst={c === cards[0]}
                  isLast={c === cards[cards.length - 1]}
                  onDragStart={() => setDragging(c.id)}
                  onDragEnd={() => {
                    setDragging(null)
                    setOver(null)
                  }}
                  onRemoved={() => {
                    setCards((all) => all.filter((x) => x.id !== c.id))
                    router.refresh()
                  }}
                  onPublished={() => {
                    patchLocal(c.id, { status: 'published' })
                    router.refresh()
                  }}
                />
              </div>
            ))}
            {canCreate && (
              <button type="button" className={`add-card add-card--${kind}`} onClick={() => addNew()}>
                <span>
                  <Plus size={24} />
                </span>
                {NEW_LABEL[kind]}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

/* ─────────────────────────── بطاقة واحدة ─────────────────────────── */

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function EditableCard({
  kind,
  collection,
  card,
  locale,
  versioned,
  labels,
  courseOptions,
  canDelete,
  lang,
  onLocal,
  onMove,
  isFirst,
  isLast,
  onDragStart,
  onDragEnd,
  onRemoved,
  onPublished,
}: Props & {
  card: Card
  onLocal: (p: Partial<Card>) => void
  /** قصص النجاح: قدّم/أخّر البطاقة خطوة (−1 = قبل) */
  onMove?: (step: -1 | 1) => void
  isFirst?: boolean
  isLast?: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onRemoved: () => void
  onPublished: () => void
}) {
  const f = FIELDS[kind]
  const other: Locale = locale === 'ar' ? 'he' : 'ar'
  const [save, setSave] = useState<SaveState>('idle')
  const [armed, setArmed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  /** آخر قيمة لكل خانة — بتنبعت هي بس، حتى لو الكتابة كانت أسرع من الحفظ */
  const latest = useRef<Record<string, { field: string; value: unknown; loc: Locale }>>({})
  /** الحفظ واحد ورا الثاني لكل بطاقة (ما في طلبين بنفس الوقت يخربطوا على بعض) */
  const queue = useRef<Promise<void>>(Promise.resolve())
  const pendingCount = useRef(0)

  /** حفظ تلقائي بعد ما يوقف عن الكتابة */
  const persist = (field: string, value: unknown, loc: Locale = locale, delay = 700) => {
    const key = `${field}:${loc}`
    latest.current[key] = { field, value, loc }
    clearTimeout(timers.current[key])
    setSave('saving')
    timers.current[key] = setTimeout(() => {
      pendingCount.current++
      queue.current = queue.current.then(async () => {
        const job = latest.current[key]
        if (!job) {
          pendingCount.current--
          return
        }
        delete latest.current[key]
        try {
          await updateDoc(collection, card.id, { [job.field]: job.value }, { locale: job.loc, draft: versioned })
          if (versioned) onLocal({ status: 'draft' })
          pendingCount.current--
          if (!pendingCount.current && !Object.keys(latest.current).length) setSave('saved')
        } catch (e) {
          pendingCount.current--
          setSave('error')
          toast.error(e instanceof ApiError ? e.message : 'ما انحفظ التعديل.')
        }
      })
    }, delay)
  }

  /**
   * بستنى كل الحفظ المعلّق (قبل النشر). بيرجّع false إذا في تعديل ما انحفظ (مثلاً سعر) —
   * وقتها ما منكمّل للنشر. الطابور بضل «سليم» حتى بعد غلط، وإلا كل تعديل بعده ما كان ينحفظ.
   */
  const flush = async () => {
    let ok = true
    for (const [key, t] of Object.entries(timers.current)) {
      clearTimeout(t)
      const job = latest.current[key]
      if (job) {
        delete latest.current[key]
        const j = job
        queue.current = queue.current.then(() =>
          updateDoc(collection, card.id, { [j.field]: j.value }, { locale: j.loc, draft: versioned }).then(
            () => undefined,
            (e) => {
              ok = false
              setSave('error')
              toast.error(e instanceof ApiError ? e.message : 'ما انحفظ التعديل.')
            },
          ),
        )
      }
    }
    await queue.current
    return ok
  }

  // طلعت من الصفحة (مثلاً ضغطت ✎) قبل ما يخلص الـ 0.7 ثانية؟ منبعت آخر تعديل فوراً.
  const unsent = useRef({ collection, id: card.id, versioned })
  useEffect(() => {
    unsent.current = { collection, id: card.id, versioned }
  })
  useEffect(() => {
    const pending = latest.current
    const waiting = timers.current
    const sendNow = () => {
      for (const t of Object.values(waiting)) clearTimeout(t)
      const { collection: c, id, versioned: v } = unsent.current
      for (const [key, job] of Object.entries(pending)) {
        delete pending[key]
        void updateDoc(c, id, { [job.field]: job.value }, { locale: job.loc, draft: v, keepalive: true }).catch(() => undefined)
      }
    }
    // ✎ و«عرض كجدول» روابط عادية: الصفحة بتنسكّر بدون ما React يفكّ البطاقات
    window.addEventListener('pagehide', sendNow)
    return () => {
      window.removeEventListener('pagehide', sendNow)
      sendNow()
    }
  }, [])

  const edit = (key: keyof Card, field: string | undefined, value: string, loc: Locale = locale) => {
    if (!field) return
    onLocal({ [key]: value } as Partial<Card>)
    persist(field, value, loc)
  }

  const changePhoto = async (file: File) => {
    setBusy(true)
    try {
      const m = await uploadMedia(file, card.title, locale)
      onLocal({ image: m.url, imageId: m.id })
      persist(f.image, m.id, locale, 0)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'ما قدرنا نرفع الصورة.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    try {
      await deleteDoc(collection, card.id)
      toast.success(`انحذف: ${card.title}`)
      onRemoved()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'ما قدرنا نحذف.')
    }
  }

  const publish = async () => {
    setBusy(true)
    if (!(await flush())) {
      setBusy(false)
      return
    }
    const r = await publishDoc(collection, card.id)
    setBusy(false)
    if (r.ok) {
      if (kind === 'stories') onLocal({ flagLive: Boolean(card.flag) })
      if (r.groupState === 'noCourses') toast.info(groupStateText(lang).savedNoCourses, { duration: 15000 })
      else toast.success('انتشر على الموقع.')
      onPublished()
    } else toast.error(r.message, { duration: 20000 })
  }

  const title = (cls: string, placeholder: string) => (
    <InlineInput className={cls} value={card.title} placeholder={placeholder} onChange={(v) => edit('title', f.title, v)} />
  )
  const photo = (cls: string, round = false) => (
    <PhotoDrop className={cls} src={card.image} alt={card.title} busy={busy} round={round} contain={kind === 'partners'} onFile={changePhoto} />
  )
  const editHref = `/admin/collections/${collection}/${card.id}?locale=${locale}`

  /** قصص النجاح: زر «اعرضها بالرئيسية» — بينحفظ كمسودة زي كل تعديل، وبيطلع على الموقع بعد «انشر» */
  const toggleHome = () => {
    const next = !card.flag
    onLocal({ flag: next })
    persist(f.flag!, next, locale, 0)
    if (versioned && next !== Boolean(card.flagLive))
      toast.info(next ? 'انحفظ — اضغط «انشر» على البطاقة لتطلع القصة بالرئيسية.' : 'انحفظ — اضغط «انشر» على البطاقة لتختفي من الرئيسية.')
  }

  let body: React.ReactNode
  switch (kind) {
    case 'stories':
      body = (
        <article className="story-card-admin">
          <div className="zoom story-photo" style={{ aspectRatio: '4 / 5', borderRadius: 18 }}>
            {photo('cover')}
            <HomeBadge state={homeState(Boolean(card.flag), Boolean(card.flagLive))} />
            <div className="shade-bottom" style={{ background: 'linear-gradient(to top,rgba(5,38,19,.8),rgba(5,38,19,0) 55%)', pointerEvents: 'none' }} />
            <div className="story-cap" style={{ pointerEvents: 'none' }}>
              <div>
                <p>{card.title || 'بدون اسم'}</p>
              </div>
            </div>
          </div>
          <div className="story-card-admin__text">
            {title('story-name-input', 'اسم الخريج/ة')}
            <select className="inline-edit soft-pill-select" value={card.relation ?? ''} onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null
              onLocal({ relation: v, relationLabel: courseOptions.find((o) => o.value === v)?.label ?? '' })
              persist(f.relation!, v, locale, 0)
            }} aria-label="الدورة">
              <option value="">— الدورة اللي خلّصها —</option>
              {courseOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <InlineInput multiline className="story-quote" value={card.text ?? ''} placeholder="«اقتباس قصير بكلماته» (اختياري)" onChange={(v) => edit('text', f.text, v)} />
            <InlineInput className="story-now" value={card.sub ?? ''} placeholder="شو بيشتغل اليوم (اختياري)" onChange={(v) => edit('sub', f.sub, v)} />
          </div>
          <HomeToggle
            state={homeState(Boolean(card.flag), Boolean(card.flagLive))}
            noPhoto={!card.image}
            busy={busy}
            onToggle={toggleHome}
            onPublish={publish}
          />
        </article>
      )
      break
    case 'staff':
      body = (
        <article className="staff-card" style={{ width: '100%' }}>
          <div className="staff-photo">{photo('')}</div>
          <div className="staff-info">
            <h3>{title('', 'الاسم')}</h3>
            <InlineInput multiline className="staff-role" value={card.sub ?? ''} placeholder="الوظيفة" onChange={(v) => edit('sub', f.sub, v)} />
          </div>
        </article>
      )
      break
    case 'partners':
      body = (
        <article className="partner-admin">
          <div className="partner">{photo('', false)}</div>
          {title('partner-name', 'اسم الجهة')}
          <InlineInput className="partner-url" dir="ltr" value={card.url ?? ''} placeholder="رابط موقعهم (اختياري)" onChange={(v) => {
            onLocal({ url: v })
            persist(f.url!, v)
          }} />
        </article>
      )
      break
    case 'courses':
      body = (
        <article className="glass lift zoom course-card">
          <div className="course-media" style={{ display: 'block' }}>
            {photo('cover')}
            {card.relationLabel && <span className="tag">{card.relationLabel}</span>}
          </div>
          <div className="course-body">
            <h3>{title('', 'اسم الدورة')}</h3>
            <InlineInput multiline className="sum" value={card.sub ?? ''} placeholder="وصف قصير للبطاقة (سطرين)" onChange={(v) => edit('sub', f.sub, v)} />
            <div className="facts3">
              <div>
                <b dir="ltr">{card.hours ?? '—'}</b>
                {labels.hours}
              </div>
              <div>
                <b dir="ltr">{card.sessions ?? '—'}</b>
                {labels.sessions}
              </div>
              <div>{card.scheduleText || labels.evening}</div>
            </div>
            <div className="course-foot">
              <span>{card.voucher && <span className="voucher-dot">{labels.voucher}</span>}</span>
              <a href={editHref} className="btn btn-green">
                ✎ كل التفاصيل
              </a>
            </div>
          </div>
        </article>
      )
      break
    case 'news':
      body = (
        <article className="glass lift zoom news-card">
          <div className="course-media">
            {photo('cover')}
            {card.date && (
              <time className="tag" dateTime={card.date}>
                {new Date(card.date).toLocaleDateString(locale === 'he' ? 'he-IL' : 'ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            )}
          </div>
          <div className="course-body" style={{ gap: 8 }}>
            <h3>{title('', 'عنوان الخبر')}</h3>
            <InlineInput multiline className="ex" value={card.sub ?? ''} placeholder="ملخّص قصير" onChange={(v) => edit('sub', f.sub, v)} />
            <a href={editHref} className="more">
              ✎ النص الكامل والصور
            </a>
          </div>
        </article>
      )
      break
    case 'groups':
      body = (
        <article className="glass lift zoom field-card">
          <div className="field-media">
            {photo('cover')}
            <div className="shade-bottom" style={{ pointerEvents: 'none' }} />
          </div>
          <div className="field-body">
            <span className="field-icon">{card.icon && <img src={card.icon} alt="" width={36} height={36} />}</span>
            <span style={{ flex: 1 }}>
              <h3>{title('', 'اسم المجال')}</h3>
              <InlineInput value={card.sub ?? ''} placeholder="جملة قصيرة" onChange={(v) => edit('sub', f.sub, v)} />
            </span>
          </div>
        </article>
      )
      if (card.siteState) body = (
        <>
          {body}
          <SiteState state={card.siteState} lang={lang} />
        </>
      )
      break
  }

  return (
    <div className="edit-card__inner" draggable={armed} onDragStart={(e) => {
      e.dataTransfer.effectAllowed = 'move'
      onDragStart()
    }} onDragEnd={() => {
      setArmed(false)
      onDragEnd()
    }}>
      <div className="edit-card__top">
        {card.status === 'draft' ? (
          <button type="button" className="pill-draft" onClick={publish} disabled={busy} title="التعديلات على هاي البطاقة لسا ما انتشرت على الموقع">
            <Rocket size={13} /> مسودة — انشر
          </button>
        ) : card.status === 'published' ? (
          <span className="pill-live">منشور</span>
        ) : (
          <span />
        )}
        <SaveBadge state={save} />
        <span className="edit-card__tools">
          {f.flag && kind !== 'stories' && (
            <button
              type="button"
              className={`tool ${card.flag ? 'tool--on' : ''}`}
              title={FLAG_LABEL[kind]?.[card.flag ? 0 : 1]}
              aria-pressed={card.flag}
              onClick={() => {
                onLocal({ flag: !card.flag })
                persist(f.flag!, !card.flag, locale, 0)
              }}
            >
              <Star size={15} fill={card.flag ? 'currentColor' : 'none'} />
            </button>
          )}
          <a className="tool" href={editHref} title="كل التفاصيل (مع معاينة الصفحة)">
            <Pencil size={15} />
          </a>
          {onMove && (
            <>
              <button type="button" className="tool" title="قدّمها (بتطلع قبل)" aria-label="قدّمها" disabled={isFirst} onClick={() => onMove(-1)}>
                <ChevronRight size={15} />
              </button>
              <button type="button" className="tool" title="أخّرها (بتطلع بعد)" aria-label="أخّرها" disabled={isLast} onClick={() => onMove(1)}>
                <ChevronLeft size={15} />
              </button>
            </>
          )}
          <span className="tool tool--grab" title="اسحب لتغيير الترتيب" onPointerDown={() => setArmed(true)} onPointerUp={() => setArmed(false)}>
            <GripVertical size={15} />
          </span>
          {canDelete && (
            <button type="button" className="tool tool--danger" title="احذف" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={15} />
            </button>
          )}
        </span>
      </div>

      {body}

      <label className={`other-lang ${card.titleOther.trim() ? '' : 'other-lang--missing'}`}>
        <span>{other === 'he' ? 'עברית' : 'عربي'}</span>
        <input
          lang={other}
          value={card.titleOther}
          placeholder={`الاسم ب${other === 'he' ? 'العبري' : 'العربي'}`}
          onChange={(e) => {
            onLocal({ titleOther: e.target.value })
            persist(f.title, e.target.value, other)
          }}
        />
      </label>
      {f.sub && kind !== 'stories' && (
        <label className={`other-lang ${(card.subOther ?? '').trim() ? '' : 'other-lang--missing'}`}>
          <span>{other === 'he' ? 'עברית' : 'عربي'}</span>
          <input
            lang={other}
            value={card.subOther ?? ''}
            placeholder={kind === 'staff' ? 'الوظيفة' : 'الوصف'}
            onChange={(e) => {
              onLocal({ subOther: e.target.value })
              persist(f.sub!, e.target.value, other)
            }}
          />
        </label>
      )}
      {kind === 'stories' && (
        <label className={`other-lang ${(card.textOther ?? '').trim() || !card.text ? '' : 'other-lang--missing'}`}>
          <span>{other === 'he' ? 'עברית' : 'عربي'}</span>
          <input
            lang={other}
            value={card.textOther ?? ''}
            placeholder="الاقتباس"
            onChange={(e) => {
              onLocal({ textOther: e.target.value })
              persist(f.text!, e.target.value, other)
            }}
          />
        </label>
      )}

      {confirmDelete && (
        <div className="confirm-delete" role="alertdialog">
          <p>
            تحذف <b>{card.title || 'هاي البطاقة'}</b>؟ ما في رجعة.
          </p>
          <div>
            <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setConfirmDelete(false)}>
              لا
            </button>
            <button type="button" className="btn btn--style-primary btn--size-small confirm-delete__yes" onClick={remove}>
              نعم، احذف
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const HOME_BADGE: Record<HomeState, string> = {
  shown: '✓ بالرئيسية',
  willShow: 'بتطلع بالرئيسية بعد «انشر»',
  willHide: 'بتختفي من الرئيسية بعد «انشر»',
  hidden: 'مخفية من الرئيسية',
}

/** قصص النجاح: الحالة بالرئيسية على زاوية الصورة — بنظرة وحدة */
function HomeBadge({ state }: { state: HomeState }) {
  return <span className={`home-badge home-badge--${state}`}>{HOME_BADGE[state]}</span>
}

/** قصص النجاح: الزر الواحد «اعرضها بالرئيسية» / «شيلها من الرئيسية» + «انشر» إذا لسا مش على الموقع */
function HomeToggle({ state, noPhoto, busy, onToggle, onPublish }: { state: HomeState; noPhoto: boolean; busy: boolean; onToggle: () => void; onPublish: () => void }) {
  const on = state === 'shown' || state === 'willShow'
  const pending = state === 'willShow' || state === 'willHide'
  return (
    <div className="home-toggle">
      <button type="button" className={`home-toggle__btn ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={onToggle}>
        <House size={16} /> {on ? 'معروضة بالرئيسية — شيلها' : 'اعرضها بالرئيسية'}
      </button>
      {on && noPhoto && <p className="home-toggle__warn">⚠ لازم صورة عشان تطلع بالرئيسية — اضغط على الصورة فوق.</p>}
      {pending && (
        <p className="home-toggle__pending">
          {state === 'willShow' ? 'لسا مش على الموقع.' : 'لسا ظاهرة على الموقع.'}
          <button type="button" className="home-toggle__publish" onClick={onPublish} disabled={busy}>
            {busy ? <Loader2 size={13} className="spin" /> : <Rocket size={13} />} انشر هلأ
          </button>
        </p>
      )}
    </div>
  )
}

/** المجال: ظاهر بالموقع، أو ليش مخفي — نفس قاعدة الموقع (lib/group-visibility.ts) */
function SiteState({ state, lang }: { state: NonNullable<Card['siteState']>; lang?: 'ar' | 'he' }) {
  const t = groupStateText(lang)
  return (
    <p className={`site-state site-state--${state === 'visible' ? 'on' : 'off'}`} title={t.hint}>
      {state === 'visible' ? '✓ ' : '⚠ '}
      {t[state]}
      {state === 'draft' && <> — {t.draftHint}</>}
    </p>
  )
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === 'saving')
    return (
      <span className="save-badge">
        <Loader2 size={12} className="spin" /> عم نحفظ
      </span>
    )
  if (state === 'saved') return <span className="save-badge save-badge--ok">✓ انحفظ</span>
  if (state === 'error') return <span className="save-badge save-badge--err">ما انحفظ</span>
  return <span />
}

/** خانة كتابة بشكل نص البطاقة نفسه */
function InlineInput({ value, onChange, placeholder, className = '', multiline, dir }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string; multiline?: boolean; dir?: 'ltr' | 'rtl' }) {
  return multiline ? (
    <textarea className={`inline-edit ${className}`} value={value} placeholder={placeholder} aria-label={placeholder} rows={2} dir={dir} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <input className={`inline-edit ${className}`} value={value} placeholder={placeholder} aria-label={placeholder} dir={dir} onChange={(e) => onChange(e.target.value)} />
  )
}

/** الصورة: اضغط أو اسحب ملف فوقها لتبديلها */
function PhotoDrop({ src, alt, busy, onFile, className = '', round, contain }: { src?: string; alt: string; busy: boolean; onFile: (f: File) => void; className?: string; round?: boolean; contain?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  return (
    <>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className={className} style={contain ? { objectFit: 'contain' } : undefined} />
      ) : null}
      <button
        type="button"
        className={`photo-drop ${over ? 'is-over' : ''} ${busy ? 'is-busy' : ''} ${!src ? 'is-empty' : ''} ${round ? 'is-round' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            setOver(true)
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return
          e.preventDefault()
          e.stopPropagation()
          setOver(false)
          onFile(e.dataTransfer.files[0])
        }}
        aria-label="غيّر الصورة"
      >
        {busy ? <Loader2 size={24} className="spin" /> : <ImagePlus size={24} />}
        <span>{busy ? 'عم نرفع…' : src ? 'غيّر الصورة' : 'أضف صورة'}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onFile(file)
        }}
      />
    </>
  )
}

