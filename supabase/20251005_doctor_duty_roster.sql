-- ============================================================================
-- Doctor On Duty visibility
-- One roster table (doctor_duty) is the source of truth for who is on duty,
-- read by the hospital roster, the patient availability list and the doctor
-- duty toggle, all over one realtime channel.
--
-- NOTE: this sits in supabase/ rather than supabase/migrations/ because that
-- folder was not writable when the file was generated. Move it there if you
-- want `supabase db push` to pick it up, or paste it into the SQL editor.
--
-- RLS is disabled deliberately for this build so the browser can read and
-- write with the anon key. Re-enable RLS and add policies before real data.
-- ============================================================================

begin;

-- 1. doctors - the people, independent of any shift
create table if not exists public.doctors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  specialization text,
  department     text,
  phone          text,
  hospital       text,
  photo_url      text,
  created_at     timestamptz not null default now()
);

-- 2. doctor_duty - one row per doctor per day
create table if not exists public.doctor_duty (
  id             uuid primary key default gen_random_uuid(),
  doctor_id      uuid references public.doctors(id) on delete set null,
  doctor_name    text,
  specialization text,
  department     text,
  hospital       text,
  shift          text,
  status         text not null default 'On Duty',
  duty_date      date not null default current_date,
  start_time     time,
  end_time       time,
  created_at     timestamptz not null default now(),
  -- one row per doctor per day, so re-marking updates instead of duplicating
  constraint doctor_duty_once_per_day unique (doctor_id, duty_date)
);

-- Realtime: a table outside the publication emits no postgres_changes.
-- Re-running is safe; an existing member is skipped.
do $$
declare
  t text;
begin
  foreach t in array array['doctors','doctor_duty'] loop
    if not exists (select 1 from pg_publication_tables
                 where pubname = ''supabase_realtime''
                   and schemaname = ''public''
                   and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- RLS off
alter table public.doctors     disable row level security;
alter table public.doctor_duty disable row level security;

-- required for realtime to emit identifiable rows
alter table public.doctors     replica identity full;
alter table public.doctor_duty replica identity full;

create index if not exists doctors_hospital_idx   on public.doctors (hospital);
create index if not exists doctor_duty_roster_idx on public.doctor_duty (hospital, duty_date, start_time);
create index if not exists doctor_duty_status_idx on public.doctor_duty (status, duty_date);
create index if not exists doctor_duty_doctor_idx on public.doctor_duty (doctor_id, duty_date desc);

commit;
