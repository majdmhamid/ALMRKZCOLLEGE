import type { Block } from 'payload'

import { validateYoutubeUrl } from '@/lib/youtube'

import {
  imageField,
  kickerField,
  localizedText,
  sectionSettings,
  subtitleField,
  titleField,
  videoField,
} from './shared'

/** «تعرّف على الكلية بالفيديو» — one promo video + short reels. */
export const VideosBlock: Block = {
  slug: 'videos',
  interfaceName: 'VideosBlock',
  labels: { singular: 'فيديو الكلية', plural: 'فيديو الكلية' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    subtitleField,
    {
      name: 'promo',
      label: 'الفيديو التعريفي الكبير',
      type: 'group',
      fields: [
        videoField(
          'video',
          'ملف الفيديو',
          'يُفضّل دقيقة واحدة تقريباً، MP4 مضغوط، أقل من 40 ميغابايت.',
        ),
        {
          name: 'youtubeUrl',
          label: 'أو رابط يوتيوب (بدل الملف)',
          type: 'text',
          validate: validateYoutubeUrl,
        },
        imageField('poster', 'صورة الغلاف', 'تظهر قبل الضغط على «تشغيل».'),
        {
          type: 'row',
          fields: [
            {
              name: 'durationLabel',
              label: 'مدة الفيديو',
              type: 'text',
              admin: { width: '30%', description: 'مثال: 1:00' },
            },
            localizedText('kind', 'النوع', 'مثال: «إعلان تعريفي».', '70%'),
          ],
        },
        localizedText('title', 'عنوان الفيديو'),
        localizedText('subtitle', 'سطر تحت العنوان'),
        localizedText('playLabel', 'نص زر التشغيل (لقارئ الشاشة)'),
      ],
    },
    {
      name: 'reels',
      label: 'فيديوهات قصيرة (ريلز)',
      type: 'array',
      labels: { singular: 'ريل', plural: 'ريلز' },
      maxRows: 8,
      // «ريل ٢: تركيب مكيفات — دورة: فني تكييف · 🎬 فيه فيديو» على الصف المسكّر
      admin: { initCollapsed: true, components: { RowLabel: '@/admin/media-slots/FieldExtras#ReelRowLabel' } },
      fields: [
        { name: 'title', label: 'العنوان', type: 'text', localized: true, required: true },
        imageField('poster', 'صورة الغلاف (طولية 9:16)'),
        videoField('video', 'ملف الفيديو (اختياري)', 'فيديو طولي قصير (15–30 ثانية)، MP4 مضغوط.'),
        {
          type: 'row',
          fields: [
            {
              name: 'durationLabel',
              label: 'المدة',
              type: 'text',
              admin: { width: '30%', description: 'مثال: 0:20' },
            },
            {
              name: 'course',
              label: 'الدورة',
              type: 'relationship',
              relationTo: 'courses',
              admin: {
                width: '70%',
                description: 'زر «تفاصيل الدورة» يفتح واتساب باسم هذه الدورة.',
              },
            },
          ],
        },
      ],
    },
    localizedText(
      'whatsappMessage',
      'بداية رسالة الواتساب من زر «تفاصيل الدورة»',
      'اسم الدورة يُضاف بعدها تلقائياً. مثال: «مرحبا، بدي تفاصيل عن: ».',
    ),
    localizedText('swipeHint', 'نص «اسحب لريلز أكثر» (للموبايل)'),
    sectionSettings('video'),
  ],
}
