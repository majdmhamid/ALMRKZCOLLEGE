-- ============================================================================
-- المدراء صاروا مستخدمي لوحة التحكم (Payload) بدل مستخدمي Supabase Auth.
--
-- جداول التوقيع بتحفظ هوية المدير كـ UUID ثابت مشتق من رقم مستخدم Payload
-- (src/features/signing/server/admin-id.ts)، فما عاد في صف مقابل بـ auth.users.
-- منشيل الربط (foreign key) مع auth.users بس — الأعمدة والبيانات بتضل زي ما هي.
--
-- السيرفر بيحكي مع القاعدة بصلاحية كاملة (SUPABASE_DB_URL / service role)، والمتصفح
-- ما بيحكي مع Supabase أبداً، فسياسات RLS بتضل مقفولة على الكل (زي قبل) وما بتأثر.
-- ============================================================================

alter table public.admin_profiles drop constraint if exists admin_profiles_user_id_fkey;
alter table public.documents drop constraint if exists documents_created_by_fkey;
alter table public.signers drop constraint if exists signers_admin_user_id_fkey;
alter table public.audit_events drop constraint if exists audit_events_actor_user_id_fkey;
