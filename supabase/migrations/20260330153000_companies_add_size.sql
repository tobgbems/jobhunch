-- Add optional size band for company profile pages.
alter table public.companies
  add column if not exists size text;

-- Refresh PostgREST schema cache.
notify pgrst, 'reload schema';
