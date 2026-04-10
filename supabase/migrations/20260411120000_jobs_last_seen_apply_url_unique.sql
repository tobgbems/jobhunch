-- Scraper support: track when a listing was last seen live; dedupe upserts on apply_url.

alter table public.jobs
  add column if not exists last_seen_at timestamptz not null default now();

create unique index if not exists jobs_apply_url_unique_idx
  on public.jobs (apply_url)
  where apply_url is not null;

notify pgrst, 'reload schema';
