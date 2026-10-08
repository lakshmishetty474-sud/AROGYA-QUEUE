-- ============================================================================
-- Receptionist Approval Center
-- ----------------------------------------------------------------------------
-- Three request queues the front desk clears before anything is confirmed:
-- ambulances, appointments and beds. Every row lands as 'Pending' and only the
-- receptionist moves it to Approved / Rejected.
--
-- Apply with:  supabase db push        (or paste into the SQL editor)
--
-- NOTE ON RLS
--   Row Level Security is disabled deliberately for this coursework build so
--   the browser can read and write with the anon key. That means these tables
--   are readable by anyone holding the publishable key. Re-enable RLS and add
--   policies before this goes anywhere near real patient data.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. ambulance_requests
-- ---------------------------------------------------------------------------
create table if not exists public.ambulance_requests (
  id              uuid primary key default gen_random_uuid(),
  patient_name    text        not null,
  pickup_location text,
  status          text        not null default 'Pending',
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. appointments
-- ---------------------------------------------------------------------------
create table if not exists public.appointments (
  id           uuid primary key default gen_random_uuid(),
  patient_name text        not null,
  doctor       text,
  date_time    timestamptz,
  status       text        not null default 'Pending',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. bed_requests
-- ---------------------------------------------------------------------------
create table if not exists public.bed_requests (
  id           uuid primary key default gen_random_uuid(),
  patient_name text        not null,
  bed_type     text,
  hospital     text,
  status       text        not null default 'Pending',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. beds
-- Created only when missing, so an existing beds table keeps its data and its
-- original shape (id, hospital, bed_no, type, status).
-- ---------------------------------------------------------------------------
create table if not exists public.beds (
  id       uuid primary key default gen_random_uuid(),
  hospital text,
  bed_no   text,
  type     text,
  status   text not null default 'Free'
);

-- ---------------------------------------------------------------------------
-- Realtime
-- postgres_changes will not fire for a table that is not in the publication.
-- Adding a table that is already a member is a no-op, so this is safe to re-run.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['ambulance_requests', 'appointments', 'bed_requests', 'beds']
  loop
    if not exists (
      select 1
        from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS off (see the note at the top of this file)
-- ---------------------------------------------------------------------------
alter table public.ambulance_requests disable row level security;
alter table public.appointments        disable row level security;
alter table public.bed_requests        disable row level security;
alter table public.beds                disable row level security;

-- Realtime will not emit changes for a table whose replica identity cannot
-- identify a row. The default is enough for INSERT/DELETE; this keeps UPDATE
-- payloads usable too.
alter table public.ambulance_requests replica identity full;
alter table public.appointments        replica identity full;
alter table public.bed_requests        replica identity full;
alter table public.beds                replica identity full;

-- ---------------------------------------------------------------------------
-- Indexes - every list in the approval center is ordered by created_at desc and
-- filtered on status.
-- ---------------------------------------------------------------------------
create index if not exists ambulance_requests_created_at_idx on public.ambulance_requests (created_at desc);
create index if not exists ambulance_requests_status_idx      on public.ambulance_requests (status);
create index if not exists appointments_created_at_idx        on public.appointments (created_at desc);
create index if not exists appointments_status_idx             on public.appointments (status);
create index if not exists bed_requests_created_at_idx        on public.bed_requests (created_at desc);
create index if not exists bed_requests_status_idx             on public.bed_requests (status);
create index if not exists beds_status_type_idx                on public.beds (status, type);

commit;

-- ============================================================================
-- VERIFY
--   select pubname, schemaname, tablename
--     from pg_publication_tables where pubname = 'supabase_realtime';
--
--   select relname, relreplident, relrowsecurity
--     from pg_class
--     join pg_namespace on pg_namespace.oid = pg_class.relnamespace
--    where relname in ('ambulance_requests','appointments','bed_requests','beds')
--      and nspname = 'public';
-- ============================================================================