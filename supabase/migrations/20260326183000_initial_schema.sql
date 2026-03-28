create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_application_status') then
    create type public.job_application_status as enum ('saved', 'applied', 'interview', 'offer', 'rejected');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  work_email text,
  work_email_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry text,
  location text,
  logo_url text,
  website text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_anonymous boolean not null default true,
  work_email_verified boolean not null default false,
  job_title text,
  employment_status text not null check (employment_status in ('current', 'former')),
  rating_overall int not null check (rating_overall between 1 and 5),
  rating_culture int not null check (rating_culture between 1 and 5),
  rating_management int not null check (rating_management between 1 and 5),
  rating_growth int not null check (rating_growth between 1 and 5),
  rating_worklife int not null check (rating_worklife between 1 and 5),
  pros text not null,
  cons text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  company_name text not null,
  title text not null,
  location text,
  job_type text check (job_type in ('full-time', 'part-time', 'contract', 'remote')),
  description text,
  apply_url text,
  source text,
  is_scraped boolean not null default false,
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  company_name text not null,
  job_title text not null,
  apply_url text,
  status public.job_application_status not null default 'saved',
  notes text,
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reviews_company_id_idx on public.reviews(company_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);
create index if not exists jobs_company_id_idx on public.jobs(company_id);
create index if not exists jobs_posted_at_idx on public.jobs(posted_at desc);
create index if not exists job_applications_user_id_idx on public.job_applications(user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace view public.public_reviews as
select
  r.id,
  r.company_id,
  c.name as company_name,
  r.is_anonymous,
  case
    when r.is_anonymous then 'Anonymous'
    else coalesce(p.full_name, 'Anonymous')
  end as reviewer_name,
  r.work_email_verified,
  r.job_title,
  r.employment_status,
  r.rating_overall,
  r.rating_culture,
  r.rating_management,
  r.rating_growth,
  r.rating_worklife,
  r.pros,
  r.cons,
  r.created_at
from public.reviews r
join public.companies c on c.id = r.company_id
left join public.profiles p on p.id = r.user_id;

grant select on public.public_reviews to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.reviews enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "companies_select_all" on public.companies;
create policy "companies_select_all"
on public.companies
for select
to anon, authenticated
using (true);

drop policy if exists "companies_insert_authenticated" on public.companies;
create policy "companies_insert_authenticated"
on public.companies
for insert
to authenticated
with check (true);

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all"
on public.reviews
for select
to anon, authenticated
using (true);

drop policy if exists "reviews_insert_authenticated" on public.reviews;
create policy "reviews_insert_authenticated"
on public.reviews
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
on public.reviews
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
on public.reviews
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "jobs_select_all" on public.jobs;
create policy "jobs_select_all"
on public.jobs
for select
to anon, authenticated
using (true);

drop policy if exists "jobs_insert_service_role" on public.jobs;
create policy "jobs_insert_service_role"
on public.jobs
for insert
to public
with check (auth.role() = 'service_role');

drop policy if exists "job_applications_select_own" on public.job_applications;
create policy "job_applications_select_own"
on public.job_applications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "job_applications_insert_own" on public.job_applications;
create policy "job_applications_insert_own"
on public.job_applications
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "job_applications_update_own" on public.job_applications;
create policy "job_applications_update_own"
on public.job_applications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "job_applications_delete_own" on public.job_applications;
create policy "job_applications_delete_own"
on public.job_applications
for delete
to authenticated
using (auth.uid() = user_id);
