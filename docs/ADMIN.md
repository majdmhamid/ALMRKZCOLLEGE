# لوحة التحكم — بهوية الموقع + التوقيع الإلكتروني

<div dir="rtl">

> 2026-09-27 · انبنى على الفرع `claude/admin-v2`، ومن 2026-09-28 صار جوّا الفرع الرئيسي `claude/clever-heisenberg-waag9g` (التصميم A).
> دليل الاستعمال لمجد وحسين: `docs/دليل-لوحة-التحكم.md`. الإطلاق خطوة بخطوة: `docs/الإطلاق-على-الإنترنت.md`.

## شو تغيّر

طلب حسين: لوحة بهوية الموقع، سهلة جداً، التعديل على **نفس بطاقة الموقع**، والتوقيع الإلكتروني ولوحة الموقع **صفحة وحدة**.
المحرّك بضل Payload (المسودات، الحفظ التلقائي، المعاينة الحيّة، النُّسخ، قواعد الكلية) — تغيّر الشكل وطريقة التعديل.

| الجزء | الملفات | ملاحظات |
|---|---|---|
| الشكل (أبيض/أخضر، Almarai، بطاقات ناعمة) | `src/app/(payload)/custom.scss`، `theme: 'light'` | ألوان Payload (`--color-base-*`، `--color-success-*`) صارت ألوان الكلية. الوضع الغامق مقفول |
| القائمة الجانبية | `src/admin/nav/*` | مجموعات + أيقونات + أعداد + تنبيه أحمر (طلبات جديدة، توقيعات جديدة). بتضلها مفتوحة على شاشات > 1024px (Payload بيسكّرها تحت 1440) |
| الرئيسية | `src/admin/dashboard/*` | ترحيب، المسودات اللي لسا ما انتشرت، آخر الطلبات، بلاطات بصور حقيقية |
| عرض البطاقات | `src/admin/cards/*` | بدل جدول القائمة لـ: خريجون، طاقم، شركاء، دورات، أخبار، مجالات (`CARD_VIEWS` بـ `payload.config.ts`). `?view=table` بيرجّع الجدول. داخل نوافذ الاختيار بضل الجدول |
| أنماط الموقع داخل اللوحة | `scripts/scope-site-css.mjs` ← `src/admin/site-scoped.css` | نسخة من `site.css` محصورة بـ `.site-scope` (بتتولّد لحالها مع predev/prebuild) |
| التوقيع الإلكتروني | `src/features/signing/**`، `src/admin/signing/views.tsx`، `src/app/(sign)/**` | صفحات Payload مخصّصة: `/admin/documents`، `/admin/documents/:id`، `/admin/signed`، `/admin/settings`. صفحة العميل `/sign/[token]` |

### التعديل على البطاقات — كيف بيشتغل
- الحفظ عبر REST (`/api/<collection>/<id>?locale=..&draft=true`) بجلسة اللوحة؛ قواعد الكلية (`enforceContentRules`) بترفض السعر/وعد التشغيل وبتطلع الرسالة.
- الحفظ لكل بطاقة **بالدور** وبآخر قيمة (ما في طلبين متوازيين يخربطوا — كان في خلل هيك وانصلح).
- «انشر» على البطاقة = `publishDoc` (server action): بيقرأ آخر مسودة لكل لغة (بدون fallback) وبينشرها — نفس «نشر التغييرات» بصفحة التعديل.
- الصور بتنرفع لمكتبة الصور (`media`، الوصف الإجباري = الاسم) وبعدين بتنربط.
- محلياً على بورت غير 3000 لازم `NEXT_PUBLIC_SERVER_URL=http://localhost:<port>` — غير هيك حماية CSRF بترفض الحفظ (403).

### التوقيع الإلكتروني — قرارات الدمج
- **دخول واحد:** `getAdmin()` بيستعمل جلسة Payload. هوية المدير بجداول التوقيع = UUID ثابت من رقم مستخدم Payload (`server/admin-id.ts`)، وبينعمل له صف بـ `admin_profiles` لحاله. الملف `supabase/migrations/0003_payload_admins.sql` شال الربط مع `auth.users`.
- **التحديث الحي:** سؤال كل 3 ثواني لـ `/api/admin/live` (بدل Supabase Realtime اللي كان بدو دخول Supabase).
- **اللغة:** `src/proxy.ts` بيعلّم `/admin` و`/sign`؛ اللوحة عربي، والعميل حسب جواله (كوكي `admin_locale` بس للاختبارات بالعبري).
- **الأنماط:** أصناف Tailwind للتوقيع بدون إعادة ضبط عامة داخل اللوحة (`styles/admin.css`، محصورة بـ `.signing-scope`)؛ صفحة العميل فيها Tailwind كامل (`styles/public.css`).
- **وضع التجربة:** بدون `NEXT_PUBLIC_SUPABASE_URL` (ومش على Vercel) → PGlite وملفات بـ `.mock-data` (لـ `npm run dev` و`start-windows.bat`).

## قاعدة بيانات وتخزين — مشروع Supabase واحد
- `DATABASE_URL` (Payload) و`SUPABASE_DB_URL` (التوقيع) = نفس Postgres تبع Supabase. أسماء الجداول ما بتتضارب (فحصتها).
- صور الموقع: Supabase Storage عبر S3 (`S3_*`، bucket عام `media`). ملفات التوقيع: buckets خاصة (`originals`، `finals`، `signatures`) عبر المفتاح السري.
- `npm run ci` (بناء Vercel): `payload migrate` ← `scripts/migrate.mjs --if-configured` (ملفات `supabase/migrations`) ← seed ← build. الـ seed بيعبّي محتوى التصميم **مرة وحدة بس** (أول نشر / قاعدة فاضية) وبيحفظ علامة `almrkz:design-seeded` بجدول `payload_kv`؛ بعدها بيعمل بس أول مدير (إذا ما في مستخدمين) — اللي بينحذف ما بيرجع. إعادة تعبئة مقصودة: `npx cross-env SEED_FORCE=1 npm run seed` (أو `SEED_FORCE_PAGES=1` لتعبئة الصفحات كمان).

## الفحوصات (2026-09-27)
- `npm test`: 91 اختبار ✓ · `node scripts/e2e-{sign,editor,finalize,admin}.mjs http://localhost:<port>` ✓ (بدها `.mock-data` جديد)
- تعديل خريج على البطاقة → مسودة (الموقع ما تغيّر) → «انشر» → الموقع تغيّر ✓
- `tsc` ✓ · `eslint` ✓ · `npm run build` ✓

</div>
