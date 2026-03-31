-- Support pre-seeded legacy users that do not yet exist in auth.users.
-- This keeps current app semantics where reviews/job_applications reference profiles.id.

-- 1) Profiles must be seedable before an auth account exists.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- 2) Add identity and migration metadata fields.
alter table public.profiles
  add column if not exists email text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists imported_from_bubble boolean not null default false,
  add column if not exists source text;

-- 3) Backfill email for existing authenticated users.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or btrim(p.email) = '');

-- 4) Enforce dedupe rules by case-insensitive email value.
create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null;

-- 5) Link new auth users to existing legacy rows by email before insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_profile_id uuid;
begin
  -- Existing profile already keyed by auth uid.
  if exists(select 1 from public.profiles where id = new.id) then
    update public.profiles
    set
      email = coalesce(email, new.email),
      full_name = coalesce(full_name, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      avatar_url = coalesce(avatar_url, new.raw_user_meta_data ->> 'avatar_url')
    where id = new.id;

    return new;
  end if;

  -- Legacy row exists by email: promote it to authenticated profile id.
  select p.id into existing_profile_id
  from public.profiles p
  where p.email is not null
    and lower(p.email) = lower(new.email)
  limit 1;

  if existing_profile_id is not null then
    update public.profiles
    set
      id = new.id,
      email = new.email,
      full_name = coalesce(full_name, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      avatar_url = coalesce(avatar_url, new.raw_user_meta_data ->> 'avatar_url')
    where id = existing_profile_id;

    return new;
  end if;

  -- No legacy row: create the profile as normal.
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

notify pgrst, 'reload schema';
