import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { text } from 'payload/shared'

import { anyone, isStaff } from '@/access'
import { bi } from '@/admin/i18n'
import { enforceContentRules } from '@/hooks/enforceContentRules'
import { mediaInUseEndpoint, refuseDeletingUsedMedia } from '@/hooks/mediaInUse'

/** Above this size a video makes the site slow on phones. */
export const MAX_VIDEO_MB = 40
export const MAX_IMAGE_MB = 10

const webp = { format: 'webp' as const, options: { quality: 80 } }

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: bi('صورة / فيديو', 'תמונה / וידאו'), plural: bi('مكتبة الصور والفيديو', 'ספריית תמונות ווידאו') },
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    group: 'الصور والفيديو',
    // بدون «MIME Type» والحجم بالبايت — مش مفهومين
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    listSearchableFields: ['filename', 'alt'],
    description: bi(
      `🎬 الفيديو: يجب أن يكون قصيراً (يُفضّل أقل من دقيقة) ومضغوطاً — بصيغة MP4، وحجمه أقل من ${MAX_VIDEO_MB} ميغابايت. ` +
        'الفيديو الكبير يجعل الموقع بطيئاً جداً على الموبايل. للضغط استعمل برنامجاً مجانياً مثل HandBrake (اختيار «Fast 1080p30») أو موقع freeconvert.com. ' +
        `📷 الصور: JPG أو PNG أو WEBP، حتى ${MAX_IMAGE_MB} ميغابايت. الموقع يصغّرها تلقائياً.`,
      `🎬 וידאו: קצר (עדיף פחות מדקה) ודחוס — MP4, עד ${MAX_VIDEO_MB} מגה-בייט. ` +
        'וידאו גדול מאט מאוד את האתר בטלפון. לדחיסה: תוכנה חינמית כמו HandBrake («Fast 1080p30») או האתר freeconvert.com. ' +
        `📷 תמונות: JPG, PNG או WEBP, עד ${MAX_IMAGE_MB} מגה-בייט. האתר מקטין אותן לבד.`,
    ),
  },
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime'],
    focalPoint: true,
    adminThumbnail: 'thumbnail',
    // Resized copies in WebP (small + fast). The original file is kept as uploaded
    // (only shrunk if huge), so logos and SVGs are never altered.
    resizeOptions: { width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true },
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre', formatOptions: webp },
      { name: 'card', width: 800, height: 600, position: 'centre', formatOptions: webp },
      { name: 'wide', width: 1600, formatOptions: webp },
      { name: 'hero', width: 2400, formatOptions: webp },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: bi('وصف الصورة / الفيديو', 'תיאור התמונה / הווידאו'),
      type: 'text',
      localized: true,
      required: true,
      // رسالة واضحة بدل «هذا الحقل مطلوب»
      validate: (value: string | null | undefined, args: Parameters<typeof text>[1]) => {
        const result = text(value, args)
        if (result === true || String(value ?? '').trim()) return result
        return args.req?.i18n?.language === 'he'
          ? 'כתבו משפט קצר מה רואים בתמונה (למשל: «סטודנט מתאמן בריתוך בסדנה») — בלעדיו התמונה לא נשמרת.'
          : 'اكتب جملة قصيرة شو بالصورة (مثلاً: «طالب بيتدرّب على اللحام بالورشة») — بدونها الصورة ما بتنحفظ.'
      },
      admin: {
        description: bi(
          'جملة قصيرة تصف ما يظهر (مثال: «طالب يتدرّب على اللحام في ورشة الكلية»). مهم لجوجل وللمكفوفين. اكتبها بالعربي وبالعبري.',
          'משפט קצר שמתאר מה רואים (למשל: «סטודנט מתאמן בריתוך בסדנת המכללה»). חשוב לגוגל ולעיוורים. כתבו אותו בערבית ובעברית.',
        ),
      },
    },
    {
      // Which design file this came from (filled by the seed script only).
      name: 'sourceFile',
      type: 'text',
      index: true,
      admin: { hidden: true },
    },
    {
      name: 'caption',
      label: bi('تعليق يظهر تحت الصورة (اختياري)', 'כיתוב מתחת לתמונה (לא חובה)'),
      type: 'text',
      localized: true,
    },
  ],
  // «هاي الصورة مستعملة بـ …، متأكد؟» before deleting (src/admin/MediaDeleteGuard.tsx)
  endpoints: [mediaInUseEndpoint],
  hooks: {
    // A picture still shown on the site is deleted only after that «yes» (it vanished silently before)
    beforeDelete: [refuseDeletingUsedMedia],
    beforeValidate: [enforceContentRules],
    beforeChange: [
      ({ data }) => {
        const size = typeof data.filesize === 'number' ? data.filesize / (1024 * 1024) : 0
        const isVideo = typeof data.mimeType === 'string' && data.mimeType.startsWith('video/')
        const limit = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB
        if (size > limit) {
          throw new APIError(
            isVideo
              ? `الفيديو كبير جداً (${size.toFixed(0)} ميغابايت). الحد الأقصى ${MAX_VIDEO_MB} ميغابايت — اضغطه أولاً (مثلاً ببرنامج HandBrake) أو قصّره ثم ارفعه من جديد.`
              : `الصورة كبيرة جداً (${size.toFixed(0)} ميغابايت). الحد الأقصى ${MAX_IMAGE_MB} ميغابايت.`,
            400,
            undefined,
            true,
          )
        }
        return data
      },
    ],
  },
}
