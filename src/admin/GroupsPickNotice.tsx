'use client'

import { useField, useTranslation } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import React, { useEffect, useState } from 'react'

import { groupState, groupsWithPublishedCourses, relationId } from '@/lib/group-visibility'

type Group = { id: number; name?: string | null; _status?: string | null }

const TEXT = {
  ar: {
    title: 'في مجال جديد ظاهر بالموقع ومش مختار هون — بدك تضيفه؟',
    why: 'اخترت مجالات بإيدك بهاد القسم، فالصفحة الرئيسية بتعرض بس اللي بالقائمة. (أو فضّي القائمة لتنعرض كل المجالات لحالها.)',
    add: 'أضف',
    addAll: 'أضفهم كلهم',
    noName: 'بدون اسم',
  },
  he: {
    title: 'יש תחום חדש שמוצג באתר ולא נבחר כאן — להוסיף אותו?',
    why: 'בחרתם תחומים ידנית בחלק הזה, ולכן דף הבית מציג רק את מה שברשימה. (או רוקנו את הרשימה כדי שכל התחומים יוצגו אוטומטית.)',
    add: 'הוספה',
    addAll: 'להוסיף את כולם',
    noName: 'ללא שם',
  },
}

const get = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)) as Promise<{
    docs?: Record<string, unknown>[]
  } | null>

/**
 * الصفحة الرئيسية ← «مجالات التأهيل»: إذا المجالات مختارة بالإيد، مجال جديد ما بيطلع
 * بالرئيسية حتى لو هو ظاهر بالموقع. هون منحكي هيك ومنعطي زر «أضف».
 * «ظاهر بالموقع» = نفس قاعدة الموقع (lib/group-visibility.ts).
 */
export const GroupsPickNotice: UIFieldClientComponent = ({ path }) => {
  const groupsPath = path.replace(/[^.]+$/, 'groups')
  const { value, setValue } = useField<unknown[] | null>({ path: groupsPath })
  const { i18n } = useTranslation()
  const t = TEXT[i18n?.language === 'he' ? 'he' : 'ar']
  const [visible, setVisible] = useState<Group[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [groups, courses] = await Promise.all([
        get('/api/course-groups?depth=0&limit=200&sort=order&select[name]=true&select[_status]=true'),
        get('/api/courses?depth=0&limit=1000&where[_status][equals]=published&select[group]=true&select[_status]=true'),
      ])
      if (cancelled || !groups?.docs || !courses?.docs) return
      const withCourses = groupsWithPublishedCourses(courses.docs)
      setVisible(
        (groups.docs as Group[]).filter((g) => groupState(g._status, withCourses.has(g.id)) === 'visible'),
      )
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const chosen = (Array.isArray(value) ? value : []).map(relationId).filter((id) => id !== undefined)
  // بدون اختيار يدوي بتنعرض كل المجالات الظاهرة لحالها — ما في شي ناقص
  if (!visible || !chosen.length) return null
  const missing = visible.filter((g) => !chosen.includes(g.id))
  if (!missing.length) return null

  const add = (ids: number[]) => setValue([...(Array.isArray(value) ? value : []), ...ids])
  const btn: React.CSSProperties = {
    border: 0,
    borderRadius: 999,
    padding: '4px 12px',
    background: 'var(--brand-600, #158942)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    font: 'inherit',
  }
  return (
    <div
      role="status"
      style={{
        border: '1px solid #f0c36d',
        background: '#fff8e6',
        color: '#5c3f00',
        borderRadius: 12,
        padding: '10px 14px',
        margin: '0 0 16px',
        lineHeight: 1.7,
        fontSize: 13,
      }}
    >
      <strong style={{ fontSize: 14 }}>⚠ {t.title}</strong>
      <div style={{ opacity: 0.85 }}>{t.why}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {missing.map((g) => (
          <button key={g.id} type="button" style={btn} onClick={() => add([g.id])}>
            + {t.add} «{g.name || t.noName}»
          </button>
        ))}
        {missing.length > 1 && (
          <button type="button" style={{ ...btn, background: 'var(--brand-800, #0b5027)' }} onClick={() => add(missing.map((g) => g.id))}>
            {t.addAll}
          </button>
        )}
      </div>
    </div>
  )
}
