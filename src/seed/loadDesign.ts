import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import vm from 'vm'

import type { L } from './optionA'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** Folder with the design's content.js and assets/ (copied from the Claude Design handoff). */
export const DESIGN_DIR = path.resolve(dirname, 'design')

type Dict = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

export type DesignContent = {
  site: Dict & { name: L; shortName: L; city: L; address: L; hours: L }
  groups: (Dict & { slug: string; name: L; short: L; tagline: L; icon: string; image: string })[]
  courses: (Dict & {
    slug: string
    group: string
    featured?: boolean
    name: L
    summary: L
    hours: number
    sessions: number
    image: string
  })[]
  graduates: { slug: string; name: L; course: string; image: string }[]
  staff: { slug: string; name: L; role: L; image: string }[]
  partners: { slug: string; name: L; image: string }[]
  news: { slug: string; date: string; title: L; excerpt: L; image: string }[]
  videos: { id: string; title: L; thumb: string }[]
  gallery: string[]
  dict: { ar: Dict; he: Dict }
  courseNames: Record<string, L>
  counts: { courseCount: number; alumniCount: number }
}

/** Runs the design's content.js in a sandbox and returns its `window.ALMRKZ` data. */
export function loadDesign(): DesignContent {
  const code = fs.readFileSync(path.join(DESIGN_DIR, 'content.js'), 'utf8')
  const sandbox: { window: Dict } = { window: {} }
  vm.runInNewContext(code, sandbox)
  const A = sandbox.window.ALMRKZ
  // courseNames is private inside content.js: rebuild it from forLocale().
  const ar = A.forLocale('ar')
  const he = A.forLocale('he')
  const courseNames: Record<string, L> = {}
  ar.graduates.forEach((g: Dict, i: number) => {
    courseNames[g.course] = { ar: g.courseName, he: he.graduates[i].courseName }
  })
  return {
    ...A,
    courseNames,
    counts: { courseCount: ar.courseCount, alumniCount: ar.alumniCount },
  }
}

export const assetPath = (p: string) => path.join(DESIGN_DIR, p)
