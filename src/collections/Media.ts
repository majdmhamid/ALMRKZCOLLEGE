import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { anyone, isStaff } from '@/access'
import { enforceContentRules } from '@/hooks/enforceContentRules'

/** Above this size a video makes the site slow on phones. */
export const MAX_VIDEO_MB = 40
export const MAX_IMAGE_MB = 10

const webp = { format: 'webp' as const, options: { quality: 80 } }

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'صورة / فيديو', plural: 'الصور والفيديو' },
  admin: {
    group: 'الصور والفيديو',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    description:
      `🎬 الفيديو: يجب أن يكون قصيراً (يُفضّل أقل من دقيقة) ومضغوطاً — بصيغة MP4، وحجمه أقل من ${MAX_VIDEO_MB} ميغابايت. ` +
      'الفيديو الكبير يجعل الموقع بطيئاً جداً على الموبايل. للضغط استعمل برنامجاً مجانياً مثل HandBrake (اختيار «Fast 1080p30») أو موقع freeconvert.com. ' +
      `📷 الصور: JPG أو PNG أو WEBP، حتى ${MAX_IMAGE_MB} ميغابايت. الموقع يصغّرها تلقائياً.`,
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
      label: 'وصف الصورة / الفيديو',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description:
          'جملة قصيرة تصف ما يظهر (مثال: «طالب يتدرّب على اللحام في ورشة الكلية»). مهم لجوجل وللمكفوفين. اكتبها بالعربي وبالعبري.',
      },
    },
    {
      name: 'caption',
      label: 'تعليق يظهر تحت الصورة (اختياري)',
      type: 'text',
      localized: true,
    },
    {
      name: 'showInGallery',
      label: 'تظهر في «معرض الصور والفيديو»',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
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
