-- ─────────────────────────────────────────────────────────────────────────────
-- Lock the website's own tables (Payload: users, leads, courses, …) away from
-- Supabase's public API roles. Defense in depth: today the Supabase "Data API"
-- is switched off, so nothing can reach them anyway — this keeps them closed
-- even if someone switches it on by mistake.
--
--   * Payload and the e-signature server connect as the table OWNER (not
--     affected by RLS without FORCE) or as service_role (BYPASSRLS), so the
--     site keeps working exactly as before.
--   * anon: no rights on any table/sequence in public (0001 did this once, but
--     Payload tables created later received Supabase's default grants).
--   * authenticated: removed from every table that has no RLS policy (all of
--     Payload's tables + the server-only signing tables). The signing tables
--     that do have policies (admin_all …) keep their grants.
--   * New tables created later by the owner get no anon/authenticated rights.
-- Safe to run more than once. Approved by Hussein on 2026-09-29.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  t record;
begin
  for t in
    select c.oid, c.relname,
           exists (select 1 from pg_policy p where p.polrelid = c.oid) as has_policy
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind in ('r', 'p')
       and pg_get_userbyid(c.relowner) = current_user
  loop
    execute format('alter table public.%I enable row level security', t.relname);
    execute format('revoke all on table public.%I from anon', t.relname);
    if not t.has_policy then
      execute format('revoke all on table public.%I from authenticated', t.relname);
    end if;
  end loop;
end $$;

revoke all on all sequences in schema public from anon;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
