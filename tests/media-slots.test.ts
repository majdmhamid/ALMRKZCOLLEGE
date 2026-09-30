import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { Courses } from '@/collections/Courses'
import { SuccessStories } from '@/collections/SuccessStories'
import { Gallery } from '@/globals/Gallery'
import { Homepage } from '@/globals/Homepage'
import { homepageAnchors, locate, slotsOf, usageFromSlots, withMedia, type Slot } from '@/lib/media-slots'

/** The real field config of the homepage / courses (so a new field or reel is covered by itself) */
const homepage = {
  id: 1,
  sections: [
    { id: 'hero1', blockType: 'hero', title: 'كلية المركز', video: 11, poster: 12, anchor: 'top' },
    { id: 'why1', blockType: 'why', title: 'ليش؟', image: 13 },
    {
      id: 'vid1',
      blockType: 'videos',
      title: 'تعرّف علينا',
      anchor: 'video',
      promo: { video: 20, poster: 21, durationLabel: '1:00' },
      reels: [
        { id: 'r1', title: 'لحام', video: 30, poster: 31, course: 7 },
        { id: 'r2', title: 'تركيب مكيفات', video: 32, poster: 33, course: 8, durationLabel: '0:12' },
      ],
    },
    { id: 'gal1', blockType: 'gallery', title: 'صور', anchor: 'gallery', hidden: true },
  ],
}
const courseNames: Record<string, string> = { 7: 'اللحام', 8: 'فني تكييف' }
const titles = (collection: string, id: number | string) => (collection === 'courses' ? courseNames[String(id)] : undefined)

const homeSlots = () =>
  slotsOf({ owner: { type: 'global', slug: 'homepage' }, fields: Homepage.fields, doc: homepage, titles, anchors: { videos: 'video' } })

const byLabel = (slots: Slot[], label: string) => slots.find((s) => s.label === label)

describe('media slots — where each video / picture is on the site', () => {
  it('names every homepage video in plain Arabic, with its cover picture and place on the site', () => {
    const slots = homeSlots()
    const videos = slots.filter((s) => s.kind === 'video').map((s) => s.label)
    expect(videos).toEqual([
      'الصفحة الرئيسية ← الواجهة (فيديو كبير) ← الفيديو في الخلفية',
      'الصفحة الرئيسية ← فيديو الكلية ← الفيديو التعريفي الكبير',
      'الصفحة الرئيسية ← فيديو الكلية ← ريل ١: لحام (الدورة: اللحام)',
      'الصفحة الرئيسية ← فيديو الكلية ← ريل ٢: تركيب مكيفات (الدورة: فني تكييف)',
    ])
    const reel2 = byLabel(slots, 'الصفحة الرئيسية ← فيديو الكلية ← ريل ٢: تركيب مكيفات (الدورة: فني تكييف)')!
    expect(reel2).toMatchObject({ mediaId: 32, duration: '0:12', sitePath: '/ar#video' })
    expect(reel2.poster).toMatchObject({ mediaId: 33, label: `${reel2.label} ← صورة الغلاف` })
    expect(reel2.path).toEqual(['sections', { id: 'vid1', index: 2 }, 'reels', { id: 'r2', index: 1 }, 'video'])
    // the top video is the top of the page (no scrolling)
    expect(slots[0].sitePath).toBe('/ar')
    // a cover picture is part of its video card, not a separate picture place
    expect(slots.filter((s) => s.kind === 'image').map((s) => s.label)).toEqual(['الصفحة الرئيسية ← ليش كلية المركز؟ ← الصورة'])
  })

  it('a reel added in the homepage form shows up by itself (nothing hard-coded)', () => {
    const doc = structuredClone(homepage)
    doc.sections[2].reels!.push({ id: 'r3', title: 'رافعات', video: null as never, poster: null as never, course: 7 })
    const slots = slotsOf({ owner: { type: 'global', slug: 'homepage' }, fields: Homepage.fields, doc, titles })
    const reel3 = byLabel(slots, 'الصفحة الرئيسية ← فيديو الكلية ← ريل ٣: رافعات (الدورة: اللحام)')
    expect(reel3).toMatchObject({ kind: 'video', mediaId: null })
    expect(reel3!.poster).toMatchObject({ mediaId: null })
  })

  it('course, story and gallery videos: own page, section anchor, empty places too', () => {
    const course = slotsOf({
      owner: { type: 'collection', slug: 'courses', id: 7 },
      fields: Courses.fields,
      doc: { id: 7, name: 'اللحام', slug: 'welding', coverImage: 40, gallery: [41, 42], video: null },
      ownerLabel: { useAsTitle: 'name' },
    })
    expect(byLabel(course, 'صفحة دورة: اللحام ← فيديو')).toMatchObject({ mediaId: null, sitePath: '/ar/course/welding#course-media' })
    expect(byLabel(course, 'صفحة دورة: اللحام ← الصورة الرئيسية')).toMatchObject({ mediaId: 40, sitePath: '/ar/course/welding' })
    expect(byLabel(course, 'صفحة دورة: اللحام ← صور إضافية ← صورة ٢')).toMatchObject({ mediaId: 42, many: { index: 1, total: 2 } })
    // the search-engine picture is shown only when set
    expect(course.find((s) => s.label.includes('جوجل'))).toMatchObject({ optional: true })

    const story = slotsOf({
      owner: { type: 'collection', slug: 'success-stories', id: 3 },
      fields: SuccessStories.fields,
      doc: { id: 3, graduateName: 'محمد', video: 50, videoDuration: '1:12' },
      anchors: { successStories: 'graduates' },
    })
    expect(byLabel(story, 'قصة نجاح: محمد ← فيديو')).toMatchObject({ mediaId: 50, duration: '1:12', sitePath: '/ar#graduates' })

    const gallery = slotsOf({
      owner: { type: 'global', slug: 'gallery' },
      fields: Gallery.fields,
      doc: { images: [60], videos: [{ id: 'g1', title: 'جولة', youtubeUrl: 'https://youtu.be/x', thumbnail: 61 }] },
    })
    expect(byLabel(gallery, 'معرض الصور والفيديو ← فيديو ١: جولة')).toMatchObject({
      mediaId: null,
      youtube: 'https://youtu.be/x',
      poster: { mediaId: 61 },
      sitePath: '/ar#gallery',
    })
  })

  it('«مستعمل في»: every place of a file, its cover pictures included', () => {
    const usage = usageFromSlots(homeSlots())
    expect(usage.get('33')?.map((p) => p.label)).toEqual([
      'الصفحة الرئيسية ← فيديو الكلية ← ريل ٢: تركيب مكيفات (الدورة: فني تكييف) ← صورة الغلاف',
    ])
    expect(usage.get('99')).toBeUndefined()
  })

  it('reads anchors and hidden sections like the website', () => {
    expect(homepageAnchors(Homepage.fields as Field[], homepage)).toMatchObject({ hero: 'top', videos: 'video', why: 'why', gallery: 'gallery' })
  })

  it('replacing a video changes only that place — found by row id even if rows moved', () => {
    const reel2 = byLabel(homeSlots(), 'الصفحة الرئيسية ← فيديو الكلية ← ريل ٢: تركيب مكيفات (الدورة: فني تكييف)')!
    const moved = structuredClone(homepage)
    moved.sections[2].reels!.reverse()
    const change = withMedia(moved, reel2.path, 99)!
    expect(change.field).toBe('sections')
    const sections = change.value as typeof homepage.sections
    expect(sections[2].reels!.map((r) => r.video)).toEqual([99, 30])
    expect(moved.sections[2].reels![0].video).toBe(32) // the original is untouched
    // a deleted row → null (the page tells the editor to reload)
    expect(locate({ sections: [] }, reel2.path)).toBeNull()
    // an item of a list of pictures
    expect(withMedia({ gallery: [1, 2, 3] }, ['gallery'], 9, 1)).toEqual({ field: 'gallery', value: [1, 9, 3] })
  })
})
