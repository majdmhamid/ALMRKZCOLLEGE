-- ============================================================================
-- Storage buckets and Realtime (Supabase-specific schemas)
-- ============================================================================

-- All buckets are PRIVATE. No storage.objects policies are created, so only the
-- service-role key (server side) can read or write. The browser gets short-lived
-- signed URLs from the server when it needs a file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('originals',  'originals',  false, 52428800, array['application/pdf']),
  ('finals',     'finals',     false, 104857600, array['application/pdf']),
  ('signatures', 'signatures', false, 1048576,  array['image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Live updates for the admin UI (bell count, row status, "1/2 signed").
-- Realtime respects RLS, so only admins receive these changes.
alter publication supabase_realtime add table public.documents;
alter publication supabase_realtime add table public.signers;
alter publication supabase_realtime add table public.notifications;
