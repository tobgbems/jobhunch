-- Allow authenticated admins (profiles.is_admin = true) to delete any review
-- and update any company record from admin pages.

drop policy if exists "reviews_delete_admin" on public.reviews;
create policy "reviews_delete_admin"
on public.reviews
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

drop policy if exists "companies_update_admin" on public.companies;
create policy "companies_update_admin"
on public.companies
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
