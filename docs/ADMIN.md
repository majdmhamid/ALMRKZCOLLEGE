# لوحة التحكم — `/admin`

<div dir="rtl">

## الفكرة باختصار

| | |
|---|---|
| **وين** | `almrkz.net/admin` (محلياً: `http://localhost:3000/admin`) |
| **مين** | حساب مدير على Supabase (نفس حساب التوقيع) — `npm run admin:create`. بوضع التجربة: الدخول معبّى لحاله |
| **شو فيها** | **التوقيع الإلكتروني** (المستندات، الموقّعة، الإعدادات) + كل محتوى الموقع: الدورات والمجالات، الخريجون، الأخبار، معرض الصور، الفيديوهات، الطاقم، الشركاء، معلومات الكلية، وكل نصوص الموقع — بالعربي والعبري |
| **كيف** | على نفس بطاقات الموقع (الخريجون، الطاقم، الشركاء، الصور)، أو استمارة وجنبها معاينة حيّة للصفحة (دورة، خبر، مجال) |
| **النشر** | كل تعديل بينحفظ **كمسودة** فوراً. الزوار ما بشوفوه إلا بعد زر **«نشر»**. كل نشر بينحفظ بـ«سجل النشر» وبتقدر ترجع لأي نسخة |

## قواعد الكلية مبنية جوّا اللوحة
- أي نص فيه وعد بتشغيل («ضمان تشغيل»، «شغل مضمون»، «הבטחת תעסוקה»...) بيظهر تحته تحذير أحمر، و**النشر بيتوقف** لحد ما ينصلّح.
- نفس الشي لأي سعر (₪، شيكل، ש"ח).
- المنحة: مفتاح نعم/لا بس — الصياغة ثابتة.
- عنصر بدون اسم عربي أو بدون صورة ما بينتشر.

## خريطة الكود (للمبرمج)

```
src/lib/cms/
  schema.ts     شكل المحتوى (SiteContent) — مسودة + منشور
  defaults.ts   المحتوى الأصلي من content/*.ts + دمج المفاتيح الناقصة
  store.ts      التخزين: Supabase (جدولين + bucket site-media) أو ملفات .cms-data محلياً
  content.ts    getContent(): المنشور للزوار (مخزّن، وسم site-content)، والمسودة بوضع المعاينة (draftMode)
  diff.ts       مقارنة المسودة بالمنشور (عدّاد التغييرات، شارات جديد/معدّل، ملخص النشر)
  rules.ts      قواعد الكلية (ضمان تشغيل، أسعار، عناصر ناقصة)
  auth.ts       الدخول — يعتمد على دخول التوقيع (Supabase + admin_profiles)
src/lib/site-data.ts   buildSiteData(content) — نفس الدوال للموقع وللمعاينة الحيّة باللوحة
src/lib/data.ts        getSiteData() للصفحات
src/components/cards.tsx, CourseDetail.tsx, NewsArticle.tsx   بطاقات/صفحات مشتركة بين الموقع واللوحة
src/app/admin/         اللوحة: (panel)/… الصفحات، _components، _lib/store.tsx (حفظ تلقائي كمسودة)
src/app/admin/preview  تشغيل/إيقاف «معاينة على الموقع» (Draft Mode)
supabase/migrations/0010_site_cms.sql   الجداول والـ bucket
```

- الصفحات العامة ما زالت **ثابتة وسريعة** (SSG). زر «نشر» بيعمل `updateTag('site-content')` + `revalidatePath('/', 'layout')` فتتجدد.
- بدون Supabase: التخزين بمجلد `.cms-data/` (خارج git) — للتجربة المحلية فقط (Vercel ما بيحفظ ملفات).
- الصور بتتصغّر بالمتصفح ثم بـ sharp على الخادم وبتتحوّل WebP. الفيديو بيترفع مباشرة من المتصفح لـ Supabase (رابط موقّع) لأنه أكبر من حد الطلبات.

## التوقيع الإلكتروني (مدموج — 2026-09-27)
كان تطبيقاً منفصلاً بمجلد `signing/`، وصار جزءاً من نفس التطبيق:

```
src/features/signing/      المكتبة: components, lib, server (db, repo, services, storage), i18n, messages (ar/he)
src/app/admin/(panel)/documents|signed|settings   صفحات التوقيع داخل نفس اللوحة
src/app/sign/[token]/      صفحة العميل (layout خاص، بدون ترويسة الموقع)
src/app/api/admin/live     تحديثات حيّة بوضع التجربة · src/app/api/mock-storage
src/proxy.ts               جلسة Supabase لـ /admin + يعلّم /sign حتى تنختار اللغة
supabase/migrations/       0001–0002 التوقيع · 0010 محتوى الموقع
tests/ + vitest.config.mts 91 اختبار (PGlite) · scripts/e2e-*.mjs اختبارات متصفح
```

- اللغة: اللوحة بالعربي دائماً؛ صفحة `/sign` حسب لغة جوال العميل (عربي/عبري). next-intl بدون توجيه باللغة.
- وضع التجربة: `MOCK_BACKEND=1` أو تلقائياً على جهاز التطوير بدون Supabase (`src/lib/backend-mode.ts`).
- pdf.js: `scripts/copy-pdf-worker.mjs` بينسخ الملفات لـ `public/pdfjs` (بالتثبيت والتشغيل والبناء). لوحة PDF لازم `dir="ltr"`.
- اختبارات المتصفح: `npm run dev:mock` ثم `node scripts/e2e-sign.mjs` (وكمان editor / finalize / admin) — بتحتاج `.mock-data` جديد.
- تعليمات التشغيل خطوة بخطوة: `docs/SIGNING-SETUP.md`.

## التشغيل على الموقع الحقيقي
1. مشروع Supabase واحد ← `npm run db:migrate` (بيطبّق 0001، 0002، 0010 بالترتيب) ← `npm run admin:create`.
2. بإعدادات Vercel: كل المفاتيح بـ `.env.example` (Supabase + المفاتيح السرّية) — التفاصيل في `docs/SIGNING-SETUP.md`.
3. أول دخول: اللوحة بتبدأ من المحتوى الحالي للموقع — ما في إشي بينمسح.

</div>
