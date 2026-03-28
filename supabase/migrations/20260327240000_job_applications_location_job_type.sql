-- Optional denormalized fields for external applications and display;
-- board-saved rows can also store location/type for consistency.
alter table public.job_applications
  add column if not exists location text;

alter table public.job_applications
  add column if not exists job_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'job_applications_job_type_check'
  ) then
    alter table public.job_applications
      add constraint job_applications_job_type_check
      check (
        job_type is null
        or job_type in ('full-time', 'part-time', 'contract', 'remote')
      );
  end if;
end $$;

-- Refresh PostgREST schema cache so the API sees new columns immediately.
notify pgrst, 'reload schema';
