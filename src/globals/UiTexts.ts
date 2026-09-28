import type { Field, GlobalConfig } from 'payload'

import { anyone, isStaff } from '@/access'
import { enforceContentRulesGlobal } from '@/hooks/enforceContentRules'

type Spec = [name: string, label: string, description?: string]

const texts = (specs: Spec[]): Field[] =>
  specs.map(([name, label, description]) => ({
    name,
    label,
    type: 'text',
    localized: true,
    admin: description ? { description } : undefined,
  }))

const group = (name: string, label: string, specs: Spec[], description?: string): Field => ({
  name,
  label,
  type: 'group',
  admin: description ? { description } : undefined,
  fields: texts(specs),
})

/**
 * Small texts used all over the website: menu words, buttons, form labels…
 * (everything in the design's content.js that is not part of a homepage section).
 */
export const UiTexts: GlobalConfig = {
  slug: 'ui-texts',
  label: 'نصوص الموقع الثابتة',
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    group: 'الصفحات',
    description:
      'كلمات وأزرار تتكرر في كل الموقع: القائمة، الأزرار، الاستمارة… غيّر النص هنا فيتغيّر في كل مكان. ' +
      'نص المنحة وتنبيه التشغيل ثابتان ولا يُعدَّلان (قواعد الكلية).',
  },
  access: { read: anyone, update: isStaff },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'عام',
          fields: [
            ...texts([
              [
                'otherLang',
                'زر تغيير اللغة',
                'يظهر في النسخة العربية «עברית»، وفي العبرية «العربية».',
              ],
              ['a11y', 'أدوات الوصولية'],
            ]),
            group('nav', 'كلمات القائمة', [
              ['home', 'الرئيسية'],
              ['courses', 'الدورات'],
              ['allCourses', 'كل الدورات'],
              ['about', 'عن الكلية'],
              ['graduates', 'الخريجون'],
              ['gallery', 'الصور والفيديو'],
              ['news', 'أخبار'],
              ['employers', 'للشركات والمشغّلين'],
              ['contact', 'اتصل بنا'],
              ['faq', 'أسئلة شائعة'],
              ['staff', 'الطاقم'],
              ['menu', 'زر القائمة (موبايل)'],
              ['close', 'زر الإغلاق'],
            ]),
            group('pageTitles', 'عناوين صفحات', [['graduatesTitle', 'عنوان صفحة الخريجين']]),
          ],
        },
        {
          label: 'أزرار وكلمات',
          fields: [
            group('common', 'أزرار وكلمات متكررة', [
              ['readMore', 'اقرأ المزيد'],
              ['viewCourse', 'تفاصيل الدورة'],
              ['allCourses', 'شاهد كل الدورات'],
              ['contactUs', 'تواصل معنا'],
              ['whatsapp', 'واتساب (قصير)'],
              ['whatsappLong', 'راسلنا على واتساب'],
              ['whatsappContact', 'تواصل عبر واتساب'],
              ['call', 'اتصل'],
              ['registerInterest', 'سجّل اهتمامك'],
              ['hours', 'كلمة «ساعة» (بطاقة الدورة)'],
              ['sessions', 'كلمة «لقاء» (بطاقة الدورة)'],
              ['courseCount', 'كلمة «دورات» (بعد العدد)'],
              ['evening', 'الدوام على بطاقة الدورة', 'مثال: «مسائي · 17:00–21:00».'],
              ['nextStart', 'الموعد القادم'],
              ['swipe', 'اسحب لعرض المزيد (موبايل)'],
            ]),
            group(
              'stats',
              'أوصاف الأرقام',
              [
                ['years', 'سنة خبرة'],
                ['courses', 'دورة مهنية'],
                ['groups', 'مجالات تأهيل'],
                ['partners', 'جهات معتمِدة وشريكة'],
                ['graduates', 'خريج بالصور'],
                ['alumni', 'خريج'],
              ],
              'تستعملها صفحات الموقع الداخلية. أرقام الصفحة الرئيسية تُعدَّل من قسم «أرقام».',
            ),
          ],
        },
        {
          label: 'نقاط الثقة',
          fields: [
            {
              name: 'trust',
              label: 'نقاط قوة الكلية',
              type: 'array',
              labels: { singular: 'نقطة', plural: 'نقاط' },
              admin: {
                description:
                  'جمل قصيرة تظهر في أكثر من مكان (مثل: «منذ 2008»، «بإشراف وزارة العمل»).',
                components: { RowLabel: '@/admin/RowLabel#TitleRowLabel' },
              },
              fields: texts([
                ['title', 'العنوان'],
                ['text', 'النص'],
              ]),
            },
          ],
        },
        {
          label: 'الاستمارة',
          fields: [
            group('form', 'استمارة «سجّل اهتمامك»', [
              ['name', 'الاسم الكامل'],
              ['phone', 'رقم الهاتف'],
              ['email', 'البريد الإلكتروني (اختياري)'],
              ['course', 'الدورة التي تهمّك'],
              ['courseSelect', 'اختر دورة…'],
              ['courseAny', 'لم أقرر بعد / استشارة عامة'],
              ['message', 'ملاحظات (اختياري)'],
              ['submit', 'زر الإرسال'],
              ['privacy', 'جملة الخصوصية'],
              ['successTitle', 'عنوان رسالة النجاح'],
              ['successText', 'نص رسالة النجاح'],
              ['error', 'رسالة خطأ (إذا لم يُرسَل الطلب)'],
            ]),
          ],
        },
        {
          label: 'صفحة الدورة',
          fields: [
            group('course', 'صفحة الدورة', [
              [
                'contactForPrice',
                'جملة «للاستفسار عن الرسوم…»',
                'بدون أرقام وبدون أسعار — الأسعار لا تُعرض أبداً.',
              ],
            ]),
            {
              name: 'fixedRules',
              type: 'ui',
              admin: { components: { Field: '@/admin/RulesNote#RulesNote' } },
            },
          ],
        },
      ],
    },
  ],
  hooks: { beforeValidate: [enforceContentRulesGlobal] },
}
