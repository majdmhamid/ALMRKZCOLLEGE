-- ============================================================================
-- لوحة التحكم بمحتوى الموقع (CMS)
--
-- جزء من نفس تسلسل ملفات نظام التوقيع (signing/supabase/migrations) —
-- الرقم 0010 مقصود حتى يضل مكان لملفات التوقيع 0003–0009.
-- عند دمج نظام التوقيع داخل الموقع ينتقل هذا الملف لنفس المجلد.
--
-- site_content: صفّان فقط — 'draft' (المسودة) و 'published' (ما يراه الزوار).
-- site_releases: نسخة كاملة عن كل نشر (سجل النشر / الرجوع لنسخة قديمة).
-- الخادم يقرأ ويكتب بمفتاح service role؛ RLS للمدراء فقط (public.is_admin من 0001).
-- ============================================================================

create table if not exists public.site_content (
  id text primary key check (id in ('draft', 'published')),
  data jsonb not null,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_releases (
  id bigint generated always as identity primary key,
  data jsonb not null,
  note text not null default '' check (char_length(note) <= 200),
  summary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_releases_created_at_idx on public.site_releases (created_at desc);

alter table public.site_content enable row level security;
alter table public.site_releases enable row level security;

create policy site_content_admin_all on public.site_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy site_releases_admin_all on public.site_releases
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- صور وفيديوهات الموقع: عامة للقراءة (الزوار يشوفوها)، والرفع من الخادم فقط.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 83886080, array['image/webp', 'image/png', 'image/jpeg', 'video/mp4'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
