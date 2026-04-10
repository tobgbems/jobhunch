-- Admin job management: owner flag, soft-delete status, hybrid job type, jobs RLS for admins,
-- and apply_url uniqueness excluding soft-deleted rows.

-- 1) Platform owner flag (default false for all users).
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Run once in Supabase SQL Editor to grant admin (replace email):
-- update public.profiles
-- set is_admin = true
-- where lower(btrim(email)) = lower('you@example.com');

-- 2) Job status: allow soft delete.
alter table public.jobs
  drop constraint if exists jobs_status_check;

alter table public.jobs
  add constraint jobs_status_check check (status in ('open', 'closed', 'draft', 'deleted'));

-- 3) Job type: allow hybrid.
alter table public.jobs
  drop constraint if exists jobs_job_type_check;

alter table public.jobs
  add constraint jobs_job_type_check
  check (
    job_type is null
    or job_type in ('full-time', 'part-time', 'contract', 'remote', 'hybrid')
  );

-- 4) apply_url: unique only among non-deleted rows (allows re-adding after soft delete).
drop index if exists public.jobs_apply_url_unique_idx;

create unique index if not exists jobs_apply_url_unique_idx
  on public.jobs (apply_url)
  where apply_url is not null
    and status is distinct from 'deleted';

-- 5) RLS: hide deleted jobs from non-admins; admins may insert/update.
drop policy if exists "jobs_select_all" on public.jobs;

create policy "jobs_select_all"
on public.jobs
for select
to anon, authenticated
using (
  status is distinct from 'deleted'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

drop policy if exists "jobs_insert_admin" on public.jobs;

create policy "jobs_insert_admin"
on public.jobs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

drop policy if exists "jobs_update_admin" on public.jobs;

create policy "jobs_update_admin"
on public.jobs
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

notify pgrst, 'reload schema';
