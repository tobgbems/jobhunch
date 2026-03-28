-- Backfill profiles for users created before the trigger existed.
insert into public.profiles (id, full_name, avatar_url, created_at)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name') as full_name,
  u.raw_user_meta_data ->> 'avatar_url' as avatar_url,
  coalesce(u.created_at, now()) as created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Allow authenticated users to create only their own profile row.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);
