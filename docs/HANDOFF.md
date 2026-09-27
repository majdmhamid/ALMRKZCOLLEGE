# ملف التسليم — وين وصلنا (2026-09-28)

> للمحادثة القادمة. تقرير الحالة الكامل (بالعربي، للمالكين):
> https://claude.ai/code/artifact/3ea01573-4f10-45d9-af32-58c38ec15767

---

## ✅ شو موجود

| الجزء | الوضع | التفاصيل |
|---|---|---|
| **الموقع العام** — التصميم A (Video Scroll)، عربي + عبري | جاهز | `src/app/(frontend)/[locale]/**` |
| **لوحة التحكم** (Payload) بشكل الموقع — التعديل مباشرة على نفس البطاقات | جاهزة | `docs/ADMIN.md`، دليل المالكين `docs/دليل-لوحة-التحكم.md` |
| **التوقيع الإلكتروني** جوّا نفس اللوحة (`/admin/documents`) + صفحة العميل `/sign/...` | جاهز | `src/features/signing/**`، `docs/ADMIN.md` |
| **تحسينات السرعة** للموقع العام (خطوط، صور، cache) | جاهزة | انبنت على `claude/site-speed` |
| **تشغيل محلي للمالكين** (`start-windows.bat` / `start-mac.command`) | جاهز | `شغّل-الموقع-على-جهازك.md` |
| **دليل الإطلاق** على Supabase + Vercel | جاهز | `docs/الإطلاق-على-الإنترنت.md` |

## 🌿 الفروع (2026-09-28)

- **كل الشغل اندمج بفرع رئيسي واحد: `claude/clever-heisenberg-waag9g`.** كل مهمة جديدة بفرع منه.
- نسخة احتياطية قبل الدمج: tag `backup/main-before-merge-2026-09-27`.
- فروع قديمة — **لا تبني عليها**:
  - `claude/almrkz-college-website-wzvy6c` (تصميم مرفوض)
  - `claude/unified-admin` (استُبدل بـ `claude/admin-v2`، اللي اندمج)
  - `claude/pdf-signing` (الكود تبعه صار جوّا الفرع الرئيسي)
  - 4 فروع صغيرة قديمة: `claude/awesome-thompson-04a1qi`، `claude/eager-gauss-4siz2s`، `claude/pensive-pascal-da3bpm`، `claude/zealous-bardeen-euoog0`
- اندمجوا وخلصوا: `claude/admin-v2`، `claude/site-speed`، `claude/compassionate-noether-g5lec6`.

## 🔧 شغل ماشي هلأ (فروع تصليحات من الرئيسي)

| الفرع | شو فيه |
|---|---|
| `claude/fix-content-rules` | قواعد المحتوى الثابتة |
| `claude/fix-seo-legal` | SEO والأمور القانونية |
| `claude/fix-media-forms` | الصور والاستمارات |
| `claude/fix-deploy-docs` | مفتاح `PAYLOAD_SECRET` بـ `npm run secrets`، دليل الإطلاق، تحديث التوثيق |

بعد ما يخلصوا: بيندمجوا بالفرع الرئيسي.

## ⏭️ الخطوة القادمة

1. **الإطلاق التجريبي** على Supabase + Vercel — حسب `docs/الإطلاق-على-الإنترنت.md` (رابط Vercel مؤقت، بدون الدومين).
   حساب المدير لازم ينعمل **قبل** ما حدا ياخد الرابط.
2. **المحتوى من مجد** — الأشياء اللي لازم يأكّدها (قصص الخريجين، الشهادات، الأرقام…): `docs/OPEN-ITEMS.md` بند 6.
3. **الحسابات والتسليم لمجد** (Supabase ← Owner، Vercel Pro بحسابه) — دليل الإطلاق البند ٨.
4. **الدومين `almrkz.net`** — القرار: منبعت للمبرمج السابق قبل الإطلاق بأسبوع.

## 📌 تذكير
- القواعد الثابتة (بدون ضمان تشغيل، بدون أسعار، صياغة المنح): `CLAUDE.md`.
- المالكين مش تقنيين: عربي بسيط، جداول، بدون أسئلة تقنية. صاحب الكلية اسمه **مجد**.
