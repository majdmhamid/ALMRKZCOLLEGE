'use client'

import {
  TextareaField,
  TextareaInput,
  TextField,
  TextInput,
  useConfig,
  useDocumentInfo,
  useForm,
  useFormFields,
  useLocale,
} from '@payloadcms/ui'
import type { TextareaFieldClientProps, TextFieldClientProps } from 'payload'
import React, { useEffect, useState } from 'react'

import './bilingual.scss'
import { EDITS_FIELD, getAt, setAt, toIdPath, type Edits, type Locale } from './paths'

/**
 * خانة نص بعمودين: عربي (يمين) وعبري (يسار). اللغة المختارة فوق هي خانة Payload العادية؛
 * الثانية بتنكتب هون وبتنحفظ مع نفس الحفظ (config.ts).
 */

const NAMES: Record<Locale, string> = { ar: 'عربي', he: 'עברית' }

/** نسخة اللغة الثانية من العنصر — طلب واحد لكل الخانات بالصفحة (بيتجدّد كل ما تنفتح الصفحة) */
const cache = new Map<string, { at: number; doc: Promise<Record<string, unknown> | null> }>()
const FRESH_MS = 5000

function loadOther(url: string) {
  const hit = cache.get(url)
  if (hit && Date.now() - hit.at < FRESH_MS) return hit.doc
  const doc = fetch(url, { credentials: 'include' })
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, unknown>>) : null))
    .catch(() => null)
    .then((d) => {
      if (!d) cache.delete(url) // ما نتذكّر فشل (السيرفر لسا بيشتغل مثلاً)
      return d
    })
  cache.set(url, { at: Date.now(), doc })
  return doc
}

function useOtherDoc(locale: Locale) {
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const { config } = useConfig()
  const api = `${config.serverURL || ''}${config.routes.api}`
  const q = `locale=${locale}&fallback-locale=none&draft=true&depth=0`
  const url = globalSlug ? `${api}/globals/${globalSlug}?${q}` : collectionSlug && id ? `${api}/${collectionSlug}/${id}?${q}` : null
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null)
  const [loaded, setLoaded] = useState(!url) // عنصر جديد: ما في إشي نحمّله
  useEffect(() => {
    if (!url) return
    let live = true
    void loadOther(url).then((d) => {
      if (!live) return
      setDoc(d)
      setLoaded(true)
    })
    return () => {
      live = false
    }
  }, [url])
  return { doc, url, loaded }
}

type Props = TextFieldClientProps | TextareaFieldClientProps

export function BilingualField(props: Props) {
  const { field, path, readOnly } = props
  const current: Locale = useLocale().code === 'he' ? 'he' : 'ar'
  const other: Locale = current === 'ar' ? 'he' : 'ar'
  const { dispatchFields, getField, setModified } = useForm()
  const idPath = useFormFields(([fields]) => toIdPath(path, (prefix) => fields[`${prefix}.id`]?.value))
  const pending = useFormFields(([fields]) =>
    idPath ? (fields[EDITS_FIELD]?.value as Edits | undefined)?.[other]?.[idPath] : undefined,
  )
  const { doc, url, loaded } = useOtherDoc(other)
  const [typed, setTyped] = useState<string | null>(null)

  const saved = doc && idPath ? getAt(doc, idPath) : undefined
  const value = typed ?? pending ?? (typeof saved === 'string' ? saved : '')

  const onChange = (next: string) => {
    if (!idPath) return
    setTyped(next)
    const edits = (getField(EDITS_FIELD)?.value as Edits | undefined) ?? {}
    dispatchFields({ type: 'UPDATE', path: EDITS_FIELD, value: { ...edits, [other]: { ...edits[other], [idPath]: next } } })
    setModified(true)
    // إذا الخانة انعرضت من جديد (فتح صف مسكّر مثلاً) تظهر آخر قيمة
    if (url) void cache.get(url)?.doc.then((d) => d && setAt(d, idPath, next))
  }

  const label = typeof field.label === 'string' ? field.label : ((field.label as Record<string, string> | undefined)?.ar ?? field.name)
  const mainFilled = useFormFields(([fields]) => Boolean(String(fields[path]?.value ?? '').trim()))
  const missing = loaded && mainFilled && !value.trim()
  const Label = (
    <span className="field-label">
      {label}
      <span className="localized"> — {NAMES[other]}</span>
    </span>
  )
  const common = {
    path: `${path}__${other}`,
    Label,
    readOnly: readOnly || !idPath || (!loaded && typed === null),
    rtl: true,
    value,
    placeholder: loaded ? undefined : '…',
  }

  // نفس عرض الخانة داخل صف (row) زي ما Payload بيعمل
  const width = (field.admin as { width?: string } | undefined)?.width
  const style = (width ? { '--field-width': width } : { flex: '1 1 auto' }) as React.CSSProperties

  return (
    <div className="bi" style={style}>
      <div className={`bi__grid bi--main-${current}`}>
      <div className="bi__col bi__col--main" lang={current}>
        {field.type === 'textarea' ? <TextareaField {...(props as TextareaFieldClientProps)} /> : <TextField {...(props as TextFieldClientProps)} />}
      </div>
      <div className={`bi__col bi__col--other${missing ? ' bi__col--missing' : ''}`} lang={other}>
        {field.type === 'textarea' ? (
          <TextareaInput {...common} valueToRender={value} rows={(field as { admin?: { rows?: number } }).admin?.rows} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <TextInput {...common} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} />
        )}
        {missing && (
          <div className="bi__hint">
            {other === 'he' ? 'ناقص بالعبري — الموقع العبري رح يعرض النص العربي مكانه' : 'ناقص بالعربي'}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
