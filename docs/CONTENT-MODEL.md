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

## Collections

### `courses` — الدورات

Drafts: **yes** · REST: `/api/courses` · Local API: `payload.find({ collection: 'courses', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `name` | text | required, 🌐 ar/he | اسم الدورة |  |
| `group` | relationship | required | المجال | → `course-groups` |
| `shortDescription` | textarea | required, 🌐 ar/he | وصف مختصر (للبطاقة) |  |
| `fullDescription` | richText | 🌐 ar/he | وصف كامل |  |
| `topics` | array |  | مواضيع الدورة |  |
| `topics[].topic` | text | required, 🌐 ar/he | الموضوع |  |
| `highlights` | array |  | مميزات بارزة (اختياري) |  |
| `highlights[].text` | text | required, 🌐 ar/he | النص |  |
| `duration` | text | 🌐 ar/he | مدة الدورة (اختياري) |  |
| `hours` | number |  | عدد الساعات |  |
| `sessions` | number |  | عدد اللقاءات |  |
| `schedule` | select | many | نوع الدوام | `morning` · `evening` · `weekend` · `online` |
| `scheduleDetails` | text | 🌐 ar/he | تفاصيل مواعيد الدوام |  |
| `nextStart` | date |  | موعد البدء القريب |  |
| `nextStartNote` | text | 🌐 ar/he | ملاحظة عن موعد البدء |  |
| `certificate` | text | required, 🌐 ar/he | الشهادة |  |
| `certifyingBody` | text | required, 🌐 ar/he | الجهة المعتمِدة |  |
| `certificateValue` | textarea | 🌐 ar/he | شو بتفيد الشهادة بسوق العمل |  |
| `admission` | group |  | شروط القبول |  |
| `admission.age` | text | 🌐 ar/he | العمر |  |
| `admission.education` | text | 🌐 ar/he | التعليم |  |
| `admission.hebrew` | text | 🌐 ar/he | اللغة العبرية |  |
| `admission.experience` | text | 🌐 ar/he | خبرة سابقة |  |
| `admission.other` | array |  | شروط أخرى |  |
| `admission.other[].text` | text | required, 🌐 ar/he | الشرط |  |
| `voucherEligible` | checkbox |  | ملائمة للحصول على منحة (שובר) | default: `false` |
| `careerGuidance` | textarea | 🌐 ar/he | مرافقة وتوجيه مهني بعد التخرّج (اختياري) |  |
| `coverImage` | upload |  | الصورة الرئيسية | → `media` |
| `gallery` | upload | many | صور إضافية | → `media` |
| `video` | upload |  | فيديو (اختياري) | → `media` |
| `videoPoster` | upload |  | صورة غلاف الفيديو | → `media` |
| `youtubeUrl` | text |  | أو رابط يوتيوب (اختياري) |  |
| `seo` | group |  | ظهور في جوجل (SEO) |  |
| `seo.title` | text | 🌐 ar/he | عنوان الصفحة في جوجل |  |
| `seo.description` | textarea | 🌐 ar/he | وصف قصير في جوجل |  |
| `seo.image` | upload |  | صورة المشاركة (واتساب/فيسبوك) | → `media` |
| `featured` | checkbox |  | دورة مميّزة (تظهر في الصفحة الرئيسية) | default: `false` |
| `slug` | text |  | الرابط (slug) |  |
| `order` | number |  | الترتيب | default: `0` |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |
| `_status` | select |  |  | `draft` · `published` (drafts are hidden from the public API) |

### `course-groups` — مجالات الدورات

Drafts: **yes** · REST: `/api/course-groups` · Local API: `payload.find({ collection: 'course-groups', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `name` | text | required, 🌐 ar/he | اسم المجال |  |
| `shortName` | text | 🌐 ar/he | اسم مختصر |  |
| `tagline` | text | 🌐 ar/he | جملة تعريف (على البطاقة) |  |
| `description` | textarea | 🌐 ar/he | وصف أطول (لصفحة المجال) |  |
| `image` | upload |  | صورة المجال | → `media` |
| `icon` | upload |  | أيقونة | → `media` |
| `courses` | join |  | الدورات في هذا المجال | reverse of `courses.group` |
| `seo` | group |  | ظهور في جوجل (SEO) |  |
| `seo.title` | text | 🌐 ar/he | عنوان الصفحة في جوجل |  |
| `seo.description` | textarea | 🌐 ar/he | وصف قصير في جوجل |  |
| `seo.image` | upload |  | صورة المشاركة (واتساب/فيسبوك) | → `media` |
| `slug` | text |  | الرابط (slug) |  |
| `order` | number |  | الترتيب | default: `0` |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |
| `_status` | select |  |  | `draft` · `published` (drafts are hidden from the public API) |

### `news` — أخبار وإعلانات

Drafts: **yes** · REST: `/api/news` · Local API: `payload.find({ collection: 'news', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `kind` | select | required | النوع | `news` · `announcement` · `event` default: `"news"` |
| `publishedAt` | date | required | تاريخ النشر |  |
| `pinned` | checkbox |  | تثبيت في الأعلى | default: `false` |
| `excerpt` | textarea | 🌐 ar/he | ملخّص قصير |  |
| `coverImage` | upload |  | الصورة الرئيسية | → `media` |
| `content` | richText | 🌐 ar/he | النص الكامل |  |
| `gallery` | upload | many | صور وفيديو إضافي | → `media` |
| `relatedCourses` | relationship | many | دورات متعلقة | → `courses` |
| `seo` | group |  | ظهور في جوجل (SEO) |  |
| `seo.title` | text | 🌐 ar/he | عنوان الصفحة في جوجل |  |
| `seo.description` | textarea | 🌐 ar/he | وصف قصير في جوجل |  |
| `seo.image` | upload |  | صورة المشاركة (واتساب/فيسبوك) | → `media` |
| `slug` | text |  | الرابط (slug) |  |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |
| `_status` | select |  |  | `draft` · `published` (drafts are hidden from the public API) |

### `success-stories` — قصص نجاح الخريجين

Drafts: **yes** · REST: `/api/success-stories` · Local API: `payload.find({ collection: 'success-stories', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `featured` | checkbox |  | اعرضها بالرئيسية | default: `false` |
| `graduateName` | text | required, 🌐 ar/he | اسم الخريج/ة |  |
| `course` | relationship |  | الدورة التي أنهاها | → `courses` |
| `graduationYear` | number |  | سنة التخرّج |  |
| `photo` | upload |  | صورة الخريج/ة | → `media` |
| `quote` | textarea | 🌐 ar/he | اقتباس قصير (بكلماته) |  |
| `excerpt` | textarea | 🌐 ar/he | القصة باختصار (اختياري) |  |
| `currentRole` | text | 🌐 ar/he | شو بيشتغل اليوم (اختياري) |  |
| `story` | richText | 🌐 ar/he | القصة الكاملة (اختياري) |  |
| `video` | upload |  | فيديو (اختياري) | → `media` |
| `videoDuration` | text |  | مدة الفيديو |  |
| `slug` | text |  | الرابط (slug) |  |
| `order` | number |  | الترتيب | default: `0` |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |
| `_status` | select |  |  | `draft` · `published` (drafts are hidden from the public API) |

### `staff` — طاقم الكلية

Drafts: **no** · REST: `/api/staff` · Local API: `payload.find({ collection: 'staff', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `name` | text | required, 🌐 ar/he | الاسم |  |
| `role` | text | required, 🌐 ar/he | الوظيفة |  |
| `bio` | textarea | 🌐 ar/he | نبذة |  |
| `photo` | upload |  | الصورة | → `media` |
| `slug` | text |  | Slug |  |
| `order` | number |  | الترتيب | default: `0` |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |

### `partners` — الشركاء والجهات المعتمِدة

Drafts: **no** · REST: `/api/partners` · Local API: `payload.find({ collection: 'partners', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `name` | text | required, 🌐 ar/he | الاسم |  |
| `logo` | upload | required | اللوغو | → `media` |
| `url` | text |  | موقعهم (اختياري) |  |
| `slug` | text |  | Slug |  |
| `order` | number |  | الترتيب | default: `0` |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |

### `media` — مكتبة الصور والفيديو

Drafts: **no** · REST: `/api/media` · Local API: `payload.find({ collection: 'media', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `alt` | text | required, 🌐 ar/he | وصف الصورة / الفيديو |  |
| `sourceFile` | text |  | Source File |  |
| `caption` | text | 🌐 ar/he | تعليق يظهر تحت الصورة (اختياري) |  |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |
| `url` | text |  | URL |  |
| `thumbnailURL` | text |  | Thumbnail URL |  |
| `filename` | text |  |  |  |
| `mimeType` | text |  | MIME Type |  |
| `filesize` | number |  |  |  |
| `width` | number |  |  |  |
| `height` | number |  |  |  |
| `focalX` | number |  |  |  |
| `focalY` | number |  |  |  |
| `sizes` | group |  |  |  |
| `sizes.thumbnail` | group |  | thumbnail |  |
| `sizes.thumbnail.url` | text |  | URL |  |
| `sizes.thumbnail.width` | number |  |  |  |
| `sizes.thumbnail.height` | number |  |  |  |
| `sizes.thumbnail.mimeType` | text |  | MIME Type |  |
| `sizes.thumbnail.filesize` | number |  |  |  |
| `sizes.thumbnail.filename` | text |  |  |  |
| `sizes.card` | group |  | card |  |
| `sizes.card.url` | text |  | URL |  |
| `sizes.card.width` | number |  |  |  |
| `sizes.card.height` | number |  |  |  |
| `sizes.card.mimeType` | text |  | MIME Type |  |
| `sizes.card.filesize` | number |  |  |  |
| `sizes.card.filename` | text |  |  |  |
| `sizes.wide` | group |  | wide |  |
| `sizes.wide.url` | text |  | URL |  |
| `sizes.wide.width` | number |  |  |  |
| `sizes.wide.height` | number |  |  |  |
| `sizes.wide.mimeType` | text |  | MIME Type |  |
| `sizes.wide.filesize` | number |  |  |  |
| `sizes.wide.filename` | text |  |  |  |
| `sizes.hero` | group |  | hero |  |
| `sizes.hero.url` | text |  | URL |  |
| `sizes.hero.width` | number |  |  |  |
| `sizes.hero.height` | number |  |  |  |
| `sizes.hero.mimeType` | text |  | MIME Type |  |
| `sizes.hero.filesize` | number |  |  |  |
| `sizes.hero.filename` | text |  |  |  |

### `leads` — طلبات «سجّل اهتمامك»

Drafts: **no** · REST: `/api/leads` · Local API: `payload.find({ collection: 'leads', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `name` | text | required | الاسم |  |
| `phone` | text | required | الهاتف |  |
| `course` | relationship |  | الدورة المطلوبة | → `courses` |
| `courseOther` | text |  | دورة أخرى / غير متأكد |  |
| `message` | textarea |  | الرسالة |  |
| `marketingConsent` | checkbox |  | وافق على رسائل تسويقية | default: `false` |
| `status` | select | required | الحالة | `new` · `contacted` · `closed` default: `"new"` |
| `internalNotes` | textarea |  | ملاحظات داخلية |  |
| `locale` | select |  | لغة الصفحة | `ar` · `he` default: `"ar"` |
| `sourcePage` | text |  | من أي صفحة |  |
| `website` | text |  | Website |  |

### `users` — المستخدمون

Drafts: **no** · REST: `/api/users` · Local API: `payload.find({ collection: 'users', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `name` | text | required | الاسم |  |
| `roles` | select | required, many | الصلاحية | `admin` · `editor` default: `["editor"]` |
| `email` | email | required |  |  |
| `resetPasswordToken` | text |  |  |  |
| `resetPasswordExpiration` | date |  |  |  |
| `salt` | text |  |  |  |
| `hash` | text |  |  |  |
| `resetPasswordRequestedAt` | date |  |  |  |
| `loginAttempts` | number |  |  | default: `0` |
| `lockUntil` | date |  |  |  |
| `sessions` | array |  |  |  |
| `sessions[].expiresAt` | date | required |  |  |

## Globals

### `homepage` — الصفحة الرئيسية

Drafts: **yes** · REST: `/api/globals/homepage` · Local API: `payload.findGlobal({ slug: 'homepage', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `sections` | blocks |  | الأقسام | blocks: `hero` · `stats` · `courseGroups` · `featuredCourses` · `why` · `successStories` · `staff` · `videos` · `news` · `partners` · `employers` · `faq` · `register` · `gallery` |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |
| `_status` | select |  |  | `draft` · `published` (drafts are hidden from the public API) |

### `ui-texts` — نصوص الموقع الثابتة

Drafts: **no** · REST: `/api/globals/ui-texts` · Local API: `payload.findGlobal({ slug: 'ui-texts', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `otherLang` | text | 🌐 ar/he | زر تغيير اللغة |  |
| `a11y` | text | 🌐 ar/he | أدوات الوصولية |  |
| `nav` | group |  | كلمات القائمة |  |
| `nav.home` | text | 🌐 ar/he | الرئيسية |  |
| `nav.courses` | text | 🌐 ar/he | الدورات |  |
| `nav.allCourses` | text | 🌐 ar/he | كل الدورات |  |
| `nav.about` | text | 🌐 ar/he | عن الكلية |  |
| `nav.graduates` | text | 🌐 ar/he | الخريجون |  |
| `nav.gallery` | text | 🌐 ar/he | الصور والفيديو |  |
| `nav.news` | text | 🌐 ar/he | أخبار |  |
| `nav.employers` | text | 🌐 ar/he | للشركات والمشغّلين |  |
| `nav.contact` | text | 🌐 ar/he | اتصل بنا |  |
| `nav.faq` | text | 🌐 ar/he | أسئلة شائعة |  |
| `nav.staff` | text | 🌐 ar/he | الطاقم |  |
| `nav.menu` | text | 🌐 ar/he | زر القائمة (موبايل) |  |
| `nav.close` | text | 🌐 ar/he | زر الإغلاق |  |
| `pageTitles` | group |  | عناوين صفحات |  |
| `pageTitles.graduatesTitle` | text | 🌐 ar/he | عنوان صفحة الخريجين |  |
| `common` | group |  | أزرار وكلمات متكررة |  |
| `common.readMore` | text | 🌐 ar/he | اقرأ المزيد |  |
| `common.viewCourse` | text | 🌐 ar/he | تفاصيل الدورة |  |
| `common.allCourses` | text | 🌐 ar/he | شاهد كل الدورات |  |
| `common.contactUs` | text | 🌐 ar/he | تواصل معنا |  |
| `common.whatsapp` | text | 🌐 ar/he | واتساب (قصير) |  |
| `common.whatsappLong` | text | 🌐 ar/he | راسلنا على واتساب |  |
| `common.whatsappContact` | text | 🌐 ar/he | تواصل عبر واتساب |  |
| `common.call` | text | 🌐 ar/he | اتصل |  |
| `common.registerInterest` | text | 🌐 ar/he | سجّل اهتمامك |  |
| `common.hours` | text | 🌐 ar/he | كلمة «ساعة» (بطاقة الدورة) |  |
| `common.sessions` | text | 🌐 ar/he | كلمة «لقاء» (بطاقة الدورة) |  |
| `common.courseCount` | text | 🌐 ar/he | كلمة «دورات» (بعد العدد) |  |
| `common.evening` | text | 🌐 ar/he | الدوام على بطاقة الدورة |  |
| `common.nextStart` | text | 🌐 ar/he | الموعد القادم |  |
| `common.swipe` | text | 🌐 ar/he | اسحب لعرض المزيد (موبايل) |  |
| `stats` | group |  | أوصاف الأرقام |  |
| `stats.years` | text | 🌐 ar/he | سنة خبرة |  |
| `stats.courses` | text | 🌐 ar/he | دورة مهنية |  |
| `stats.groups` | text | 🌐 ar/he | مجالات تأهيل |  |
| `stats.partners` | text | 🌐 ar/he | جهات معتمِدة وشريكة |  |
| `stats.graduates` | text | 🌐 ar/he | خريج بالصور |  |
| `stats.alumni` | text | 🌐 ar/he | خريج |  |
| `trust` | array |  | نقاط قوة الكلية |  |
| `trust[].title` | text | 🌐 ar/he | العنوان |  |
| `trust[].text` | text | 🌐 ar/he | النص |  |
| `form` | group |  | استمارة «سجّل اهتمامك» |  |
| `form.name` | text | 🌐 ar/he | الاسم الكامل |  |
| `form.phone` | text | 🌐 ar/he | رقم الهاتف |  |
| `form.email` | text | 🌐 ar/he | البريد الإلكتروني (اختياري) |  |
| `form.course` | text | 🌐 ar/he | الدورة التي تهمّك |  |
| `form.courseSelect` | text | 🌐 ar/he | اختر دورة… |  |
| `form.courseAny` | text | 🌐 ar/he | لم أقرر بعد / استشارة عامة |  |
| `form.message` | text | 🌐 ar/he | ملاحظات (اختياري) |  |
| `form.submit` | text | 🌐 ar/he | زر الإرسال |  |
| `form.privacy` | text | 🌐 ar/he | جملة قصيرة فوق التنويه القانوني (اختياري) |  |
| `form.successTitle` | text | 🌐 ar/he | عنوان رسالة النجاح |  |
| `form.successText` | text | 🌐 ar/he | نص رسالة النجاح |  |
| `form.error` | text | 🌐 ar/he | رسالة خطأ (إذا لم يُرسَل الطلب) |  |
| `course` | group |  | صفحة الدورة |  |
| `course.contactForPrice` | text | 🌐 ar/he | جملة «للاستفسار عن الرسوم…» |  |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |

### `gallery` — معرض الصور والفيديو

Drafts: **no** · REST: `/api/globals/gallery` · Local API: `payload.findGlobal({ slug: 'gallery', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `title` | text | 🌐 ar/he | العنوان |  |
| `intro` | textarea | 🌐 ar/he | النص تحت العنوان |  |
| `images` | upload | many | الصور | → `media` |
| `videos` | array |  | فيديوهات |  |
| `videos[].title` | text | required, 🌐 ar/he | العنوان |  |
| `videos[].youtubeUrl` | text |  | رابط يوتيوب |  |
| `videos[].file` | upload |  | أو ملف فيديو | → `media` |
| `videos[].thumbnail` | upload |  | صورة الغلاف | → `media` |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |

### `site-settings` — معلومات الكلية

Drafts: **no** · REST: `/api/globals/site-settings` · Local API: `payload.findGlobal({ slug: 'site-settings', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `siteName` | text | required, 🌐 ar/he | اسم الكلية |  |
| `shortName` | text | 🌐 ar/he | اسم مختصر |  |
| `tagline` | text | 🌐 ar/he | شعار / جملة تعريف قصيرة |  |
| `city` | text | 🌐 ar/he | المدينة |  |
| `accreditation` | text | 🌐 ar/he | جملة الاعتماد |  |
| `foundedYear` | number |  | سنة التأسيس | default: `2008` |
| `logoLight` | upload |  | اللوغو — للخلفية الفاتحة | → `media` |
| `logoDark` | upload |  | اللوغو — للخلفية الغامقة | → `media` |
| `logoMark` | upload |  | رمز اللوغو فقط (اختياري) | → `media` |
| `favicon` | upload |  | أيقونة المتصفح (favicon) | → `media` |
| `contact` | group |  |  |  |
| `contact.phones` | array |  | أرقام الهاتف |  |
| `contact.phones[].label` | text | 🌐 ar/he | الوصف |  |
| `contact.phones[].number` | text | required | الرقم |  |
| `contact.phones[].showInHeader` | checkbox |  | يظهر أعلى الموقع | default: `false` |
| `contact.whatsapp` | text |  | رقم الواتساب |  |
| `contact.whatsappMessage` | text | 🌐 ar/he | رسالة الواتساب الجاهزة |  |
| `contact.email` | email |  | البريد الإلكتروني |  |
| `contact.address` | textarea | 🌐 ar/he | العنوان |  |
| `contact.mapUrl` | text |  | رابط الخريطة (Google Maps / Waze) |  |
| `contact.mapEmbedUrl` | text |  | رابط تضمين الخريطة (اختياري) |  |
| `contact.openingHours` | array |  | ساعات الدوام |  |
| `contact.openingHours[].days` | text | required, 🌐 ar/he | الأيام |  |
| `contact.openingHours[].hours` | text | required, 🌐 ar/he | الساعات |  |
| `social` | array |  | روابط السوشال ميديا |  |
| `social[].platform` | select | required | المنصّة | `facebook` · `instagram` · `tiktok` · `youtube` · `linkedin` · `x` · `telegram` · `other` |
| `social[].url` | text | required | الرابط |  |
| `seo` | group |  | إعدادات جوجل الافتراضية |  |
| `seo.titleTemplate` | text | 🌐 ar/he | قالب عنوان الصفحات |  |
| `seo.defaultTitle` | text | 🌐 ar/he | عنوان الصفحة الرئيسية في جوجل |  |
| `seo.defaultDescription` | textarea | 🌐 ar/he | وصف الموقع في جوجل |  |
| `seo.ogImage` | upload |  | صورة المشاركة الافتراضية | → `media` |
| `accessibility` | group |  | ممثّل الوصولية (רכז נגישות) |  |
| `accessibility.coordinatorName` | text | 🌐 ar/he | الاسم |  |
| `accessibility.coordinatorRole` | text | 🌐 ar/he | الوظيفة |  |
| `accessibility.coordinatorPhone` | text |  | الهاتف |  |
| `accessibility.coordinatorEmail` | email |  | البريد الإلكتروني |  |
| `accessibility.building` | textarea | 🌐 ar/he | وصولية مبنى الكلية |  |
| `accessibility.auditDate` | date |  | تاريخ آخر فحص وصولية للموقع |  |
| `privacy` | group |  | الخصوصية |  |
| `privacy.leadsRetentionMonths` | number |  | كم شهر منحتفظ بطلبات «سجّل اهتمامك» | default: `24` |
| `privacy.contactEmail` | email |  | إيميل طلبات الخصوصية |  |
| `leadsNotificationEmails` | array |  | إيميلات تستقبل الطلبات الجديدة |  |
| `leadsNotificationEmails[].email` | email | required | الإيميل |  |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |

### `navigation` — القائمة والتذييل

Drafts: **no** · REST: `/api/globals/navigation` · Local API: `payload.findGlobal({ slug: 'navigation', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `header` | group (tab) |  | القائمة العلوية |  |
| `header.items` | array |  | عناصر القائمة |  |
| `header.items[].label` | text | required, 🌐 ar/he | النص |  |
| `header.items[].link` | group |  | الرابط |  |
| `header.items[].link.type` | select |  | نوع الرابط | `anchor` · `page` · `course` · `courseGroup` · `whatsapp` · `phone` · `external` default: `"anchor"` |
| `header.items[].link.page` | select |  | الصفحة | `home` · `courses` · `about` · `gallery` · `success-stories` · `news` · `companies` · `contact` · `staff` · `faq` · `register` · `accessibility` |
| `header.items[].link.anchor` | text |  | اسم القسم |  |
| `header.items[].link.course` | relationship |  | الدورة | → `courses` |
| `header.items[].link.courseGroup` | relationship |  | المجال | → `course-groups` |
| `header.items[].link.url` | text |  | العنوان (URL) |  |
| `header.items[].link.whatsappMessage` | text | 🌐 ar/he | رسالة جاهزة للواتساب (اختياري) |  |
| `header.items[].link.newTab` | checkbox |  | يفتح في نافذة جديدة | default: `false` |
| `header.items[].children` | array |  | قائمة فرعية (اختياري) |  |
| `header.items[].children[].label` | text | required, 🌐 ar/he | النص |  |
| `header.items[].children[].link` | group |  | الرابط |  |
| `header.items[].children[].link.type` | select |  | نوع الرابط | `anchor` · `page` · `course` · `courseGroup` · `whatsapp` · `phone` · `external` default: `"anchor"` |
| `header.items[].children[].link.page` | select |  | الصفحة | `home` · `courses` · `about` · `gallery` · `success-stories` · `news` · `companies` · `contact` · `staff` · `faq` · `register` · `accessibility` |
| `header.items[].children[].link.anchor` | text |  | اسم القسم |  |
| `header.items[].children[].link.course` | relationship |  | الدورة | → `courses` |
| `header.items[].children[].link.courseGroup` | relationship |  | المجال | → `course-groups` |
| `header.items[].children[].link.url` | text |  | العنوان (URL) |  |
| `header.items[].children[].link.whatsappMessage` | text | 🌐 ar/he | رسالة جاهزة للواتساب (اختياري) |  |
| `header.items[].children[].link.newTab` | checkbox |  | يفتح في نافذة جديدة | default: `false` |
| `header.cta` | group |  | الزر البارز في القائمة |  |
| `header.cta.show` | checkbox |  | إظهار الزر | default: `true` |
| `header.cta.label` | text | 🌐 ar/he | نص الزر |  |
| `header.cta.link` | group |  | الرابط |  |
| `header.cta.link.type` | select |  | نوع الرابط | `anchor` · `page` · `course` · `courseGroup` · `whatsapp` · `phone` · `external` default: `"anchor"` |
| `header.cta.link.page` | select |  | الصفحة | `home` · `courses` · `about` · `gallery` · `success-stories` · `news` · `companies` · `contact` · `staff` · `faq` · `register` · `accessibility` |
| `header.cta.link.anchor` | text |  | اسم القسم |  |
| `header.cta.link.course` | relationship |  | الدورة | → `courses` |
| `header.cta.link.courseGroup` | relationship |  | المجال | → `course-groups` |
| `header.cta.link.url` | text |  | العنوان (URL) |  |
| `header.cta.link.whatsappMessage` | text | 🌐 ar/he | رسالة جاهزة للواتساب (اختياري) |  |
| `header.cta.link.newTab` | checkbox |  | يفتح في نافذة جديدة | default: `false` |
| `footer` | group (tab) |  | التذييل (أسفل الموقع) |  |
| `footer.about` | textarea | 🌐 ar/he | نبذة قصيرة |  |
| `footer.columns` | array |  | أعمدة الروابط |  |
| `footer.columns[].title` | text | required, 🌐 ar/he | عنوان العمود |  |
| `footer.columns[].links` | array |  | الروابط |  |
| `footer.columns[].links[].label` | text | required, 🌐 ar/he | النص |  |
| `footer.columns[].links[].link` | group |  | الرابط |  |
| `footer.columns[].links[].link.type` | select |  | نوع الرابط | `anchor` · `page` · `course` · `courseGroup` · `whatsapp` · `phone` · `external` default: `"anchor"` |
| `footer.columns[].links[].link.page` | select |  | الصفحة | `home` · `courses` · `about` · `gallery` · `success-stories` · `news` · `companies` · `contact` · `staff` · `faq` · `register` · `accessibility` |
| `footer.columns[].links[].link.anchor` | text |  | اسم القسم |  |
| `footer.columns[].links[].link.course` | relationship |  | الدورة | → `courses` |
| `footer.columns[].links[].link.courseGroup` | relationship |  | المجال | → `course-groups` |
| `footer.columns[].links[].link.url` | text |  | العنوان (URL) |  |
| `footer.columns[].links[].link.whatsappMessage` | text | 🌐 ar/he | رسالة جاهزة للواتساب (اختياري) |  |
| `footer.columns[].links[].link.newTab` | checkbox |  | يفتح في نافذة جديدة | default: `false` |
| `footer.contactTitle` | text | 🌐 ar/he | عنوان عمود «اتصل بنا» |  |
| `footer.copyright` | text | 🌐 ar/he | سطر الحقوق |  |
| `footer.bottomLinks` | array |  | روابط صغيرة أسفل الصفحة (اختياري) |  |
| `footer.bottomLinks[].label` | text | required, 🌐 ar/he | النص |  |
| `footer.bottomLinks[].link` | group |  | الرابط |  |
| `footer.bottomLinks[].link.type` | select |  | نوع الرابط | `anchor` · `page` · `course` · `courseGroup` · `whatsapp` · `phone` · `external` default: `"anchor"` |
| `footer.bottomLinks[].link.page` | select |  | الصفحة | `home` · `courses` · `about` · `gallery` · `success-stories` · `news` · `companies` · `contact` · `staff` · `faq` · `register` · `accessibility` |
| `footer.bottomLinks[].link.anchor` | text |  | اسم القسم |  |
| `footer.bottomLinks[].link.course` | relationship |  | الدورة | → `courses` |
| `footer.bottomLinks[].link.courseGroup` | relationship |  | المجال | → `course-groups` |
| `footer.bottomLinks[].link.url` | text |  | العنوان (URL) |  |
| `footer.bottomLinks[].link.whatsappMessage` | text | 🌐 ar/he | رسالة جاهزة للواتساب (اختياري) |  |
| `footer.bottomLinks[].link.newTab` | checkbox |  | يفتح في نافذة جديدة | default: `false` |
| `bilingualEdits` | json |  | النص باللغة الثانية |  |

## Blocks

### block `hero` — الواجهة (فيديو كبير)

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `video` | upload |  | الفيديو في الخلفية | → `media` |
| `poster` | upload |  | صورة الغلاف | → `media` |
| `badge` | text | 🌐 ar/he | الشارة الصغيرة |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `kicker` | text | 🌐 ar/he | الجملة الملوّنة تحت العنوان |  |
| `text` | textarea | 🌐 ar/he | النص التعريفي |  |
| `subtitle` | text | 🌐 ar/he | المدينة / سطر إضافي (اختياري) |  |
| `slogan` | text | 🌐 ar/he | الشعار (اختياري) |  |
| `whatsappButton` | text | 🌐 ar/he | نص زر الواتساب |  |
| `registerButton` | text | 🌐 ar/he | نص زر التسجيل |  |
| `coursesLink` | text | 🌐 ar/he | نص رابط الدورات |  |
| `scrollHint` | text | 🌐 ar/he | نص «اسحب للأسفل» |  |
| `showGroupsStrip` | checkbox |  | إظهار شريط مجالات التأهيل المتحرك | default: `true` |
| `anchor` | text |  | اسم القسم في الرابط | default: `"top"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `stats` — أرقام

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `items` | array |  | الأرقام |  |
| `items[].value` | number | required | الرقم |  |
| `items[].suffix` | text |  | بعد الرقم | default: `"+"` |
| `items[].label` | text | required, 🌐 ar/he | الوصف |  |
| `items[].anchor` | text |  | يأخذ إلى قسم |  |
| `anchor` | text |  | اسم القسم في الرابط | default: `"stats"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `courseGroups` — مجالات التأهيل

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `subtitle` | textarea | 🌐 ar/he | النص تحت العنوان |  |
| `swipeHint` | text | 🌐 ar/he | نص «اسحب لرؤية المزيد» |  |
| `groups` | relationship | many | المجالات المعروضة | → `course-groups` |
| `anchor` | text |  | اسم القسم في الرابط | default: `"fields"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `featuredCourses` — أبرز الدورات

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `allCoursesButton` | text | 🌐 ar/he | نص زر «كل الدورات» |  |
| `courses` | relationship | many | الدورات المعروضة | → `courses` |
| `anchor` | text |  | اسم القسم في الرابط | default: `"courses"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `why` — ليش كلية المركز؟

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `items` | array |  | النقاط |  |
| `items[].title` | text | required, 🌐 ar/he | العنوان |  |
| `items[].text` | textarea | 🌐 ar/he | النص |  |
| `image` | upload |  | الصورة | → `media` |
| `pills` | array |  | شارات فوق الصورة |  |
| `pills[].text` | text | required, 🌐 ar/he | النص |  |
| `badgeNumber` | text |  | الرقم في البطاقة العائمة |  |
| `badgeText` | text | 🌐 ar/he | النص تحت الرقم |  |
| `anchor` | text |  | اسم القسم في الرابط | default: `"why"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `successStories` — قصص نجاح

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `subtitle` | textarea | 🌐 ar/he | النص تحت العنوان |  |
| `videoLabel` | text | 🌐 ar/he | النص فوق اسم الخريج في الصورة |  |
| `stories` | relationship | many | القصص المعروضة (قديم — مش مستعمل) | → `success-stories` |
| `rotateSeconds` | number |  | كل كم ثانية تتبدّل القصة | default: `6.5` |
| `anchor` | text |  | اسم القسم في الرابط | default: `"graduates"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `staff` — طاقم الكلية

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `subtitle` | textarea | 🌐 ar/he | النص تحت العنوان |  |
| `members` | relationship | many | أعضاء الطاقم المعروضون | → `staff` |
| `anchor` | text |  | اسم القسم في الرابط | default: `"staff"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `videos` — فيديو الكلية

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `subtitle` | textarea | 🌐 ar/he | النص تحت العنوان |  |
| `promo` | group |  | الفيديو التعريفي الكبير |  |
| `promo.video` | upload |  | ملف الفيديو | → `media` |
| `promo.youtubeUrl` | text |  | أو رابط يوتيوب (بدل الملف) |  |
| `promo.poster` | upload |  | صورة الغلاف | → `media` |
| `promo.durationLabel` | text |  | مدة الفيديو |  |
| `promo.kind` | text | 🌐 ar/he | النوع |  |
| `promo.title` | text | 🌐 ar/he | عنوان الفيديو |  |
| `promo.subtitle` | text | 🌐 ar/he | سطر تحت العنوان |  |
| `promo.playLabel` | text | 🌐 ar/he | نص زر التشغيل (لقارئ الشاشة) |  |
| `reels` | array |  | فيديوهات قصيرة (ريلز) |  |
| `reels[].title` | text | required, 🌐 ar/he | العنوان |  |
| `reels[].poster` | upload |  | صورة الغلاف (طولية 9:16) | → `media` |
| `reels[].video` | upload |  | ملف الفيديو (اختياري) | → `media` |
| `reels[].durationLabel` | text |  | المدة |  |
| `reels[].course` | relationship |  | الدورة | → `courses` |
| `whatsappMessage` | text | 🌐 ar/he | بداية رسالة الواتساب من زر «تفاصيل الدورة» |  |
| `swipeHint` | text | 🌐 ar/he | نص «اسحب لريلز أكثر» (للموبايل) |  |
| `anchor` | text |  | اسم القسم في الرابط | default: `"video"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `news` — آخر الأخبار

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `count` | number |  | عدد الأخبار المعروضة | default: `3` |
| `anchor` | text |  | اسم القسم في الرابط | default: `"news"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `partners` — شركاء (لوغوهات)

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `partners` | relationship | many | الشركاء المعروضون | → `partners` |
| `anchor` | text |  | اسم القسم في الرابط | default: `"partners"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `employers` — للشركات والمشغّلين

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `text` | textarea | 🌐 ar/he | النص |  |
| `items` | array |  | الخدمات |  |
| `items[].title` | text | required, 🌐 ar/he | العنوان |  |
| `items[].text` | textarea | 🌐 ar/he | النص |  |
| `whatsappButton` | text | 🌐 ar/he | نص زر الواتساب |  |
| `hiringButton` | text | 🌐 ar/he | نص الزر الثاني |  |
| `hiringText` | textarea | 🌐 ar/he | نص «تبحث عن مهنيين؟» |  |
| `anchor` | text |  | اسم القسم في الرابط | default: `"employers"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `faq` — أسئلة شائعة

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `text` | textarea | 🌐 ar/he | النص تحت العنوان |  |
| `items` | array |  | الأسئلة |  |
| `items[].question` | text | required, 🌐 ar/he | السؤال |  |
| `items[].answer` | textarea | required, 🌐 ar/he | الجواب |  |
| `anchor` | text |  | اسم القسم في الرابط | default: `"faq"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `register` — استمارة «سجّل اهتمامك»

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `text` | textarea | 🌐 ar/he | النص |  |
| `showVoucherNote` | checkbox |  | إظهار سطر المنحة | default: `true` |
| `bullets` | array |  | نقاط إضافية (مع علامة ✓) |  |
| `bullets[].text` | text | required, 🌐 ar/he | النص |  |
| `whatsappButton` | text | 🌐 ar/he | نص زر الواتساب |  |
| `anchor` | text |  | اسم القسم في الرابط | default: `"register"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |

### block `gallery` — صور من الورشات

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `kicker` | text | 🌐 ar/he | العنوان الصغير فوق القسم |  |
| `title` | text | required, 🌐 ar/he | العنوان |  |
| `subtitle` | textarea | 🌐 ar/he | النص تحت العنوان |  |
| `count` | number |  | عدد الصور المعروضة | default: `10` |
| `anchor` | text |  | اسم القسم في الرابط | default: `"gallery"` |
| `hidden` | checkbox |  | إخفاء هذا القسم مؤقتاً | default: `false` |
| `blockName` | text |  | Block Name |  |
