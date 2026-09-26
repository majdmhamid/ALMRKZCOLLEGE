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

## Collections

### `courses` — الدورات

Drafts: **yes** · REST: `/api/courses` · Local API: `payload.find({ collection: 'courses', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `name` | text | required, 🌐 ar/he | اسم الدورة |  |
| `group` | relationship | required | المجموعة | → `course-groups` |
| `shortDescription` | textarea | required, 🌐 ar/he | وصف مختصر (للبطاقة) |  |
| `fullDescription` | richText | 🌐 ar/he | وصف كامل |  |
| `topics` | array |  | مواضيع الدورة |  |
| `topics[].topic` | text | required, 🌐 ar/he | الموضوع |  |
| `highlights` | array |  | مميزات بارزة (اختياري) |  |
| `highlights[].text` | text | required, 🌐 ar/he | النص |  |
| `duration` | text | required, 🌐 ar/he | مدة الدورة |  |
| `hours` | number |  | عدد الساعات |  |
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
| `_status` | select |  |  | `draft` · `published` (drafts are hidden from the public API) |

### `course-groups` — مجموعات الدورات

Drafts: **yes** · REST: `/api/course-groups` · Local API: `payload.find({ collection: 'course-groups', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `name` | text | required, 🌐 ar/he | اسم المجموعة |  |
| `description` | textarea | 🌐 ar/he | وصف قصير |  |
| `image` | upload |  | صورة المجموعة | → `media` |
| `icon` | upload |  | أيقونة (اختياري) | → `media` |
| `courses` | join |  | الدورات في هذه المجموعة | reverse of `courses.group` |
| `seo` | group |  | ظهور في جوجل (SEO) |  |
| `seo.title` | text | 🌐 ar/he | عنوان الصفحة في جوجل |  |
| `seo.description` | textarea | 🌐 ar/he | وصف قصير في جوجل |  |
| `seo.image` | upload |  | صورة المشاركة (واتساب/فيسبوك) | → `media` |
| `slug` | text |  | الرابط (slug) |  |
| `order` | number |  | الترتيب | default: `0` |
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
| `_status` | select |  |  | `draft` · `published` (drafts are hidden from the public API) |

### `success-stories` — قصص نجاح الخريجين

Drafts: **yes** · REST: `/api/success-stories` · Local API: `payload.find({ collection: 'success-stories', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `graduateName` | text | required, 🌐 ar/he | اسم الخريج/ة |  |
| `course` | relationship |  | الدورة التي أنهاها | → `courses` |
| `graduationYear` | number |  | سنة التخرّج |  |
| `photo` | upload |  | صورة الخريج/ة | → `media` |
| `quote` | textarea | required, 🌐 ar/he | اقتباس قصير (بكلماته) |  |
| `currentRole` | text | 🌐 ar/he | ماذا يعمل اليوم (اختياري) |  |
| `story` | richText | 🌐 ar/he | القصة الكاملة (اختياري) |  |
| `video` | upload |  | فيديو (اختياري) | → `media` |
| `featured` | checkbox |  | تظهر في الصفحة الرئيسية | default: `false` |
| `slug` | text |  | الرابط (slug) |  |
| `order` | number |  | الترتيب | default: `0` |
| `_status` | select |  |  | `draft` · `published` (drafts are hidden from the public API) |

### `media` — الصور والفيديو

Drafts: **no** · REST: `/api/media` · Local API: `payload.find({ collection: 'media', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `alt` | text | required, 🌐 ar/he | وصف الصورة / الفيديو |  |
| `caption` | text | 🌐 ar/he | تعليق يظهر تحت الصورة (اختياري) |  |
| `showInGallery` | checkbox |  | تظهر في «معرض الصور والفيديو» | default: `false` |
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

### `site-settings` — إعدادات الموقع

Drafts: **no** · REST: `/api/globals/site-settings` · Local API: `payload.findGlobal({ slug: 'site-settings', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `siteName` | text | required, 🌐 ar/he | اسم الكلية |  |
| `shortName` | text | 🌐 ar/he | اسم مختصر |  |
| `tagline` | text | 🌐 ar/he | شعار / جملة تعريف قصيرة |  |
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
| `leadsNotificationEmails` | array |  | إيميلات تستقبل الطلبات الجديدة |  |
| `leadsNotificationEmails[].email` | email | required | الإيميل |  |

### `navigation` — القائمة والتذييل

Drafts: **no** · REST: `/api/globals/navigation` · Local API: `payload.findGlobal({ slug: 'navigation', locale })`

| Field | Type | Flags | Label (admin) | Notes |
|---|---|---|---|---|
| `header` | group (tab) |  | القائمة العلوية |  |
| `header.items` | array |  | عناصر القائمة |  |
| `header.items[].label` | text | required, 🌐 ar/he | النص |  |
| `header.items[].link` | group |  | الرابط |  |
| `header.items[].link.type` | select |  | نوع الرابط | `page` · `course` · `courseGroup` · `whatsapp` · `phone` · `external` default: `"page"` |
| `header.items[].link.page` | select |  | الصفحة | `home` · `courses` · `about` · `gallery` · `success-stories` · `news` · `companies` · `contact` · `register` |
| `header.items[].link.course` | relationship |  | الدورة | → `courses` |
| `header.items[].link.courseGroup` | relationship |  | المجموعة | → `course-groups` |
| `header.items[].link.url` | text |  | العنوان (URL) |  |
| `header.items[].link.whatsappMessage` | text | 🌐 ar/he | رسالة جاهزة للواتساب (اختياري) |  |
| `header.items[].link.newTab` | checkbox |  | يفتح في نافذة جديدة | default: `false` |
| `header.items[].children` | array |  | قائمة فرعية (اختياري) |  |
| `header.items[].children[].label` | text | required, 🌐 ar/he | النص |  |
| `header.items[].children[].link` | group |  | الرابط |  |
| `header.items[].children[].link.type` | select |  | نوع الرابط | `page` · `course` · `courseGroup` · `whatsapp` · `phone` · `external` default: `"page"` |
| `header.items[].children[].link.page` | select |  | الصفحة | `home` · `courses` · `about` · `gallery` · `success-stories` · `news` · `companies` · `contact` · `register` |
| `header.items[].children[].link.course` | relationship |  | الدورة | → `courses` |
| `header.items[].children[].link.courseGroup` | relationship |  | المجموعة | → `course-groups` |
| `header.items[].children[].link.url` | text |  | العنوان (URL) |  |
| `header.items[].children[].link.whatsappMessage` | text | 🌐 ar/he | رسالة جاهزة للواتساب (اختياري) |  |
| `header.items[].children[].link.newTab` | checkbox |  | يفتح في نافذة جديدة | default: `false` |
| `header.cta` | group |  | الزر البارز في القائمة |  |
| `header.cta.show` | checkbox |  | إظهار الزر | default: `true` |
| `header.cta.label` | text | 🌐 ar/he | نص الزر |  |
| `header.cta.link` | group |  | الرابط |  |
| `header.cta.link.type` | select |  | نوع الرابط | `page` · `course` · `courseGroup` · `whatsapp` · `phone` · `external` default: `"page"` |
| `header.cta.link.page` | select |  | الصفحة | `home` · `courses` · `about` · `gallery` · `success-stories` · `news` · `companies` · `contact` · `register` |
| `header.cta.link.course` | relationship |  | الدورة | → `courses` |
| `header.cta.link.courseGroup` | relationship |  | المجموعة | → `course-groups` |
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
| `footer.columns[].links[].link.type` | select |  | نوع الرابط | `page` · `course` · `courseGroup` · `whatsapp` · `phone` · `external` default: `"page"` |
| `footer.columns[].links[].link.page` | select |  | الصفحة | `home` · `courses` · `about` · `gallery` · `success-stories` · `news` · `companies` · `contact` · `register` |
| `footer.columns[].links[].link.course` | relationship |  | الدورة | → `courses` |
| `footer.columns[].links[].link.courseGroup` | relationship |  | المجموعة | → `course-groups` |
| `footer.columns[].links[].link.url` | text |  | العنوان (URL) |  |
| `footer.columns[].links[].link.whatsappMessage` | text | 🌐 ar/he | رسالة جاهزة للواتساب (اختياري) |  |
| `footer.columns[].links[].link.newTab` | checkbox |  | يفتح في نافذة جديدة | default: `false` |
| `footer.copyright` | text | 🌐 ar/he | سطر الحقوق |  |
| `footer.bottomLinks` | array |  | روابط صغيرة أسفل الصفحة (اختياري) |  |
| `footer.bottomLinks[].label` | text | required, 🌐 ar/he | النص |  |
| `footer.bottomLinks[].link` | group |  | الرابط |  |
| `footer.bottomLinks[].link.type` | select |  | نوع الرابط | `page` · `course` · `courseGroup` · `whatsapp` · `phone` · `external` default: `"page"` |
| `footer.bottomLinks[].link.page` | select |  | الصفحة | `home` · `courses` · `about` · `gallery` · `success-stories` · `news` · `companies` · `contact` · `register` |
| `footer.bottomLinks[].link.course` | relationship |  | الدورة | → `courses` |
| `footer.bottomLinks[].link.courseGroup` | relationship |  | المجموعة | → `course-groups` |
| `footer.bottomLinks[].link.url` | text |  | العنوان (URL) |  |
| `footer.bottomLinks[].link.whatsappMessage` | text | 🌐 ar/he | رسالة جاهزة للواتساب (اختياري) |  |
| `footer.bottomLinks[].link.newTab` | checkbox |  | يفتح في نافذة جديدة | default: `false` |
