import type { Field } from 'payload'

type LinkOptions = { name?: string; label?: string; required?: boolean }

/**
 * A link the editors can point to a course, a course group, a page of the site,
 * WhatsApp, a phone call or any web address.
 */
export const linkField = ({
  name = 'link',
  label = 'الرابط',
  required = false,
}: LinkOptions = {}): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    {
      name: 'type',
      label: 'نوع الرابط',
      type: 'select',
      defaultValue: 'page',
      required,
      options: [
        { label: 'صفحة من الموقع', value: 'page' },
        { label: 'دورة', value: 'course' },
        { label: 'مجموعة دورات', value: 'courseGroup' },
        { label: 'واتساب الكلية', value: 'whatsapp' },
        { label: 'اتصال بالهاتف', value: 'phone' },
        { label: 'رابط خارجي', value: 'external' },
      ],
    },
    {
      name: 'page',
      label: 'الصفحة',
      type: 'select',
      options: [
        { label: 'الرئيسية', value: 'home' },
        { label: 'كل الدورات', value: 'courses' },
        { label: 'عن الكلية', value: 'about' },
        { label: 'معرض الصور والفيديو', value: 'gallery' },
        { label: 'قصص نجاح الخريجين', value: 'success-stories' },
        { label: 'أخبار وإعلانات', value: 'news' },
        { label: 'للشركات والمشغّلين', value: 'companies' },
        { label: 'اتصل بنا', value: 'contact' },
        { label: 'استمارة سجّل اهتمامك', value: 'register' },
      ],
      admin: { condition: (_, sibling) => sibling?.type === 'page' },
    },
    {
      name: 'course',
      label: 'الدورة',
      type: 'relationship',
      relationTo: 'courses',
      admin: { condition: (_, sibling) => sibling?.type === 'course' },
    },
    {
      name: 'courseGroup',
      label: 'المجموعة',
      type: 'relationship',
      relationTo: 'course-groups',
      admin: { condition: (_, sibling) => sibling?.type === 'courseGroup' },
    },
    {
      name: 'url',
      label: 'العنوان (URL)',
      type: 'text',
      admin: {
        condition: (_, sibling) => sibling?.type === 'external',
        description: 'مثال: https://www.facebook.com/...',
      },
    },
    {
      name: 'whatsappMessage',
      label: 'رسالة جاهزة للواتساب (اختياري)',
      type: 'text',
      localized: true,
      admin: {
        condition: (_, sibling) => sibling?.type === 'whatsapp',
        description:
          'النص الذي يظهر جاهزاً عند فتح الواتساب. إذا تركته فارغاً تُستعمل الرسالة العامة من «إعدادات الموقع».',
      },
    },
    {
      name: 'newTab',
      label: 'يفتح في نافذة جديدة',
      type: 'checkbox',
      defaultValue: false,
      admin: { condition: (_, sibling) => sibling?.type === 'external' },
    },
  ],
})
