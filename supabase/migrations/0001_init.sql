-- ============================================================================
-- PDF e-signature — initial schema
--
-- Access model:
--   * Admins are real Supabase Auth users that ALSO have a row in admin_profiles.
--     There is no public sign-up; admins are created by hand (npm run admin:create).
--   * RLS is on for every table. Authenticated admins may read/write; nobody else.
--   * The public signing page never talks to Supabase. Next.js server code uses the
--     service-role key, which bypasses RLS.
--   * The admin browser uses its own session only for Realtime subscriptions.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.link_mode as enum ('per_signer', 'shared');
create type public.document_status as enum ('draft', 'pending', 'signed', 'finalized');
create type public.signer_status as enum ('pending', 'signed');
create type public.signature_method as enum ('draw', 'typed', 'checkbox');
create type public.audit_event_type as enum (
  'created', 'updated', 'deleted',
  'link_copied', 'link_revoked', 'link_regenerated', 'link_reset',
  'opened', 'id_failed', 'id_locked', 'id_verified',
  'signed', 'placed',
  'finalized', 'unlocked',
  'moved_to_signed', 'moved_back'
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_profiles
-- ---------------------------------------------------------------------------
create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  saved_signature_path text,
  locale text not null default 'he' check (locale in ('he', 'ar')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_profiles_updated_at
  before update on public.admin_profiles
  for each row execute function public.set_updated_at();

-- True when the current JWT belongs to an admin. SECURITY DEFINER so policies on
-- admin_profiles itself don't recurse.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  category text check (category is null or char_length(category) <= 100),
  description text check (description is null or char_length(description) <= 2000),
  file_name text,

  original_pdf_path text,
  original_sha256 text check (original_sha256 is null or original_sha256 ~ '^[0-9a-f]{64}$'),
  original_size_bytes bigint check (original_size_bytes is null or original_size_bytes between 1 and 52428800),
  final_pdf_path text,
  final_sha256 text check (final_sha256 is null or final_sha256 ~ '^[0-9a-f]{64}$'),
  final_size_bytes bigint,
  page_count integer check (page_count is null or page_count > 0),

  link_mode public.link_mode not null default 'per_signer',
  -- Shared mode only. The hash is used to look the token up; the encrypted copy
  -- (AES-256-GCM, server key) lets the admin copy the link again later.
  shared_token_hash text unique check (shared_token_hash is null or shared_token_hash ~ '^[0-9a-f]{64}$'),
  shared_token_enc text,
  max_signers integer check (max_signers is null or max_signers between 1 and 500),

  admin_signs boolean not null default false,
  status public.document_status not null default 'draft',

  in_signed_section boolean not null default false,
  moved_to_signed_at timestamptz,
  finalized_at timestamptz,
  deleted_at timestamptz,

  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint documents_shared_token_mode check (
    link_mode = 'shared' or (shared_token_hash is null and shared_token_enc is null)
  ),
  constraint documents_final_matches_status check (
    (status = 'finalized') = (final_pdf_path is not null)
  )
);

create index documents_list_idx on public.documents (in_signed_section, created_at desc)
  where deleted_at is null;

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- signers
--   per_signer mode: rows are created by the admin up front (name + ID).
--   shared mode: a row is created when someone submits a signature.
--   is_admin: the admin's own signature slot (when documents.admin_signs).
-- ---------------------------------------------------------------------------
create table public.signers (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  -- HMAC-SHA256(server secret, 9-digit normalized ID). Never the plain ID.
  id_number_hash text check (id_number_hash is null or id_number_hash ~ '^[0-9a-f]{64}$'),
  -- Last 3 digits only, for the admin to tell signers apart.
  id_number_last3 text check (id_number_last3 is null or id_number_last3 ~ '^[0-9]{3}$'),
  phone text check (phone is null or phone ~ '^\+?[0-9]{7,15}$'),

  token_hash text unique check (token_hash is null or token_hash ~ '^[0-9a-f]{64}$'),
  token_enc text,

  is_admin boolean not null default false,
  admin_user_id uuid references auth.users (id) on delete set null,

  status public.signer_status not null default 'pending',
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked boolean not null default false,

  signature_path text,
  signature_method public.signature_method,
  signed_at timestamptz,
  signed_ip inet,
  signed_user_agent text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint signers_signed_has_signature check (
    status = 'pending' or (signature_path is not null and signed_at is not null and signature_method is not null)
  ),
  constraint signers_admin_has_no_token check (
    not is_admin or (token_hash is null and id_number_hash is null)
  )
);

create index signers_document_idx on public.signers (document_id);

-- The same ID can sign a given document only once (both modes).
create unique index signers_document_id_number_uniq
  on public.signers (document_id, id_number_hash)
  where id_number_hash is not null;

-- At most one admin slot per document.
create unique index signers_document_admin_uniq
  on public.signers (document_id)
  where is_admin;

create trigger signers_updated_at
  before update on public.signers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- placements — positions are fractions (0–1) of the page AS DISPLAYED
-- (i.e. after /Rotate, within the CropBox), origin top-left.
-- ---------------------------------------------------------------------------
create table public.placements (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  signer_id uuid not null references public.signers (id) on delete cascade,
  page integer not null check (page >= 1),
  x double precision not null check (x >= 0 and x <= 1),
  y double precision not null check (y >= 0 and y <= 1),
  width double precision not null check (width > 0 and width <= 1),
  height double precision not null check (height > 0 and height <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint placements_inside_page check (x + width <= 1.000001 and y + height <= 1.000001)
);

create index placements_document_idx on public.placements (document_id);
create index placements_signer_idx on public.placements (signer_id);

create trigger placements_updated_at
  before update on public.placements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- settings — exactly one row
-- ---------------------------------------------------------------------------
create table public.settings (
  id boolean primary key default true check (id),
  allow_typed_signature boolean not null default false,
  allow_checkbox_signature boolean not null default false,
  default_link_mode public.link_mode not null default 'per_signer',
  message_template text not null default '' check (char_length(message_template) <= 2000),
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (true) on conflict do nothing;

create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notifications — one row per signature; drives the bell badge
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  signer_id uuid references public.signers (id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_unread_idx on public.notifications (created_at desc) where read_at is null;

-- ---------------------------------------------------------------------------
-- audit_events
-- ---------------------------------------------------------------------------
create table public.audit_events (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.documents (id) on delete cascade,
  signer_id uuid references public.signers (id) on delete set null,
  event public.audit_event_type not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_events_document_idx on public.audit_events (document_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Shared-link lockout: 5 wrong attempts lock that device (not the whole link).
-- Server-only (no RLS policy).
-- ---------------------------------------------------------------------------
create table public.shared_link_attempts (
  document_id uuid not null references public.documents (id) on delete cascade,
  device_key text not null check (device_key ~ '^[0-9a-f]{64}$'),
  failed_attempts integer not null default 0,
  locked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (document_id, device_key)
);

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window). Server-only.
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

-- Atomically records one hit and returns true while still under the limit.
create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;

  -- Opportunistic cleanup of old windows.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;

-- Atomically counts a failed ID attempt on a per-signer link; locks at p_max.
create or replace function public.signer_register_failure(p_signer_id uuid, p_max integer)
returns table (failed_attempts integer, locked boolean)
language sql
security definer
set search_path = ''
as $$
  update public.signers s
     set failed_attempts = s.failed_attempts + 1,
         locked = (s.failed_attempts + 1) >= p_max
   where s.id = p_signer_id
  returning s.failed_attempts, s.locked;
$$;

revoke all on function public.signer_register_failure(uuid, integer) from public, anon, authenticated;

create or replace function public.shared_register_failure(p_document_id uuid, p_device_key text, p_max integer)
returns table (failed_attempts integer, locked boolean)
language sql
security definer
set search_path = ''
as $$
  insert into public.shared_link_attempts as a (document_id, device_key, failed_attempts, locked)
  values (p_document_id, p_device_key, 1, 1 >= p_max)
  on conflict (document_id, device_key) do update
     set failed_attempts = a.failed_attempts + 1,
         locked = (a.failed_attempts + 1) >= p_max,
         updated_at = now()
  returning a.failed_attempts, a.locked;
$$;

revoke all on function public.shared_register_failure(uuid, text, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.admin_profiles enable row level security;
alter table public.documents enable row level security;
alter table public.signers enable row level security;
alter table public.placements enable row level security;
alter table public.settings enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_events enable row level security;
alter table public.shared_link_attempts enable row level security;
alter table public.rate_limits enable row level security;

create policy admin_all on public.admin_profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.signers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.placements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.notifications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Audit trail is append-only for admins; nobody edits history.
create policy admin_read on public.audit_events
  for select to authenticated using (public.is_admin());
create policy admin_insert on public.audit_events
  for insert to authenticated with check (public.is_admin());
-- shared_link_attempts, rate_limits: no policies → service role only.

-- Belt and braces: the anon role gets nothing at all.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
