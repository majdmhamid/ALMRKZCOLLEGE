# Content model — what data exists

> **Generated file.** The tables below are produced from the real Payload config by
> `npm run generate:content-model` (intro text lives in `scripts/content-model.intro.md`).
> The admin-panel session re-runs it on every schema change. Types: `src/payload-types.ts`.

## Status

| Part | State |
|---|---|
| Collections: courses, course-groups, news, success-stories, media, leads, users | ✅ ready |
| Globals: `site-settings`, `navigation` (header + footer) | ✅ ready |
| Global `homepage` (sections as blocks, reorderable) | ⏳ waits for the design's `content.js` |
| Global for fixed texts (every label in `content.js`) | ⏳ waits for the design's `content.js` |
| Seed from `content.js` + design `assets/` | ⏳ waits for the design |

## Who owns which folder

| Folder | Owner |
|---|---|
| `src/payload.config.ts`, `src/collections/**`, `src/globals/**`, `src/blocks/**`, `src/fields/**`, `src/hooks/**`, `src/access/**`, `src/admin/**`, `src/seed/**`, `src/migrations/**`, `src/app/(payload)/**`, `scripts/**` | admin-panel session |
| `src/app/(frontend)/**`, `src/components/**` | website session |
| `src/lib/rules.ts`, `src/lib/preview.ts` | shared — admin session writes, website imports. Ask before changing. |

`src/app/(frontend)/layout.tsx` and `page.tsx` are placeholders from the admin session so
the build passes — the website session replaces them freely.

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
- **Links (`link` groups):** `{ type: 'page'|'course'|'courseGroup'|'whatsapp'|'phone'|'external', page, course, courseGroup, url, whatsappMessage, newTab }`.
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
