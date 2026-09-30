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

### عربي وعبري جنب بعض بصفحة التعديل (2026-09-29)
طلب حسين: ما بدنا نبدّل «لغة المحتوى» ونرجع. كل خانة `text`/`textarea` عليها `localized: true` بتنعرض بعمودين (`src/admin/bilingual/`):
- `config.ts` — بيلف على كل الحقول (tabs/groups/arrays/blocks) وبيحط `BilingualField` كـ Field component، وبيزيد خانة مخفية `bilingualEdits` (json، `virtual` — بدون عمود وبدون migration) + afterChange hook.
- `BilingualField.tsx` — خانة Payload العادية للغة الحالية + خانة للغة الثانية. القيمة الثانية بتنقرأ بطلب واحد (`?locale=he&fallback-locale=none&draft=true`) وبتنكتب بـ `bilingualEdits` بعنوان ثابت برقم الصف (`sections.#<id>.title`، `paths.ts`) — ترتيب الصفوف ما بيخربط.
- مع الحفظ: afterChange بيحفظ اللغة الثانية بنفس الطلب ونفس الـ transaction (مسودة/نشر/حفظ تلقائي حسب الحفظ الأصلي). `req` بيرجع زي ما كان بعدها (`withSameReq`) — غير هيك الرد بيرجع بالعبري للفورم العربي. قواعد الكلية (سعر/تشغيل) بتفحص العبري كمان وبترفض كل الحفظ. نشر مع خانة عبرية إجبارية فاضية ← رسالة «النسخة العبرية ناقصة — عبّي: ...».
- `richText` (وصف كامل، نص الخبر، القصة) بضل بلغة وحدة: تحته زر «اكتبه بالعبري ←» (`RichTextNote.tsx`).
- الفحص: `tests/bilingual-paths.test.ts`؛ يدوياً: طاقم (بدون مسودات)، دورة (حفظ تلقائي + صف جديد بالمواضيع + نشر)، الصفحة الرئيسية (blocks)، إعدادات الموقع، سعر بالعبري ← 400 وما انحفظ ولا إشي.

### التعديل على البطاقات — كيف بيشتغل
- الحفظ عبر REST (`/api/<collection>/<id>?locale=..&draft=true`) بجلسة اللوحة؛ قواعد الكلية (`enforceContentRules`) بترفض السعر/وعد التشغيل وبتطلع الرسالة.
- الحفظ لكل بطاقة **بالدور** وبآخر قيمة (ما في طلبين متوازيين يخربطوا — كان في خلل هيك وانصلح).
- «انشر» على البطاقة = `publishDoc` (server action): بيقرأ آخر مسودة لكل لغة (بدون fallback) وبينشرها — نفس «نشر التغييرات» بصفحة التعديل.
- الصور بتنرفع لمكتبة الصور (`media`، الوصف الإجباري = الاسم) وبعدين بتنربط.
- **قصص النجاح بالرئيسية (2026-09-30):** قاعدة وحدة — منشورة + `featured` («اعرضها بالرئيسية»)، بترتيب `order` (`src/lib/home-stories.ts`). خانة «القصص المعروضة» بقسم الرئيسية مخفية ومش مستعملة (بدون migration؛ مكانها ملاحظة `StoriesPickNotice`)، وما في شرط «لازم اقتباس». البطاقة: زر «اعرضها بالرئيسية» + علامة الحالة (منشور مقابل آخر مسودة) + «انشر هلأ» + أسهم الترتيب. قصة معروضة بدها صورة (`validateFeatured`، بس عند النشر). الاختيار القديم انتقل مرة وحدة بـ`moveHomeStories` (`src/seed/run.ts`، علامة `almrkz:home-stories-featured`).
- محلياً على بورت غير 3000 لازم `NEXT_PUBLIC_SERVER_URL=http://localhost:<port>` — غير هيك حماية CSRF بترفض الحفظ (403).

### التوقيع الإلكتروني — قرارات الدمج
- **دخول واحد:** `getAdmin()` بيستعمل جلسة Payload. هوية المدير بجداول التوقيع = UUID ثابت من رقم مستخدم Payload (`server/admin-id.ts`)، وبينعمل له صف بـ `admin_profiles` لحاله. الملف `supabase/migrations/0003_payload_admins.sql` شال الربط مع `auth.users`.
- **التحديث الحي:** سؤال كل 3 ثواني لـ `/api/admin/live` (بدل Supabase Realtime اللي كان بدو دخول Supabase).
- **اللغة:** `src/proxy.ts` بيعلّم `/admin` و`/sign`؛ اللوحة عربي، والعميل حسب جواله (كوكي `admin_locale` بس للاختبارات بالعبري).
- **الأنماط:** أصناف Tailwind للتوقيع بدون إعادة ضبط عامة داخل اللوحة (`styles/admin.css`، محصورة بـ `.signing-scope`)؛ صفحة العميل فيها Tailwind كامل (`styles/public.css`).
- **بدون رقم هوية (30.9.2026، قرار حسين):** لا المدير ولا الموقّع بيكتبوا رقم هوية. الرابط (token عشوائي 256 bit، محفوظ كـ hash) هو اللي بيعرّف الموقّع: الرابط الشخصي بيفتح المستند مباشرة (`viewFor` ← `sign`، `canViewDocument`، `submitSignature` بدون جلسة)؛ الرابط المشترك بيطلب الاسم الكامل بس (`startShared` + `signerNameSchema`، كوكي موقّع لساعتين). نفس الاسم مسموح يوقّع أكثر من مرة (طالبين بنفس الاسم) — كل توقيع صف لحاله مع وقت/IP/جهاز. أعمدة `id_number_hash`/`id_number_last3` و`failed_attempts`/`locked` وجدول `shared_link_attempts` ضلّوا بالقاعدة (بدون migration) للمستندات القديمة، بس الكود ما عاد يكتبهم ولا بيقفل روابط.
- **وضع التجربة:** بدون `NEXT_PUBLIC_SUPABASE_URL` (ومش على Vercel) → PGlite وملفات بـ `.mock-data` (لـ `npm run dev` و`start-windows.bat`).

### «الفيديوهات والصور» — `/admin/media-slots` (2026-09-30)
شكوى حسين: «كيف نبدّل الفيديوهات؟ ولازم يكون واضح إنه هاد الفيديو لهاد المكان بالموقع».
- **مصدر واحد للأماكن:** `src/lib/media-slots.ts` (بدون قاعدة بيانات) بيلف على إعدادات حقول كل global/collection مع المحتوى المحفوظ وبيطلّع «مكان» لكل خانة `upload` لـ `media`: الاسم («الصفحة الرئيسية ← فيديو الكلية ← ريل ٢: … (الدورة: …)» من labels الـ blocks/groups/صفوف الـ array + اسم العلاقة)، المسار بالمحتوى (صفوف بالـ `id` مش بالترتيب)، فيديو + صورة الغلاف جنبه (`poster`/`videoPoster`/`thumbnail`) كبطاقة وحدة، المدة (`durationLabel`/`videoDuration`)، يوتيوب، ووين بالموقع (`OWNERS`: رابط الصفحة + anchor القسم من `sections[].anchor`). ريل/دورة/قسم جديد بيبين لحاله — ما في قائمة ثابتة. `src/lib/media-slots-server.ts` بيقرأ من القاعدة (بالدور، مش بالتوازي — الـ pool صغير).
- **الصفحة:** `src/admin/media-slots/` — `MediaSlotsView` (server، المسودة + المنشور لـ«لسا مش على الموقع») و`MediaSlotsHub` (client). التبديل: `useDocumentDrawer('media')` (نفس رفع المكتبة، الوصف معبّى باسم المكان) أو `useListDrawer` (فلتر فيديو/صورة) ← بالدور لكل صفحة: GET آخر مسودة (`?locale=ar&draft=true&depth=0`) ← `withMedia` ← POST/PATCH للخانة العليا بس (`sections` كاملة للـ global) مع `draft=true`. العبري بضل (الصفوف بتنطابق بالـ id) — فحصتها. «انشر» = `publishOwner` (`actions.ts`): collection ← `publishDoc`، global ← نفس المنطق (آخر مسودة لكل لغة ← published). «شوف مكانه» = `/next/preview?path=/ar#video` (draft mode). الكورس: `id="course-media"` بـ `pages.tsx`.
- **المكتبة:** خانة `ui` اسمها `usedIn` بـ `Media.ts` (بدون عمود بالقاعدة، بدون migration): عمود «مستعمل في» (server Cell، مشي واحد لكل الصفحة — `allMediaUsage` بيتذكّر 5 ثواني) + مربّع فوق صفحة الملف. `whereMediaIsUsed` (سؤال المسح + رفض السيرفر) صار يستعمل نفس المشي — نفس الأسماء.
- **صفحة الرئيسية:** صف الريل المسكّر «ريل ٢: … — دورة: … · 🎬 فيه فيديو» (`FieldExtras#ReelRowLabel`)، وكل `videoField` بيعرض الفيديو المختار صغير (`afterInput`).
- **الفحص:** `tests/media-slots.test.ts`؛ بالمتصفح: تبديل فيديو + غلاف ريل ٢ ← الموقع ما تغيّر ← «انشر» ← تغيّر؛ «شوف مكانه» ← `/ar#video`؛ «مستعمل في» + سؤال المسح؛ ريل جديد من الفورم ← بطاقة جديدة؛ غلاف دورة (PATCH + publishDoc).
- **ناقص:** الصفحة بالعربي بس (حتى لو اللوحة بالعبري)؛ صور داخل النص الطويل (خبر/قصة) بتنعدّ بـ«مستعمل في» بس ما بتتبدّل من هون؛ قوائم صور (معرض، صور دورة) بتتبدّل صورة صورة — الزيادة من صفحة التعديل.

## قاعدة بيانات وتخزين — مشروع Supabase واحد
- `DATABASE_URL` (Payload) و`SUPABASE_DB_URL` (التوقيع) = نفس Postgres تبع Supabase. أسماء الجداول ما بتتضارب (فحصتها).
- صور الموقع: Supabase Storage عبر S3 (`S3_*`، bucket عام `media`). ملفات التوقيع: buckets خاصة (`originals`، `finals`، `signatures`) عبر المفتاح السري.
- `npm run ci` (بناء Vercel): `scripts/check-env.mjs --if-vercel` (فحص المفاتيح + الاتصال بالقاعدة + دخول SMTP؛ بيوقّف البناء برسالة عربية) ← `payload migrate` ← `scripts/migrate.mjs --if-configured` (ملفات `supabase/migrations`) ← seed ← build. الـ seed بيعبّي محتوى التصميم **مرة وحدة بس** (أول نشر / قاعدة فاضية) وبيحفظ علامة `almrkz:design-seeded` بجدول `payload_kv`؛ بعدها بيعمل بس أول مدير (إذا ما في مستخدمين) — اللي بينحذف ما بيرجع. إعادة تعبئة مقصودة: `npx cross-env SEED_FORCE=1 npm run seed` (أو `SEED_FORCE_PAGES=1` لتعبئة الصفحات كمان).

## بروفة الإطلاق على Postgres حقيقي (2026-09-28) — قواعد لازم تضل
- **ممنوع push على Postgres.** `push` بيشتغل بس مع `PAYLOAD_DB_PUSH=true` (قاعدة تجربة بدون جداول التوقيع). السبب: drizzle push بيقارن كل القاعدة مع جداول Payload — على قاعدة فيها جداول التوقيع بيوقع (`there is no parameter $1`) أو بيعرض يمسح enums/جداول التوقيع، وبيترك سطر `dev` (batch -1) بـ `payload_migrations` اللي بيخلّي `payload migrate` يسأل سؤال وما حدا بيجاوب على Vercel (بيطلع 0 بدون ما يعمل migrate). `check:env` بيوقّف البناء إذا لقى هاد السطر.
- **أي تغيير بالحقول:** `npm run migrate:create <اسم>` وبعدين commit للملف بـ `src/migrations`. الفحص بالبروفة: `migrate:create` ← «No schema changes detected» (الـ migration الموجودة مطابقة للكود).
- **JSON كـ parameter بالتوقيع:** دايماً `$1::text::jsonb` مش `$1::jsonb` — postgres.js (الإنتاج) بيعمل JSON مرتين للنص، وPGlite (الاختبارات) لأ. كان خربان: حذف مستندات، حذف مواقع تواقيع، نقل لـ«נחתמו»، وكل `audit_events.details` كانت تنحفظ كنص. `tests/db-params.test.ts` بيحرس.
- **rate limit** (سجّل اهتمامك + صفحة التوقيع) عبر اتصال القاعدة المباشر (`select public.rate_limit_hit(...)`)، مش REST تبع Supabase — فـ Data API ممكن تنطفى.
- **الإيميل:** `skipVerify` (بدون اتصال SMTP بكل cold start)، `requireTLS` على 587 (Gmail/Resend)، بدون auth إذا ما في `SMTP_USER`. إيميل الطلب فيه نسخة نص + `tel:`؛ «نسيت كلمة السر» RTL (`Users.ts`).
- **Vercel:** `vercel.json` — منطقة `fra1` (جنب Supabase Frankfurt)، `ignoreCommand` بيبني بس Production (فروع كلود ما بتعمل migrate على القاعدة الحقيقية)، Cron يومي لـ `/api/payload-jobs/run` (النشر المجدول للأخبار؛ `CRON_SECRET`). على Pro: غيّر الـ schedule لـ `*/10 * * * *`. PGlite مستثنى من ملفات الـ functions (أكبر function ≈ 33MB من 250).
- **تجربة محلية:** Postgres حقيقي (embedded-postgres على 5433) + stubs لـ Supabase (`auth`، `storage.buckets`، أدوار `anon/authenticated/service_role`، `supabase_realtime`) — نفس اللي بـ `tests/migrations.test.ts`. التوقيع الحقيقي (مش mock) مع تخزين Supabase وهمي: `e2e-{sign,editor,finalize,admin}` ✓.

## الفحوصات (2026-09-27)
- `npm test`: 91 اختبار ✓ · `node scripts/e2e-{sign,editor,finalize,admin}.mjs http://localhost:<port>` ✓ (بدها `.mock-data` جديد)
- تعديل خريج على البطاقة → مسودة (الموقع ما تغيّر) → «انشر» → الموقع تغيّر ✓
- `tsc` ✓ · `eslint` ✓ · `npm run build` ✓

</div>
