import type { GlobalConfig } from 'payload'

import { anyone, isStaff } from '@/access'
import { homepageBlocks } from '@/blocks'
import { enforceContentRulesGlobal } from '@/hooks/enforceContentRules'
import { previewPath } from '@/lib/preview'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'الصفحة الرئيسية',
  admin: {
    group: 'الصفحات',
    preview: (_doc, { locale }) => previewPath({ global: 'homepage', locale }),
    description:
      'أقسام الصفحة الرئيسية من الأعلى للأسفل. اسحب القسم (⋮⋮) لتغيير ترتيبه، أو علّم «إخفاء هذا القسم مؤقتاً»، أو أضف قسماً جديداً من الزر في الأسفل.',
  },
  access: { read: anyone, update: isStaff },
  versions: { drafts: { autosave: { interval: 800 } }, max: 30 },
  fields: [
    {
      name: 'sections',
      label: 'الأقسام',
      labels: { singular: 'قسم', plural: 'أقسام' },
      type: 'blocks',
      blocks: homepageBlocks,
      admin: { initCollapsed: true },
    },
  ],
  hooks: { beforeValidate: [enforceContentRulesGlobal] },
}
