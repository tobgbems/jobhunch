-- Public job board: publish status + optional detail fields for SEO pages.

alter table public.jobs
  add column if not exists status text not null default 'open',
  add column if not exists salary_range text,
  add column if not exists responsibilities text,
  add column if not exists requirements text;

alter table public.jobs
  drop constraint if exists jobs_status_check;

alter table public.jobs
  add constraint jobs_status_check check (status in ('open', 'closed', 'draft'));

create index if not exists jobs_status_posted_at_idx
  on public.jobs (status, posted_at desc nulls last);

notify pgrst, 'reload schema';
