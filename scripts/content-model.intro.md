# Content model — what data exists

> **Generated file.** The tables below are produced from the real Payload config by
> `npm run generate:content-model` (intro text lives in `scripts/content-model.intro.md`).
> The admin-panel session re-runs it on every schema change. Types: `src/payload-types.ts`.

## Status

Everything in the design (Claude Design handoff, **Option A - Video Scroll**, and its
`content.js`) is now editable. `npm run seed` loads all of it, including the images and videos.

| Part | Where |
|---|---|
| Collections: courses, course-groups, news, success-stories, staff, partners, media, leads, users | ✅ |
| Global `homepage` — the 13 Option A sections as reorderable blocks | ✅ |
| Global `ui-texts` — every other label in `content.js` (nav, buttons, form, stats, trust…) | ✅ |
| Global `gallery` — photos + YouTube videos | ✅ |
| Globals `site-settings` (logos, contact, social, SEO), `navigation` (header + footer) | ✅ |

The design files are kept in `src/seed/design/` (`content.js` + `assets/`). Fonts (Almarai)
are in the original handoff bundle under `assets/fonts/`, not in this repo.

## Who owns which folder

| Folder | Owner |
|---|---|
| `src/payload.config.ts`, `src/collections/**`, `src/globals/**`, `src/blocks/**`, `src/fields/**`, `src/hooks/**`, `src/access/**`, `src/admin/**`, `src/seed/**`, `src/migrations/**`, `src/app/(payload)/**`, `scripts/**` | admin-panel session |
| `src/app/(frontend)/**`, `src/components/**` | public website (built on the admin-panel branch: `src/components/site/**`) |
| `src/lib/rules.ts`, `src/lib/preview.ts` | shared — admin session writes, website imports. Ask before changing. |

The public website (design Option A) is implemented in `src/app/(frontend)/[locale]/**` and
`src/components/site/**`: homepage sections, `/courses`, `/courses/{group}`, `/course/{slug}`,
`/news/{slug}`, the «سجّل اهتمامك» server action, draft preview and live preview.
Published data is cached (tag `site`) and cleared by `src/hooks/revalidate.ts` on every save.

## How the website reads content

```ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'

const payload = await getPayload({ config })
const { isEnabled: draft } = await draftMode()

const { docs } = await payload.find({
  collection: 'courses',
  locale: 'he',            // 'ar' (default) | 'he'  — fallback to Arabic when a Hebrew text is empty
  draft,                   // show unsaved-to-public edits while previewing
  overrideAccess: draft,   // public reads only see `_status: published`
  where: { group: { equals: groupId } },
  sort: 'order',
  depth: 1,                // populate relationships/uploads one level
})
const settings = await payload.findGlobal({ slug: 'site-settings', locale: 'ar' })
```

- **Locales:** `ar` (default) and `he`, both RTL. Every field marked 🌐 has two values.
- **Drafts:** collections with drafts have `_status`. Without `draft: true` you only get the
  published version. Public (anonymous) API requests only ever see published docs.
- **Ordering:** `order` field (ascending). Use `sort: 'order'`.
- **Media:** upload fields populate to a `Media` doc: `url`, `alt` (localized), `mimeType`,
  `width`, `height`, `sizes.thumbnail|card|wide|hero.url`, `focalX/focalY`. Videos have
  `mimeType` starting with `video/` (no sizes). Use `next/image` for images.
- **Rich text:** Lexical JSON. Render with
  `import { RichText } from '@payloadcms/richtext-lexical/react'`.
- **Links (`link` groups):** `{ type: 'anchor'|'page'|'course'|'courseGroup'|'whatsapp'|'phone'|'external', anchor, page, course, courseGroup, url, whatsappMessage, newTab }`. `anchor` → `/{locale}#{anchor}`.
  Build the href with `sitePath()` from `src/lib/preview.ts` for courses/groups; WhatsApp →
  `https://wa.me/<site-settings.contact.whatsapp>?text=<message>`.

## Fixed texts — never editable (CLAUDE.md rules)

Import from `src/lib/rules.ts`:

| Export | Use |
|---|---|
| `VOUCHER_TEXT[locale]` | show on every course with `voucherEligible: true` |
| `EMPLOYMENT_NOTICE[locale]` | show wherever employment/career guidance is mentioned (e.g. next to `careerGuidance`, success stories) |

There is **no price field** anywhere. The admin panel rejects saving text that contains
prices (₪, «شيكل», ש"ח…) or job-guarantee wording («ضمان تشغيل», «הבטחת תעסוקה»…).

## URLs, preview and live preview

URL scheme used by the admin preview buttons (`src/lib/preview.ts → sitePath`):

| Page | Path |
|---|---|
| Home | `/{locale}` |
| Course group | `/{locale}/courses/{groupSlug}` |
| Course | `/{locale}/course/{slug}` |
| News item | `/{locale}/news/{slug}` |
| Success story | `/{locale}/success-stories/{slug}` |

- `GET /next/preview?path=/ar/course/x` (in `src/app/(payload)/next/preview/route.ts`) turns
  on Next.js draft mode for anyone logged in to /admin and redirects to `path`.
  `GET /next/exit-preview?path=...` turns it off.
- **Live preview** (side-by-side in /admin): pages must render
  `<RefreshRouteOnSave />` (client component) when `draftMode().isEnabled`:

  ```tsx
  'use client'
  import { RefreshRouteOnSave as Payload } from '@payloadcms/live-preview-react'
  import { useRouter } from 'next/navigation'
  export const RefreshRouteOnSave = () => {
    const router = useRouter()
    return <Payload refresh={() => router.refresh()} serverURL={process.env.NEXT_PUBLIC_SERVER_URL!} />
  }
  ```

## Homepage = design Option A

`payload.findGlobal({ slug: 'homepage', locale, draft, depth: 2 })` → `sections[]`.
Render them **in order**, skip `hidden: true`, and use `anchor` as the section `id`.
Section numbers («01», «02»…) are not stored: count the visible sections that have a `kicker`.

| `blockType` | Option A section | Data |
|---|---|---|
| `hero` | Hero video | `video`, `poster`, texts, `showGroupsStrip` (groups marquee from `course-groups`) |
| `stats` | Stats strip | `items[] {value, suffix, label, anchor}` |
| `courseGroups` | 01 Fields | `groups[]` — **empty = all published groups by `order`**. Count label = published courses in the group + `ui-texts.common.courseCount` |
| `featuredCourses` | 02 Courses | `courses[]` — **empty = courses with `featured: true`**. Card: `hours` + `ui-texts.common.hours`, `sessions`, `ui-texts.common.evening`; show `ui-texts.trust[3].title` only when `voucherEligible` |
| `why` | 03 Why | `items[]`, `image`, `pills[]`, `badgeNumber`, `badgeText` |
| `successStories` | 04 Graduates | `stories[]` (empty = `featured` stories with a `quote`), `rotateSeconds`. Story: `quote`, `excerpt`, `currentRole`, `photo`, `course.name`, `videoDuration` |
| `staff` | 05 Staff | `members[]` — empty = all `staff` by `order`. «اقرأ المزيد»/«إغلاق» = `ui-texts.common.readMore` / `ui-texts.nav.close` |
| `videos` | 06 Videos | `promo {video, youtubeUrl, poster, durationLabel, kind, title, subtitle, playLabel}`, `reels[] {title, poster, video, durationLabel, course}`; reel button → `wa.me/<whatsapp>?text=<whatsappMessage + course name>` |
| `news` | 07 News | latest `count` published `news` (`pinned` first, then `publishedAt` desc) |
| `partners` | Partners marquee | `partners[]` — empty = all `partners` by `order` |
| `employers` | 08 Employers | `items[]`, `whatsappButton`, `hiringButton`, `hiringText` |
| `faq` | 09 FAQ | `items[] {question, answer}` |
| `register` | 10 Register | `showVoucherNote` → render `VOUCHER_TEXT[locale]` (fixed), `bullets[]`, `whatsappButton`; form labels in `ui-texts.form` |
| `gallery` | (not in Option A — editors may add it) | first `count` images of the `gallery` global |

Header = `navigation.header`, footer = `navigation.footer` + `site-settings.contact`.
Header menu links are `link.type: 'anchor'` → `/{locale}#{anchor}`. The mobile bottom bar
labels come from `ui-texts` (`nav.home`, `nav.courses`, `common.registerInterest`,
`common.whatsapp`, `common.call`). Language switch label: `ui-texts.otherLang`.

## «سجّل اهتمامك» form → `leads`

Anyone may create a lead; only admins can read them. From a server action:

```ts
await payload.create({
  collection: 'leads',
  data: { name, phone, course /* course id, optional */, courseOther, message,
          locale: 'ar' | 'he', sourcePage: '/ar/course/x', website /* honeypot: keep hidden & empty */ },
})
```

`status` is always `new` for public submissions. An email goes to the college automatically.
Phone must contain 9–15 digits.
