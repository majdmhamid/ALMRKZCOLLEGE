import type { GlobalConfig } from 'payload'

import { anyone, isStaff } from '@/access'
import { enforceContentRulesGlobal } from '@/hooks/enforceContentRules'
import { validateYoutubeUrl } from '@/lib/youtube'

export const Gallery: GlobalConfig = {
  slug: 'gallery',
  label: 'معرض الصور والفيديو',
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    group: 'الصفحات',
    description: 'صور حقيقية من الورشات والتدريبات، وفيديوهات يوتيوب. اسحب لتغيير الترتيب.',
  },
  access: { read: anyone, update: isStaff },
  fields: [
    {
      // «ظاهر بالموقع» أو ليش لأ — بدون عمود بالقاعدة (خانة عرض بس)
      name: 'siteState',
      type: 'ui',
      admin: { components: { Field: '@/admin/GallerySiteState#GallerySiteState' } },
    },
    { name: 'title', label: 'العنوان', type: 'text', localized: true },
    { name: 'intro', label: 'النص تحت العنوان', type: 'textarea', localized: true },
    {
      name: 'images',
      label: 'الصور',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      filterOptions: { mimeType: { contains: 'image' } },
    },
    {
      name: 'videos',
      label: 'فيديوهات',
      type: 'array',
      labels: { singular: 'فيديو', plural: 'فيديوهات' },
      admin: { initCollapsed: true, components: { RowLabel: '@/admin/RowLabel#TitleRowLabel' } },
      fields: [
        { name: 'title', label: 'العنوان', type: 'text', localized: true, required: true },
        {
          name: 'youtubeUrl',
          label: 'رابط يوتيوب',
          type: 'text',
          validate: validateYoutubeUrl,
          admin: { description: 'مثال: https://www.youtube.com/watch?v=c3PP4-TM3Y0' },
        },
        {
          name: 'file',
          label: 'أو ملف فيديو',
          type: 'upload',
          relationTo: 'media',
          filterOptions: { mimeType: { contains: 'video' } },
        },
        {
          name: 'thumbnail',
          label: 'صورة الغلاف',
          type: 'upload',
          relationTo: 'media',
          filterOptions: { mimeType: { contains: 'image' } },
        },
      ],
    },
  ],
  hooks: { beforeValidate: [enforceContentRulesGlobal] },
}
