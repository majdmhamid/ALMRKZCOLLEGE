import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

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
    {
      // «ظاهر بالموقع» / «مخفي: …» — بدون عمود بالقاعدة (خانة عرض بس)
      name: 'siteState',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '@/admin/GroupSiteState#GroupSiteState' },
      },
    },
    slugField('name'),
    orderField,
  ],
  hooks: {
    beforeValidate: [enforceContentRules],
    // حذف مجال فيه دورات كان يخلّي الدورات بدون مجال (بتختفي من صفحات المجالات، وما بتنحفظ
    // بعدها لأن «المجال» إجباري). لازم تنقلها لمجال ثاني أول.
    beforeDelete: [
      async ({ id, req }) => {
        // المنشور والمسودة الأخيرة — الاثنين لازم ما يأشّروا على هالمجال
        const found = new Map<number, string>()
        for (const draft of [false, true]) {
          const { docs } = await req.payload.find({
            collection: 'courses',
            where: { group: { equals: id } },
            draft,
            depth: 0,
            limit: 100,
            pagination: false,
            locale: 'ar',
            req,
            overrideAccess: true,
          })
          for (const c of docs) found.set(c.id, c.name || 'دورة بدون اسم')
        }
        if (!found.size) return
        const names = [...found.values()].slice(0, 5).map((n) => `«${n}»`).join('، ')
        throw new APIError(
          `ما بنقدر نحذف المجال — فيه ${found.size === 1 ? 'دورة' : `${found.size} دورات`}: ${names}${found.size > 5 ? '…' : ''}. ` +
            'افتح كل دورة وغيّر خانة «المجال» لمجال ثاني (أو احذف الدورة)، وبعدين احذف المجال.',
          400,
          undefined,
          true,
        )
      },
    ],
  },
}
