/**
 * «الفيديوهات والصور» — every place on the website that shows a video or a picture, in plain Arabic:
 * «الصفحة الرئيسية ← فيديو الكلية ← ريل ٢: تركيب مكيفات (الدورة: فني تكييف)».
 *
 * One derivation for everything that asks «where is this file?»:
 *   - the admin page /admin/media-slots (src/admin/media-slots) — one card per place,
 *   - «مستعمل في:» in the media library,
 *   - the «هاي الصورة مستعملة بـ …، متأكد؟» question before a delete (src/hooks/mediaInUse.ts).
 *
 * Nothing here is a hard-coded list of places: it walks the Payload field config of each page /
 * collection together with the saved data, so a new reel, course or section shows up by itself.
 * The only hand-written part is OWNERS below (the name of each page and where it lives on the site).
 * Pure (no database) — the loading is in src/lib/media-slots-server.ts.
 */
import type { Block, Field } from 'payload'

export type MediaKind = 'video' | 'image' | 'any'
/** A step into the saved data. Array / block rows are found again by their id (the order may change). */
export type PathSeg = string | { id: string | null; index: number }
export type SlotOwner = { type: 'global'; slug: string } | { type: 'collection'; slug: string; id: number | string }
type Id = number | string

export type Slot = {
  /** Stable key (row ids, not positions): «homepage:sections#65f…/reels#66a…/video» */
  key: string
  owner: SlotOwner
  ownerKey: string
  /** Heading on the admin page, e.g. «الصفحة الرئيسية», «الدورات» */
  group: string
  /** «الصفحة الرئيسية», «فيديو الكلية», «ريل ٢: …» */
  trail: string[]
  label: string
  kind: MediaKind
  path: PathSeg[]
  mediaId: Id | null
  /** An item of a list of pictures (course photos, gallery) */
  many?: { index: number; total: number }
  /** A video's cover picture, when the same place has one */
  poster?: { path: PathSeg[]; mediaId: Id | null; label: string; key: string }
  /** «0:20» when the editor wrote it next to the video */
  duration?: string
  /** A YouTube link used instead of a file */
  youtube?: string
  /** Path on the public site (without /next/preview), e.g. «/ar#video» */
  sitePath: string
  /** The homepage section is switched off («إخفاء هذا القسم مؤقتاً») */
  hiddenOnSite?: boolean
  /** Rarely used places (search-engine pictures…): the admin page shows them only when filled */
  optional?: boolean
  /** A picture inside a long text (news, story) — listed for «مستعمل في», not replaceable from the hub */
  inline?: boolean
}

type Json = Record<string, unknown>
type Label = unknown
export type Lang = 'ar' | 'he'

/** How a page / collection is named and where it is on the site. Anything not listed gets defaults. */
type OwnerSpec = {
  group?: Record<Lang, string>
  /** First step of the trail for one document */
  root: (doc: Json, lang: Lang, title: string) => string
  /** Where on the public site (locale added by the caller) */
  site: (ctx: SiteCtx) => string
  order: number
  /** Container groups whose empty places are hidden on the admin page */
  optionalGroups?: string[]
}
type SiteCtx = {
  doc: Json
  /** Anchor of the homepage section this place is in (homepage only) */
  anchor?: string
  /** First data key of the place, e.g. «video», «coverImage» */
  top: string
  /** Homepage section anchors by type («videos» → «video») */
  anchors: Record<string, string>
}

const slugOf = (doc: Json) => (typeof doc.slug === 'string' ? encodeURIComponent(doc.slug) : '')
const hash = (a?: string) => (a ? `#${a}` : '')

export const OWNERS: Record<string, OwnerSpec> = {
  homepage: {
    group: { ar: 'الصفحة الرئيسية', he: 'דף הבית' },
    root: (_d, lang) => (lang === 'he' ? 'דף הבית' : 'الصفحة الرئيسية'),
    // «top» = the video at the very top: the page itself, no scrolling
    site: ({ anchor }) => (anchor && anchor !== 'top' ? hash(anchor) : ''),
    order: 0,
  },
  gallery: {
    group: { ar: 'معرض الصور والفيديو', he: 'גלריה' },
    root: (_d, lang) => (lang === 'he' ? 'גלריית תמונות ווידאו' : 'معرض الصور والفيديو'),
    site: ({ anchors }) => hash(anchors.gallery ?? 'gallery'),
    order: 1,
  },
  courses: {
    group: { ar: 'الدورات', he: 'קורסים' },
    root: (_d, lang, title) => `${lang === 'he' ? 'דף קורס' : 'صفحة دورة'}: ${title}`,
    // the video and extra photos are in the «صور من الدورة» box (id in src/components/site/pages.tsx)
    site: ({ doc, top }) => `/course/${slugOf(doc)}${['video', 'videoPoster', 'gallery'].includes(top) ? '#course-media' : ''}`,
    order: 2,
    optionalGroups: ['seo'],
  },
  'success-stories': {
    group: { ar: 'قصص النجاح', he: 'סיפורי הצלחה' },
    root: (_d, lang, title) => `${lang === 'he' ? 'סיפור הצלחה' : 'قصة نجاح'}: ${title}`,
    site: ({ anchors }) => hash(anchors.successStories ?? 'graduates'),
    order: 3,
  },
  'course-groups': {
    group: { ar: 'مجالات الدورات', he: 'תחומים' },
    root: (_d, lang, title) => `${lang === 'he' ? 'דף תחום' : 'صفحة مجال'}: ${title}`,
    site: ({ doc }) => `/courses/${slugOf(doc)}`,
    order: 4,
    optionalGroups: ['seo'],
  },
  staff: {
    group: { ar: 'الطاقم', he: 'צוות' },
    root: (_d, lang, title) => `${lang === 'he' ? 'צוות המכללה' : 'طاقم الكلية'}: ${title}`,
    site: ({ anchors }) => hash(anchors.staff ?? 'staff'),
    order: 5,
  },
  partners: {
    group: { ar: 'الشركاء', he: 'שותפים' },
    root: (_d, lang, title) => `${lang === 'he' ? 'שותף' : 'شريك'}: ${title}`,
    site: ({ anchors }) => hash(anchors.partners ?? 'partners'),
    order: 6,
  },
  news: {
    group: { ar: 'الأخبار', he: 'חדשות' },
    root: (_d, lang, title) => `${lang === 'he' ? 'ידיעה' : 'خبر'}: ${title}`,
    site: ({ doc }) => `/news/${slugOf(doc)}`,
    order: 7,
    optionalGroups: ['seo'],
  },
  'site-settings': {
    group: { ar: 'معلومات الكلية (اللوغو)', he: 'פרטי המכללה (לוגו)' },
    root: (_d, lang) => (lang === 'he' ? 'פרטי המכללה' : 'معلومات الكلية'),
    site: () => '',
    order: 8,
    optionalGroups: ['seo', 'logoMark', 'favicon', 'ogImage'],
  },
}

// ── labels ──────────────────────────────────────────────────────────────────────────────────────

export const textOf = (label: Label, lang: Lang = 'ar'): string => {
  if (typeof label === 'string') return label
  if (label && typeof label === 'object' && !Array.isArray(label)) {
    const o = label as Record<string, unknown>
    const v = o[lang] ?? o.ar ?? Object.values(o)[0]
    return typeof v === 'string' ? v : ''
  }
  return ''
}

/** «صورة الغلاف (طولية 9:16)» → «صورة الغلاف», «فيديو (اختياري)» → «فيديو», «أو ملف فيديو» → «ملف فيديو» */
export const plainLabel = (s: string) =>
  s
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/^(أو|או)\s+/, '')
    .trim()

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
export const numberText = (n: number, lang: Lang = 'ar') =>
  lang === 'ar' ? String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : String(n)

/** A localized value comes as { ar, he } when read with locale «all» */
const isLocaleMap = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === 'object' && !Array.isArray(v) && ('ar' in (v as Json) || 'he' in (v as Json)) && !('id' in (v as Json))

const pick = (v: unknown, lang: Lang): unknown => (isLocaleMap(v) ? (v[lang] ?? v.ar ?? v.he) : v)
const str = (v: unknown, lang: Lang) => {
  const x = pick(v, lang)
  return typeof x === 'string' ? x.trim() : typeof x === 'number' ? String(x) : ''
}

// ── field helpers ───────────────────────────────────────────────────────────────────────────────

const pointsToMedia = (f: Field) =>
  (f.type === 'upload' || f.type === 'relationship') &&
  (f.relationTo === 'media' || (Array.isArray(f.relationTo) && f.relationTo.includes('media')))

const kindOf = (f: Field): MediaKind => {
  const opts = 'filterOptions' in f ? (f.filterOptions as { mimeType?: { contains?: string } } | undefined) : undefined
  const c = opts && typeof opts === 'object' ? opts.mimeType?.contains : undefined
  return c === 'video' ? 'video' : c === 'image' ? 'image' : 'any'
}

/** Media ids in an upload / relationship value (number, populated doc, polymorphic {relationTo,value}) */
export function mediaRefs(v: unknown, out: Id[] = []): Id[] {
  if (v === null || v === undefined || v === '') return out
  if (typeof v === 'number' || typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => mediaRefs(x, out))
  else if (typeof v === 'object') {
    const o = v as Json
    if ('relationTo' in o) {
      if (o.relationTo === 'media') mediaRefs(o.value, out)
    } else if ('id' in o) out.push(o.id as Id)
  }
  return out
}

/** Upload nodes in a rich-text (Lexical) value */
function richTextRefs(node: unknown, out: Id[] = []): Id[] {
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    node.forEach((n) => richTextRefs(n, out))
    return out
  }
  const o = node as Json
  if (o.type === 'upload' && o.relationTo === 'media') mediaRefs(o.value, out)
  for (const v of Object.values(o)) if (v && typeof v === 'object') richTextRefs(v, out)
  return out
}

/** Fields at the same data level (rows, collapsibles and unnamed tabs don't add a level) */
function sameLevel(fields: Field[]): Field[] {
  const out: Field[] = []
  for (const f of fields) {
    if (f.type === 'row' || f.type === 'collapsible') out.push(...sameLevel(f.fields))
    else if (f.type === 'tabs') {
      for (const tab of f.tabs) {
        if ('name' in tab && tab.name) out.push({ type: 'group', name: tab.name, label: tab.label, fields: tab.fields } as Field)
        else out.push(...sameLevel(tab.fields))
      }
    } else out.push(f)
  }
  return out
}

const POSTER_NAMES = ['poster', 'videoPoster', 'thumbnail']
const DURATION_NAMES = ['durationLabel', 'videoDuration']
const TITLE_NAMES = ['title', 'name', 'graduateName', 'label', 'question']

const segKey = (p: PathSeg) => (typeof p === 'string' ? p : `#${p.id ?? p.index}`)
export const pathKey = (path: PathSeg[]) =>
  path.map(segKey).join('/').replace(/\/#/g, '#')

// ── the walk ────────────────────────────────────────────────────────────────────────────────────

export type TitleLookup = (collection: string, id: Id) => string | undefined

export type WalkInput = {
  owner: SlotOwner
  fields: Field[]
  doc: Json
  lang?: Lang
  /** Names of related documents («الدورة: فني تكييف») */
  titles?: TitleLookup
  /** Blocks referenced by slug (config.blocks) */
  blocks?: Block[]
  /** Homepage section anchors by block type */
  anchors?: Record<string, string>
  /** Collection / global labels, for owners not in OWNERS */
  ownerLabel?: { singular?: string; plural?: string; useAsTitle?: string }
}

type Where = {
  trail: string[]
  path: PathSeg[]
  container: 'root' | 'group' | 'row' | 'block'
  anchor?: string
  hidden?: boolean
  optional?: boolean
}

export const ownerKeyOf = (o: SlotOwner) => (o.type === 'global' ? o.slug : `${o.slug}/${o.id}`)

/** Every video / picture place of one document (a page or a collection item), in page order. */
export function slotsOf(input: WalkInput): Slot[] {
  const lang = input.lang ?? 'ar'
  const { owner, doc } = input
  const spec = OWNERS[owner.slug]
  const ownerKey = ownerKeyOf(owner)
  const titleField = input.ownerLabel?.useAsTitle
  const title =
    (titleField && str(doc[titleField], lang)) || TITLE_NAMES.map((n) => str(doc[n], lang)).find(Boolean) || String(doc.id ?? '')
  const root = spec
    ? spec.root(doc, lang, title)
    : owner.type === 'global'
      ? input.ownerLabel?.singular || owner.slug
      : `${input.ownerLabel?.singular || owner.slug}: ${title}`
  const group = spec?.group?.[lang] ?? input.ownerLabel?.plural ?? root
  const anchors = input.anchors ?? {}
  const out: Slot[] = []

  const site = (w: Where, leaf: string) => {
    const top = typeof w.path[0] === 'string' ? w.path[0] : leaf
    const rest = spec ? spec.site({ doc, anchor: w.anchor, top, anchors }) : ''
    return `/${lang}${rest}`
  }

  const relSuffix = (fields: Field[], row: Json) => {
    const parts: string[] = []
    for (const f of sameLevel(fields)) {
      if (f.type !== 'relationship' || pointsToMedia(f) || f.hasMany || typeof f.relationTo !== 'string') continue
      const id = mediaRefs(row[f.name])[0]
      const name = id !== undefined ? input.titles?.(f.relationTo, id) : undefined
      if (name) parts.push(`${plainLabel(textOf(f.label, lang))}: ${name}`)
    }
    return parts.length ? ` (${parts.join('، ')})` : ''
  }

  const walk = (fields: Field[], data: unknown, w: Where) => {
    if (!data || typeof data !== 'object') return
    const row = data as Json
    const level = sameLevel(fields)
    // a video and its cover picture side by side = one place
    const video = level.find((f) => pointsToMedia(f) && kindOf(f) === 'video' && !('hasMany' in f && f.hasMany))
    const poster = video
      ? level.find((f) => pointsToMedia(f) && kindOf(f) === 'image' && 'name' in f && POSTER_NAMES.includes(f.name))
      : undefined
    const sibling = (names: string[]) => {
      for (const n of names) {
        const v = str(row[n], lang)
        if (v) return v
      }
      return undefined
    }

    for (const f of level) {
      if (!('name' in f) || !f.name || f === poster) continue
      const raw = row[f.name]
      const label = plainLabel(textOf('label' in f ? f.label : undefined, lang))
      const optional = w.optional || Boolean(spec?.optionalGroups?.includes(f.name))

      if (pointsToMedia(f)) {
        const kind = kindOf(f)
        const path = [...w.path, f.name]
        // videos inside a named box / row are named by it («الفيديو التعريفي الكبير», «ريل ٢»)
        const trail = kind === 'video' && (w.container === 'group' || w.container === 'row') ? w.trail : [...w.trail, label]
        const base = {
          owner,
          ownerKey,
          group,
          kind,
          sitePath: site(w, f.name),
          hiddenOnSite: w.hidden || undefined,
          optional: optional || undefined,
        }
        if ('hasMany' in f && f.hasMany) {
          const ids = mediaRefs(pick(raw, lang))
          ids.forEach((id, index) => {
            const t = [...trail, `${lang === 'he' ? 'פריט' : kind === 'video' ? 'فيديو' : 'صورة'} ${numberText(index + 1, lang)}`]
            out.push({
              ...base,
              key: `${ownerKey}:${pathKey(path)}[${index}]`,
              trail: t,
              label: t.join(' ← '),
              path,
              mediaId: id,
              many: { index, total: ids.length },
            })
          })
          continue
        }
        const posterPath = poster && 'name' in poster ? [...w.path, poster.name] : undefined
        const posterLabel = poster ? plainLabel(textOf('label' in poster ? poster.label : undefined, lang)) : ''
        out.push({
          ...base,
          key: `${ownerKey}:${pathKey(path)}`,
          trail,
          label: trail.join(' ← '),
          path,
          mediaId: mediaRefs(pick(raw, lang))[0] ?? null,
          ...(f === video && posterPath
            ? {
                poster: {
                  path: posterPath,
                  mediaId: mediaRefs(pick(row[(poster as { name: string }).name], lang))[0] ?? null,
                  label: [...trail, posterLabel].join(' ← '),
                  key: `${ownerKey}:${pathKey(posterPath)}`,
                },
              }
            : {}),
          ...(f === video ? { duration: sibling(DURATION_NAMES), youtube: sibling(['youtubeUrl']) } : {}),
        })
        continue
      }

      if (f.type === 'richText') {
        const locales = isLocaleMap(raw) ? Object.values(raw) : [raw]
        const ids = [...new Set(locales.flatMap((v) => richTextRefs(v)))]
        ids.forEach((id, index) => {
          const t = [...w.trail, label]
          out.push({
            key: `${ownerKey}:${pathKey([...w.path, f.name])}~${index}`,
            owner,
            ownerKey,
            group,
            trail: t,
            label: t.join(' ← '),
            kind: 'any',
            path: [...w.path, f.name],
            mediaId: id,
            sitePath: site(w, f.name),
            inline: true,
          })
        })
        continue
      }

      const value = 'localized' in f && f.localized ? pick(raw, lang) : raw
      if (f.type === 'group') {
        // an empty box still has its places («ما في فيديو هون»)
        walk(f.fields, value && typeof value === 'object' ? value : {}, { ...w, trail: label ? [...w.trail, label] : w.trail, path: [...w.path, f.name], container: 'group', optional })
      } else if (f.type === 'array' && Array.isArray(value)) {
        const singular = plainLabel(textOf(f.labels?.singular, lang)) || (lang === 'he' ? 'פריט' : 'عنصر')
        value.forEach((item: Json, index) => {
          if (!item || typeof item !== 'object') return
          const name = TITLE_NAMES.map((n) => str(item[n], lang)).find(Boolean)
          const rowLabel = `${singular} ${numberText(index + 1, lang)}${name ? `: ${name}` : ''}${relSuffix(f.fields, item)}`
          walk(f.fields, item, {
            ...w,
            trail: [...w.trail, rowLabel],
            path: [...w.path, f.name, { id: typeof item.id === 'string' || typeof item.id === 'number' ? String(item.id) : null, index }],
            container: 'row',
            optional,
          })
        })
      } else if (f.type === 'blocks' && Array.isArray(value)) {
        value.forEach((item: Json, index) => {
          const slug = item?.blockType
          const block =
            f.blocks?.find((b) => b.slug === slug) ??
            ((f.blockReferences as unknown[] | undefined)?.some((r) => (typeof r === 'string' ? r : (r as Block).slug) === slug)
              ? input.blocks?.find((b) => b.slug === slug)
              : undefined)
          if (!block) return
          const anchorField = sameLevel(block.fields).find((x) => 'name' in x && x.name === 'anchor')
          const anchor =
            str(item.anchor, lang) || (anchorField && 'defaultValue' in anchorField ? String(anchorField.defaultValue ?? '') : '')
          walk(block.fields, item, {
            trail: [...w.trail, textOf(block.labels?.singular, lang) || String(slug)],
            path: [...w.path, f.name, { id: typeof item.id === 'string' || typeof item.id === 'number' ? String(item.id) : null, index }],
            container: 'block',
            anchor: anchor || undefined,
            hidden: Boolean(item.hidden) || w.hidden,
            optional,
          })
        })
      }
    }
  }

  walk(input.fields, doc, { trail: [root], path: [], container: 'root' })
  return out
}

/** Homepage section anchors by block type, as the website uses them (src/components/site/sections.tsx) */
export function homepageAnchors(fields: Field[], homepage: Json | null | undefined, blocks?: Block[]): Record<string, string> {
  const anchors: Record<string, string> = {}
  const sections = homepage?.sections
  const field = fields.find((f) => 'name' in f && f.name === 'sections')
  if (!Array.isArray(sections) || !field || field.type !== 'blocks') return anchors
  for (const item of sections as Json[]) {
    const slug = String(item?.blockType ?? '')
    if (!slug || anchors[slug]) continue
    const block = field.blocks?.find((b) => b.slug === slug) ?? blocks?.find((b) => b.slug === slug)
    const anchorField = block ? sameLevel(block.fields).find((x) => 'name' in x && x.name === 'anchor') : undefined
    const value = (typeof item.anchor === 'string' && item.anchor) || (anchorField && 'defaultValue' in anchorField ? String(anchorField.defaultValue ?? '') : '')
    if (value) anchors[slug] = value
  }
  return anchors
}

/** Slots ordered for the admin page: by page (OWNERS order), then page order */
export const ownerOrder = (slug: string) => OWNERS[slug]?.order ?? 50

/**
 * For each media id: the places that show it (a video's cover picture included), each once.
 * Used by «مستعمل في:» and the delete question.
 */
export function usageFromSlots(slots: Slot[]): Map<string, { label: string; key: string; ownerKey: string }[]> {
  const usage = new Map<string, { label: string; key: string; ownerKey: string }[]>()
  const add = (id: Id | null | undefined, label: string, key: string, ownerKey: string) => {
    if (id === null || id === undefined) return
    const list = usage.get(String(id)) ?? []
    if (!list.some((p) => p.label === label)) list.push({ label, key, ownerKey })
    usage.set(String(id), list)
  }
  for (const s of slots) {
    add(s.mediaId, s.label, s.key, s.ownerKey)
    if (s.poster) add(s.poster.mediaId, s.poster.label, s.key, s.ownerKey)
  }
  return usage
}

// ── changing a place (used by the admin page before saving) ───────────────────────────────────

/** Follows a slot path in a freshly read document. Returns the object that holds the last key. */
export function locate(doc: Json, path: PathSeg[]): { parent: Json; key: string } | null {
  let cur: unknown = doc
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i]
    if (typeof seg === 'string') {
      cur = cur && typeof cur === 'object' ? (cur as Json)[seg] : undefined
      continue
    }
    if (!Array.isArray(cur)) return null
    const rows = cur as Json[]
    const found = seg.id !== null ? rows.find((r) => r && String(r.id) === seg.id) : rows[seg.index]
    cur = found
  }
  const last = path[path.length - 1]
  if (!cur || typeof cur !== 'object' || typeof last !== 'string') return null
  return { parent: cur as Json, key: last }
}

/**
 * Puts `mediaId` into the place (for a list of pictures: replaces item `index`) and returns the
 * top-level value to send back — e.g. the whole `sections` list for the homepage.
 */
export function withMedia(
  doc: Json,
  path: PathSeg[],
  mediaId: Id | null,
  index?: number,
): { field: string; value: unknown } | null {
  const copy = JSON.parse(JSON.stringify(doc)) as Json
  const spot = locate(copy, path)
  if (!spot) return null
  if (index !== undefined) {
    const ids = mediaRefs(spot.parent[spot.key])
    if (index < 0 || index >= ids.length) return null
    ids[index] = mediaId as Id
    spot.parent[spot.key] = ids
  } else spot.parent[spot.key] = mediaId
  const top = path[0]
  if (typeof top !== 'string') return null
  return { field: top, value: copy[top] }
}
