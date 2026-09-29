import {
  APIError,
  updateOperationGlobal,
  ValidationError,
  type CollectionAfterChangeHook,
  type CollectionConfig,
  type CollectionSlug,
  type Field,
  type GlobalAfterChangeHook,
  type GlobalConfig,
  type GlobalSlug,
  type PayloadRequest,
} from 'payload'

import { EDITS_FIELD, LOCALES, setAt, type Edits, type Locale } from './paths'

/**
 * عربي وعبري جنب بعض بصفحة التعديل — بدل ما المدير يبدّل «لغة المحتوى» ويرجع.
 *
 * - كل خانة نص/نص طويل إلها نسختين (localized) بتنعرض بعمودين: اللغة الحالية (خانة Payload
 *   العادية) واللغة الثانية جنبها (BilingualField.tsx).
 * - اللي بينكتب باللغة الثانية بيروح مع نفس الحفظ بخانة مخفية (bilingualEdits، ما إلها عمود بالقاعدة).
 * - بعد ما Payload يحفظ اللغة الحالية، afterChange بيحفظ اللغة الثانية بنفس الطريقة (مسودة/نشر/حفظ
 *   تلقائي) وبنفس الـ transaction — إذا فشل واحد، ما بينحفظ ولا إشي.
 */

const FIELD_COMPONENT = '@/admin/bilingual/BilingualField#BilingualField'
const RICH_TEXT_NOTE = '@/admin/bilingual/RichTextNote#RichTextNote'

/**
 * التعديلات بتستنّى هون لحد ما ينحفظ العنصر. مربوطة بالطلب نفسه (req) — الـ context اللي بيوصل
 * لخانة الـ hook مش دايماً نفس اللي بيوصل لـ afterChange.
 */
const pending = new WeakMap<object, Edits>()
/** طلبات عم تحفظ اللغة الثانية هلأ — ما منلتقط فيها إشي */
const applying = new WeakSet<object>()

/** الخانة المخفية. virtual = ما إلها عمود بالقاعدة (ما في migration). */
const editsField: Field = {
  name: EDITS_FIELD,
  // بيطلع برسائل الخطأ (مثلاً سعر مكتوب بالعبري)
  label: 'النص باللغة الثانية',
  type: 'json',
  virtual: true,
  admin: { hidden: true, disableListColumn: true, disableListFilter: true, disableBulkEdit: true },
  hooks: {
    // منحفظ التعديلات لحد afterChange ومنفضّي الخانة
    beforeChange: [
      ({ value, req }) => {
        if (value && typeof value === 'object' && !applying.has(req)) pending.set(req, value as Edits)
        return undefined
      },
    ],
  },
}

/** بيحط العمودين على كل خانة نص عندها نسختين. بيرجّع كمان إذا لقى وحدة. */
function wrapFields(fields: Field[]): { fields: Field[]; found: boolean } {
  let found = false
  const walk = (list: Field[]): Field[] =>
    list.map((f) => {
      if ((f.type === 'text' || f.type === 'textarea') && f.localized && !f.admin?.hidden && !f.admin?.components?.Field) {
        if (f.type === 'text' && f.hasMany) return f
        found = true
        return { ...f, admin: { ...f.admin, components: { ...f.admin?.components, Field: FIELD_COMPONENT } } } as Field
      }
      // النص الطويل (محرّر) بضل بلغة وحدة — تحته زر بيفتح نفس الصفحة باللغة الثانية
      if (f.type === 'richText' && f.localized && !f.admin?.hidden) {
        const after = f.admin?.components?.afterInput ?? []
        return { ...f, admin: { ...f.admin, components: { ...f.admin?.components, afterInput: [...after, RICH_TEXT_NOTE] } } }
      }
      if (f.type === 'tabs') return { ...f, tabs: f.tabs.map((t) => ({ ...t, fields: walk(t.fields) })) }
      if (f.type === 'blocks') {
        return { ...f, blocks: f.blocks.map((b) => ({ ...b, fields: walk(b.fields) })) }
      }
      if ('fields' in f && Array.isArray(f.fields)) return { ...f, fields: walk(f.fields) } as Field
      return f
    })
  return { fields: walk(fields), found }
}

/** `req` بيتغيّر لما نمرّره لـ payload.update (اللغة، الـ context) — منرجّعه زي ما كان */
async function withSameReq<T>(req: PayloadRequest, run: () => Promise<T>): Promise<T> {
  const saved = { locale: req.locale, fallbackLocale: req.fallbackLocale, context: req.context, depth: req.query?.depth }
  applying.add(req)
  try {
    return await run()
  } finally {
    applying.delete(req)
    req.locale = saved.locale
    req.fallbackLocale = saved.fallbackLocale
    req.context = saved.context
    if (req.query) req.query.depth = saved.depth
  }
}

const LOCALE_NAMES: Record<Locale, string> = { ar: 'العربية', he: 'العبرية' }

/** رسالة مفهومة إذا اللغة الثانية ما انحفظت (مثلاً خانة إجبارية فاضية بالعبري وقت النشر) */
function explain(e: unknown, locale: Locale): never {
  if (e instanceof ValidationError) {
    const labels = e.data.errors.map((x) => {
      const l = x.label
      if (typeof l === 'string') return l
      if (l && typeof l === 'object') return (l as Record<string, string>).ar ?? x.path
      return x.path
    })
    throw new APIError(
      `النسخة ${LOCALE_NAMES[locale]} ناقصة — عبّي: ${[...new Set(labels)].join('، ')} (أو احفظ كمسودة).`,
      400,
      undefined,
      true,
    )
  }
  throw e
}

/** بيطبّق التعديلات على نسخة اللغة الثانية. بيرجّع بس الحقول الرئيسية اللي تغيّرت (مع كل محتواها). */
function patch(doc: Record<string, unknown>, edits: Record<string, string>) {
  const touched = new Set<string>()
  for (const [path, value] of Object.entries(edits)) {
    if (typeof value !== 'string') continue
    if (setAt(doc, path, value)) touched.add(path.split('.')[0])
  }
  return Object.fromEntries([...touched].map((k) => [k, doc[k]]))
}

const pendingEdits = (req: PayloadRequest) => {
  const edits = applying.has(req) ? undefined : pending.get(req)
  pending.delete(req)
  if (!edits) return []
  const current = req.locale
  return LOCALES.filter((l) => l !== current && edits[l] && Object.keys(edits[l]!).length).map(
    (l) => [l, edits[l]!] as const,
  )
}

const isAutosave = (req: PayloadRequest) => req.query?.autosave === 'true' || req.query?.autosave === true

const collectionHook: CollectionAfterChangeHook = async ({ doc, req, collection }) => {
  for (const [locale, edits] of pendingEdits(req)) {
    await withSameReq(req, async () => {
      const slug = collection.slug as CollectionSlug
      const draft = Boolean(collection.versions && doc._status === 'draft')
      const other = (await req.payload.findByID({
        collection: slug,
        id: doc.id,
        locale,
        fallbackLocale: false,
        draft: true,
        depth: 0,
        req,
        overrideAccess: false,
      })) as unknown as Record<string, unknown>
      const data = patch(other, edits)
      if (!Object.keys(data).length) return
      await req.payload
        .update({
          collection: slug,
          id: doc.id,
          locale,
          data: draft ? data : { ...data, ...(collection.versions ? { _status: 'published' } : {}) },
          draft,
          autosave: draft && isAutosave(req),
          depth: 0,
          req,
          overrideAccess: false,
        })
        .catch((e) => explain(e, locale))
    })
  }
  return doc
}

const globalHook: GlobalAfterChangeHook = async ({ doc, req, global }) => {
  for (const [locale, edits] of pendingEdits(req)) {
    await withSameReq(req, async () => {
      const slug = global.slug as GlobalSlug
      const draft = Boolean(global.versions && doc._status === 'draft')
      const other = (await req.payload.findGlobal({
        slug,
        locale,
        fallbackLocale: false,
        draft: true,
        depth: 0,
        req,
        overrideAccess: false,
      })) as unknown as Record<string, unknown>
      const data = patch(other, edits)
      if (!Object.keys(data).length) return
      // payload.updateGlobal ما بيقبل autosave — منستعمل العملية نفسها (بتحفظ فوق نسخة الحفظ التلقائي)
      req.locale = locale
      req.fallbackLocale = false
      await updateOperationGlobal({
        slug,
        globalConfig: global,
        data: (draft ? data : { ...data, ...(global.versions ? { _status: 'published' } : {}) }) as never,
        draft,
        autosave: draft && isAutosave(req),
        depth: 0,
        req,
        overrideAccess: false,
      }).catch((e) => explain(e, locale))
    })
  }
  return doc
}

export function bilingualCollection(c: CollectionConfig): CollectionConfig {
  const { fields, found } = wrapFields(c.fields)
  if (!found) return c
  return {
    ...c,
    fields: [...fields, editsField],
    hooks: { ...c.hooks, afterChange: [collectionHook, ...(c.hooks?.afterChange ?? [])] },
  }
}

export function bilingualGlobal(g: GlobalConfig): GlobalConfig {
  const { fields, found } = wrapFields(g.fields)
  if (!found) return g
  return {
    ...g,
    fields: [...fields, editsField],
    hooks: { ...g.hooks, afterChange: [globalHook, ...(g.hooks?.afterChange ?? [])] },
  }
}
