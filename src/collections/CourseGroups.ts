import type { CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '@/access'
import { orderField } from '@/fields/order'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { enforceContentRules } from '@/hooks/enforceContentRules'
import { previewPath } from '@/lib/preview'

export const CourseGroups: CollectionConfig = {
  slug: 'course-groups',
  labels: { singular: 'مجال', plural: 'مجالات الدورات' },
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'order', '_status', 'updatedAt'],
    group: 'الدورات',
    description:
      'مجالات الدورات (مثل: الحديد واللحام، البناء والسلامة، التكييف). كل دورة تابعة لمجال واحد. ' +
      'المجال بيظهر على الموقع بس إذا فيه دورة منشورة وحدة على الأقل.',
    preview: (doc, { locale }) =>
      previewPath({ collection: 'course-groups', slug: doc?.slug as string, locale }),
  },
  defaultSort: 'order',
  access: {
    read: publishedOrStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  versions: { drafts: { autosave: { interval: 800 } }, maxPerDoc: 20 },
  fields: [
    {
      name: 'name',
      label: 'اسم المجال',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'shortName',
      label: 'اسم مختصر',
      type: 'text',
      localized: true,
      admin: { description: 'للأماكن الضيّقة. مثال: «اللحام» بدل «الحديد واللحام».' },
    },
    {
      name: 'tagline',
      label: 'جملة تعريف (على البطاقة)',
      type: 'text',
      localized: true,
      admin: { description: 'مثال: «مهنة مطلوبة في كل مصنع وورشة وموقع بناء».' },
    },
    {
      name: 'description',
      label: 'وصف أطول (لصفحة المجال)',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'image',
      label: 'صورة المجال',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
    },
    {
      name: 'icon',
      label: 'أيقونة',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
      admin: { description: 'رمز صغير يظهر في الدائرة البيضاء (PNG شفّاف أو SVG).' },
    },
    {
      name: 'courses',
      label: 'الدورات في هذا المجال',
      type: 'join',
      collection: 'courses',
      on: 'group',
      defaultSort: 'order',
      admin: { description: 'الدورة بتنضاف للمجال من صفحة الدورة نفسها (خانة «المجال»).' },
    },
    seoField,
    slugField('name'),
    orderField,
  ],
  hooks: { beforeValidate: [enforceContentRules] },
}
