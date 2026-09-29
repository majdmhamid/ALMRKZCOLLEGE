import type { GlobalConfig } from 'payload'

import { isStaff, publishedOrStaff } from '@/access'
import { homepageBlocks } from '@/blocks'
import { enforceContentRulesGlobal } from '@/hooks/enforceContentRules'
import { previewPath } from '@/lib/preview'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'الصفحة الرئيسية',
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    group: 'الصفحات',
    preview: (_doc, { locale }) => previewPath({ global: 'homepage', locale }),
    description:
      'أقسام الصفحة الرئيسية من الأعلى للأسفل. اسحب القسم (⋮⋮) لتغيير ترتيبه، أو علّم «إخفاء هذا القسم مؤقتاً»، أو أضف قسماً جديداً من الزر في الأسفل.',
  },
  // Visitors: only the published homepage. `?draft=true` on /api/globals/homepage used to hand
  // anyone the unpublished draft (autosaved while typing).
  access: { read: publishedOrStaff, update: isStaff },
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
