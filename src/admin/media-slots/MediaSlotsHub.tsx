'use client'

import { toast, useDocumentDrawer, useListDrawer } from '@payloadcms/ui'
import { ExternalLink, Film, FolderOpen, Image as ImageIcon, Pencil, Play, Upload } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { withMedia, type SlotOwner } from '@/lib/media-slots'

import { ApiError, call } from '../cards/api'
import { publishOwner } from './actions'
import './media-slots.scss'
import type { HubData, MediaInfo, SlotView } from './types'

/**
 * «الفيديوهات والصور» — بطاقة لكل مكان بالموقع فيه فيديو أو صورة.
 * التبديل بينحفظ كمسودة (نفس REST تبع البطاقات، طلب ورا طلب لكل صفحة)، والموقع بيتغيّر بس مع «انشر».
 */
type Part = 'main' | 'poster'
type Filter = 'all' | 'video' | 'image' | 'empty' | 'changed'
type Json = Record<string, unknown>

const ownerUrl = (o: SlotOwner) => (o.type === 'global' ? `/api/globals/${o.slug}` : `/api/${o.slug}/${o.id}`)

/** آخر نسخة (مسودة) من الصفحة — بالعربي، بدون ما نفتح العلاقات */
const readOwner = (o: SlotOwner, versioned: boolean) =>
  call<Json>(`${ownerUrl(o)}?${new URLSearchParams({ locale: 'ar', depth: '0', ...(versioned ? { draft: 'true' } : {}) })}`, { method: 'GET' })

const writeOwner = (o: SlotOwner, data: Json, versioned: boolean) =>
  call<Json>(`${ownerUrl(o)}?${new URLSearchParams({ locale: 'ar', depth: '0', ...(versioned ? { draft: 'true' } : {}) })}`, {
    // Payload: globals بتتحدّث بـ POST، والعناصر بـ PATCH
    method: o.type === 'global' ? 'POST' : 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

const infoOf = (d: Json): MediaInfo => {
  const sizes = (d.sizes ?? {}) as Record<string, { url?: string | null } | undefined>
  const mime = String(d.mimeType ?? '')
  return {
    id: d.id as number,
    url: String(d.url ?? ''),
    thumb: sizes.card?.url || sizes.thumbnail?.url || (mime.startsWith('image/') ? String(d.url ?? '') : ''),
    filename: String(d.filename ?? ''),
    filesize: typeof d.filesize === 'number' ? d.filesize : null,
    mimeType: mime,
    alt: typeof d.alt === 'string' ? d.alt : '',
  }
}

const sizeText = (bytes: number | null) =>
  bytes === null ? '' : bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} ميغا` : `${Math.max(1, Math.round(bytes / 1024))} كيلو`

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

const previewHref = (sitePath: string) => `/next/preview?${new URLSearchParams({ path: sitePath })}`

const isEmpty = (s: SlotView) => s.mediaId === null

export function MediaSlotsHub({ data }: { data: HubData }) {
  const [slots, setSlots] = useState(data.slots)
  const [media, setMedia] = useState(data.media)
  const [owners, setOwners] = useState(data.owners)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [publishing, setPublishing] = useState(false)
  const [focus, setFocus] = useState<string | null>(data.focus)

  // ── choosing a file: one drawer to upload, and the library (videos / pictures) ──
  const target = useRef<{ slot: SlotView; part: Part } | null>(null)
  const [alt, setAlt] = useState('')
  const [UploadDrawer, , upload] = useDocumentDrawer({ collectionSlug: 'media' })
  const [VideoLibrary, , videoLibrary] = useListDrawer({ collectionSlugs: ['media'], filterOptions: { media: { mimeType: { contains: 'video' } } } })
  const [ImageLibrary, , imageLibrary] = useListDrawer({ collectionSlugs: ['media'], filterOptions: { media: { mimeType: { contains: 'image' } } } })
  const [AnyLibrary, , anyLibrary] = useListDrawer({ collectionSlugs: ['media'] })

  /** طلبات الحفظ لكل صفحة واحد ورا الثاني (ما في طلبين يخربطوا على بعض) */
  const queues = useRef<Record<string, Promise<unknown>>>({})
  const enqueue = useCallback(<T,>(key: string, job: () => Promise<T>): Promise<T> => {
    const next = (queues.current[key] ?? Promise.resolve()).catch(() => undefined).then(job)
    queues.current[key] = next
    return next
  }, [])

  const neededKind = (slot: SlotView, part: Part) => (part === 'poster' ? 'image' : slot.kind)

  const assign = useCallback(
    async (slot: SlotView, part: Part, doc: Json) => {
      const info = infoOf(doc)
      const need = neededKind(slot, part)
      if (need === 'video' && !info.mimeType.startsWith('video/'))
        return void toast.error('هاد الملف مش فيديو. اختار فيديو (MP4) — الملف انحفظ بالمكتبة بس ما انحط هون.', { duration: 10000 })
      if (need === 'image' && !info.mimeType.startsWith('image/'))
        return void toast.error('هاد الملف مش صورة. اختار صورة (JPG / PNG / WEBP) — الملف انحفظ بالمكتبة بس ما انحط هون.', { duration: 10000 })
      const owner = owners[slot.ownerKey]
      const versioned = Boolean(owner?.versioned)
      const path = part === 'poster' && slot.poster ? slot.poster.path : slot.path
      setBusy((b) => ({ ...b, [slot.key]: true }))
      try {
        await enqueue(slot.ownerKey, async () => {
          const fresh = await readOwner(slot.owner, versioned)
          const change = withMedia(fresh, path, info.id, part === 'main' ? slot.many?.index : undefined)
          if (!change)
            throw new ApiError('هاد المكان تغيّر من صفحة ثانية (مثلاً انمسح الريل أو تبدّل ترتيب). حدّث الصفحة (F5) وجرّب كمان مرة.')
          await writeOwner(slot.owner, { [change.field]: change.value }, versioned)
        })
        setMedia((m) => ({ ...m, [String(info.id)]: info }))
        setSlots((all) =>
          all.map((s) =>
            s.key !== slot.key
              ? s
              : part === 'poster' && s.poster
                ? { ...s, poster: { ...s.poster, mediaId: info.id }, changed: versioned }
                : { ...s, mediaId: info.id, changed: versioned },
          ),
        )
        if (versioned) {
          setOwners((o) => ({ ...o, [slot.ownerKey]: { ...o[slot.ownerKey], pending: true } }))
          toast.success('انحفظ كمسودة ✓ — الموقع ما تغيّر لسا. لما تكون جاهز اضغط «انشر».', { duration: 8000 })
        } else toast.success('تبدّل ✓ — هاد القسم ما فيه مسودات، فتغيّر على الموقع فوراً.', { duration: 8000 })
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : 'ما انحفظ التبديل — تأكد من الإنترنت وجرّب كمان مرة.', { duration: 15000 })
      } finally {
        setBusy((b) => ({ ...b, [slot.key]: false }))
      }
    },
    [enqueue, owners],
  )

  const openUpload = (slot: SlotView, part: Part) => {
    target.current = { slot, part }
    // وصف الملف إجباري بالمكتبة — منعبّيه باسم المكان، وبتقدر تغيّره
    const words = part === 'poster' ? `صورة غلاف: ${slot.trail.slice(1).join(' — ') || slot.trail[0]}` : slot.trail.slice(1).join(' — ') || slot.trail[0]
    setAlt(words)
    upload.openDrawer()
  }
  const openLibrary = (slot: SlotView, part: Part) => {
    target.current = { slot, part }
    const need = neededKind(slot, part)
    ;(need === 'video' ? videoLibrary : need === 'image' ? imageLibrary : anyLibrary).openDrawer()
  }
  /** A file was uploaded / chosen in a drawer → put it in the place that asked for it */
  const picked = useCallback(
    (close: () => void, doc: Json | undefined) => {
      close()
      const t = target.current
      target.current = null
      if (t && doc) void assign(t.slot, t.part, doc)
    },
    [assign],
  )

  // ── publishing ──
  const pendingOwners = Object.values(owners).filter((o) => o.pending && slots.some((s) => s.ownerKey === o.ownerKey))
  const ownerOf = (key: string) => slots.find((s) => s.ownerKey === key)?.owner

  const publish = async (keys: string[]) => {
    setPublishing(true)
    let done = 0
    for (const key of keys) {
      const owner = ownerOf(key)
      if (!owner) continue
      await (queues.current[key] ?? Promise.resolve()).catch(() => undefined)
      const r = await publishOwner(owner)
      if (r.ok) {
        done++
        setOwners((o) => ({ ...o, [key]: { ...o[key], pending: false } }))
        setSlots((all) => all.map((s) => (s.ownerKey === key ? { ...s, changed: false } : s)))
      } else toast.error(`${owners[key]?.label ?? ''}: ${r.message}`, { duration: 20000 })
    }
    setPublishing(false)
    if (done) toast.success(done === 1 ? 'انتشر على الموقع ✓' : `انتشروا على الموقع ✓ (${done})`)
  }

  // ── «مستعمل في» → this card ──
  useEffect(() => {
    if (!focus) return
    const el = document.querySelector(`[data-slot-key="${CSS.escape(focus)}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setFocus(null), 4000)
    return () => clearTimeout(t)
  }, [focus])

  const visible = useMemo(() => {
    const q = query.trim()
    return slots.filter((s) => {
      if (s.optional && isEmpty(s)) return false
      if (filter === 'video' && s.kind !== 'video') return false
      if (filter === 'image' && s.kind === 'video') return false
      if (filter === 'empty' && !isEmpty(s)) return false
      if (filter === 'changed' && !s.changed) return false
      if (q) {
        const m = s.mediaId !== null ? media[String(s.mediaId)] : undefined
        if (!`${s.label} ${m?.filename ?? ''} ${m?.alt ?? ''}`.includes(q)) return false
      }
      return true
    })
  }, [slots, media, filter, query])

  const sections: { title: string; icon: React.ReactNode; list: SlotView[] }[] = [
    { title: 'الفيديوهات', icon: <Film size={22} aria-hidden="true" />, list: visible.filter((s) => s.kind === 'video') },
    { title: 'الصور', icon: <ImageIcon size={22} aria-hidden="true" />, list: visible.filter((s) => s.kind !== 'video') },
  ]
  const count = (f: Filter) =>
    slots.filter((s) => !(s.optional && isEmpty(s))).filter((s) =>
      f === 'all' ? true : f === 'video' ? s.kind === 'video' : f === 'image' ? s.kind !== 'video' : f === 'empty' ? isEmpty(s) : s.changed,
    ).length

  return (
    <main className="mslots gutter--left gutter--right" dir="rtl">
      <header className="mslots__head">
        <div>
          <h1>الفيديوهات والصور</h1>
          <p>
            كل مكان بالموقع فيه فيديو أو صورة — مكتوب فوق كل بطاقة وين بيظهر. اضغط <b>«بدّل»</b> وارفع ملف جديد أو اختار من المكتبة.
            التبديل بينحفظ <b>كمسودة</b>: الموقع ما بيتغيّر إلا لما تضغط <b>«انشر»</b>. «شوف مكانه على الموقع» بيفتح الصفحة على نفس القسم (مع المسودة).
          </p>
        </div>
      </header>

      <div className={`mslots__bar${pendingOwners.length ? ' is-pending' : ''}`} role="status">
        {pendingOwners.length ? (
          <>
            <span>
              <b>في تعديلات لسا ما انتشرت:</b> {pendingOwners.map((o) => o.label).join(' · ')}
            </span>
            <button type="button" className="mslots__btn mslots__btn--publish" disabled={publishing} onClick={() => void publish(pendingOwners.map((o) => o.ownerKey))}>
              {publishing ? 'عم ننشر…' : 'انشر التغييرات'}
            </button>
          </>
        ) : (
          <span>✓ كل اللي هون منشور — الموقع محدّث.</span>
        )}
      </div>

      <div className="mslots__tools">
        <div className="mslots__chips" role="group" aria-label="عرض">
          {(
            [
              ['all', 'الكل'],
              ['video', 'فيديوهات'],
              ['image', 'صور'],
              ['empty', 'أماكن فاضية'],
              ['changed', 'لسا مش منشور'],
            ] as [Filter, string][]
          ).map(([f, label]) => (
            <button key={f} type="button" aria-pressed={filter === f} className="mslots__chip" onClick={() => setFilter(f)}>
              {label} <small>{count(f)}</small>
            </button>
          ))}
        </div>
        <input className="mslots__search" type="search" placeholder="دوّر: ريل، اللحام، اسم ملف…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {sections.map((sec) =>
        sec.list.length ? (
          <section key={sec.title} className="mslots__section">
            <h2>
              {sec.icon} {sec.title} <small>{sec.list.length}</small>
            </h2>
            {groupBy(sec.list).map(([group, list]) => (
              <div key={group} className="mslots__group">
                <h3>{group}</h3>
                <div className="mslots__grid">
                  {list.map((s) => (
                    <SlotCard
                      key={s.key}
                      slot={s}
                      media={s.mediaId !== null ? media[String(s.mediaId)] : undefined}
                      poster={s.poster?.mediaId != null ? media[String(s.poster.mediaId)] : undefined}
                      versioned={Boolean(owners[s.ownerKey]?.versioned)}
                      ownerPending={Boolean(owners[s.ownerKey]?.pending)}
                      editHref={owners[s.ownerKey]?.editHref}
                      busy={Boolean(busy[s.key])}
                      publishing={publishing}
                      focused={focus === s.key}
                      onUpload={(part) => openUpload(s, part)}
                      onLibrary={(part) => openLibrary(s, part)}
                      onPublish={() => void publish([s.ownerKey])}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null,
      )}
      {!visible.length && <p className="mslots__none">ما في إشي بهاد العرض.</p>}

      <UploadDrawer initialData={{ alt }} onSave={({ doc }) => picked(upload.closeDrawer, doc as Json)} redirectAfterCreate={false} />
      <VideoLibrary onSelect={({ doc }) => picked(videoLibrary.closeDrawer, doc as Json)} allowCreate={false} />
      <ImageLibrary onSelect={({ doc }) => picked(imageLibrary.closeDrawer, doc as Json)} allowCreate={false} />
      <AnyLibrary onSelect={({ doc }) => picked(anyLibrary.closeDrawer, doc as Json)} allowCreate={false} />
    </main>
  )
}

function groupBy(list: SlotView[]): [string, SlotView[]][] {
  const out = new Map<string, SlotView[]>()
  for (const s of list) out.set(s.group, [...(out.get(s.group) ?? []), s])
  return [...out]
}

function SlotCard({
  slot,
  media,
  poster,
  versioned,
  ownerPending,
  editHref,
  busy,
  publishing,
  focused,
  onUpload,
  onLibrary,
  onPublish,
}: {
  slot: SlotView
  media?: MediaInfo
  poster?: MediaInfo
  versioned: boolean
  ownerPending: boolean
  editHref?: string
  busy: boolean
  publishing: boolean
  focused: boolean
  onUpload: (part: Part) => void
  onLibrary: (part: Part) => void
  onPublish: () => void
}) {
  const [choosing, setChoosing] = useState<Part | null>(null)
  const [duration, setDuration] = useState<string | undefined>(slot.duration)
  const video = slot.kind === 'video' || media?.mimeType.startsWith('video/')
  const noun = slot.kind === 'video' ? 'الفيديو' : slot.kind === 'image' ? 'الصورة' : 'الملف'
  const last = slot.trail.length - 1

  const chooser = (part: Part) =>
    choosing === part ? (
      <div className="mslots__choose">
        <button type="button" className="mslots__btn mslots__btn--primary" onClick={() => (setChoosing(null), onUpload(part))}>
          <Upload size={16} aria-hidden="true" /> ارفع ملف جديد
        </button>
        <button type="button" className="mslots__btn" onClick={() => (setChoosing(null), onLibrary(part))}>
          <FolderOpen size={16} aria-hidden="true" /> اختار من المكتبة
        </button>
        <button type="button" className="mslots__link" onClick={() => setChoosing(null)}>
          إلغاء
        </button>
      </div>
    ) : null

  return (
    <article className={`mslots__card${focused ? ' is-focused' : ''}${busy ? ' is-busy' : ''}`} data-slot-key={slot.key} id={`slot-${slot.key}`}>
      <p className="mslots__where" title={slot.label}>
        {slot.trail.map((t, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span aria-hidden="true"> ← </span>}
            {i === last ? <b>{t}</b> : <span>{t}</span>}
          </React.Fragment>
        ))}
      </p>
      <div className="mslots__badges">
        {slot.changed && <span className="mslots__badge mslots__badge--draft">مسودة — لسا مش على الموقع</span>}
        {slot.hiddenOnSite && <span className="mslots__badge mslots__badge--muted">القسم مخفي بالموقع</span>}
        {!versioned && <span className="mslots__badge mslots__badge--muted">التبديل هون بيبين فوراً (بدون مسودة)</span>}
      </div>

      <div className={`mslots__preview${video ? ' is-video' : ''}`}>
        {busy && <div className="mslots__spinner">عم نحفظ…</div>}
        {media ? (
          video ? (
            <VideoPreview media={media} poster={poster} onDuration={(d) => setDuration((x) => x ?? d)} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.thumb || media.url} alt={media.alt} loading="lazy" />
          )
        ) : (
          <button type="button" className="mslots__empty" onClick={() => setChoosing('main')}>
            <span>{slot.kind === 'video' ? 'ما في فيديو هون — ارفع واحد' : 'ما في صورة هون — ارفع وحدة'}</span>
            {slot.youtube && <small>هلأ بيعرض فيديو من يوتيوب مكانه</small>}
          </button>
        )}
      </div>

      {media && (
        <p className="mslots__meta">
          <span dir="ltr" className="mslots__file">
            {media.filename}
          </span>
          {[sizeText(media.filesize), duration && `المدة ${duration}`].filter(Boolean).map((x) => (
            <span key={x as string}>{x}</span>
          ))}
        </p>
      )}

      <div className="mslots__actions">
        <button type="button" className="mslots__btn mslots__btn--primary" disabled={busy} onClick={() => setChoosing(choosing === 'main' ? null : 'main')}>
          {media ? `بدّل ${noun}` : slot.kind === 'video' ? 'حطّ فيديو' : 'حطّ صورة'}
        </button>
        <a className="mslots__btn" href={previewHref(slot.sitePath)} target="_blank" rel="noopener" title={slot.hiddenOnSite ? 'القسم مخفي — ما رح تشوفه بالموقع' : 'بيفتح بصفحة جديدة، مع المسودة'}>
          <ExternalLink size={16} aria-hidden="true" /> شوف مكانه على الموقع
        </a>
        {versioned && ownerPending && (
          <button type="button" className="mslots__btn mslots__btn--publish" disabled={publishing || busy} onClick={onPublish}>
            انشر
          </button>
        )}
      </div>
      {chooser('main')}

      {slot.poster && (
        <div className="mslots__poster">
          <span className="mslots__poster-img">
            {poster?.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster.thumb} alt="" loading="lazy" />
            ) : (
              <ImageIcon size={18} aria-hidden="true" />
            )}
          </span>
          <span className="mslots__poster-text">
            <b>صورة الغلاف</b>
            <small>{poster ? 'بتبين قبل ما يشتغل الفيديو' : 'ما في — الموقع بيعرض أول لقطة'}</small>
          </span>
          <button type="button" className="mslots__btn mslots__btn--small" disabled={busy} onClick={() => setChoosing(choosing === 'poster' ? null : 'poster')}>
            {poster ? 'بدّل صورة الغلاف' : 'حطّ صورة غلاف'}
          </button>
        </div>
      )}
      {chooser('poster')}

      {editHref && (
        <a className="mslots__edit" href={editHref}>
          <Pencil size={13} aria-hidden="true" /> افتح صفحة التعديل الكاملة
        </a>
      )}
    </article>
  )
}

function VideoPreview({ media, poster, onDuration }: { media: MediaInfo; poster?: MediaInfo; onDuration: (d: string) => void }) {
  const [playing, setPlaying] = useState(false)
  const meta = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const d = e.currentTarget.duration
    if (Number.isFinite(d) && d > 0) onDuration(clock(d))
  }
  if (playing)
    return <video src={media.url} poster={poster?.thumb || undefined} controls autoPlay playsInline onLoadedMetadata={meta} />
  return (
    <button type="button" className="mslots__play" onClick={() => setPlaying(true)} aria-label="شغّل الفيديو">
      {poster?.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster.thumb} alt="" loading="lazy" />
      ) : (
        // no cover picture: the first frame
        <video src={`${media.url}#t=0.5`} preload="metadata" muted playsInline onLoadedMetadata={meta} />
      )}
      <span className="mslots__play-icon">
        <Play size={26} aria-hidden="true" />
      </span>
    </button>
  )
}
