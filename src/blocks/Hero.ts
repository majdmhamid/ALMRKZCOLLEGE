import type { Block } from 'payload'

import {
  imageField,
  localizedText,
  localizedTextarea,
  sectionSettings,
  titleField,
  videoField,
} from './shared'

/** Full-screen video at the top of the homepage (Option A, «Hero»). */
export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'الواجهة (فيديو كبير)', plural: 'الواجهة' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    videoField(
      'video',
      'الفيديو في الخلفية',
      'يعمل تلقائياً بدون صوت ويتكرر. يجب أن يكون قصيراً جداً (10–30 ثانية) ومضغوطاً — أقل من 5 ميغابايت إن أمكن.',
    ),
    imageField(
      'poster',
      'صورة الغلاف',
      'تظهر قبل أن يبدأ الفيديو، وعلى الأجهزة التي لا تشغّل الفيديو. يُفضّل لقطة من نفس الفيديو.',
    ),
    localizedText('badge', 'الشارة الصغيرة', 'مثال: «معتمدة من وزارة العمل · منذ 2008».'),
    titleField,
    localizedText('kicker', 'الجملة الملوّنة تحت العنوان'),
    localizedTextarea('text', 'النص التعريفي'),
    localizedText('subtitle', 'المدينة / سطر إضافي (اختياري)'),
    localizedText('slogan', 'الشعار (اختياري)', 'مثال: «اللي بإيدو صنعة بملك قلعة».'),
    {
      type: 'row',
      fields: [
        localizedText('whatsappButton', 'نص زر الواتساب', undefined, '33%'),
        localizedText('registerButton', 'نص زر التسجيل', undefined, '33%'),
        localizedText('coursesLink', 'نص رابط الدورات', undefined, '33%'),
      ],
    },
    localizedText('scrollHint', 'نص «اسحب للأسفل»'),
    {
      name: 'showGroupsStrip',
      label: 'إظهار شريط مجالات التأهيل المتحرك',
      type: 'checkbox',
      defaultValue: true,
    },
    sectionSettings('top'),
  ],
}
