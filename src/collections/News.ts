import type { CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '@/access'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { enforceContentRules } from '@/hooks/enforceContentRules'
import { previewPath } from '@/lib/preview'

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'خبر / إعلان', plural: 'أخبار وإعلانات' },
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'publishedAt', '_status'],
    group: 'أخبار وقصص',
    preview: (doc, { locale }) =>
      previewPath({ collection: 'news', slug: doc?.slug as string, locale }),
  },
  defaultSort: '-publishedAt',
  access: {
    read: publishedOrStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  versions: { drafts: { autosave: { interval: 800 }, schedulePublish: true }, maxPerDoc: 20 },
  fields: [
    { name: 'title', label: 'العنوان', type: 'text', localized: true, required: true },
    {
      name: 'kind',
      label: 'النوع',
      type: 'select',
      defaultValue: 'news',
      required: true,
      options: [
        { label: 'خبر', value: 'news' },
        { label: 'إعلان (مثل: فتح تسجيل لدورة)', value: 'announcement' },
        { label: 'فعالية', value: 'event' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      label: 'تاريخ النشر',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
      },
    },
    {
      name: 'pinned',
      label: 'تثبيت في الأعلى',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    { name: 'excerpt', label: 'ملخّص قصير', type: 'textarea', localized: true, maxLength: 300 },
    {
      name: 'coverImage',
      label: 'الصورة الرئيسية',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
    },
    { name: 'content', label: 'النص الكامل', type: 'richText', localized: true },
    {
      name: 'gallery',
      label: 'صور وفيديو إضافي',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'relatedCourses',
      label: 'دورات متعلقة',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
    },
    seoField,
    slugField('title'),
  ],
  hooks: { beforeValidate: [enforceContentRules] },
}
