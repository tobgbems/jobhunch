-- Copy-paste into Supabase SQL Editor to seed jobs (same as migration 20260327120000).
-- Run once per project; duplicate rows if you run again without deleting first.

insert into public.jobs (
  company_name,
  title,
  location,
  job_type,
  apply_url,
  source,
  is_scraped,
  posted_at
)
values
  ('Paystack', 'Backend Engineer', 'Lagos', 'full-time', 'https://paystack.com/careers', 'paystack.com', true, now()),
  ('Flutterwave', 'Product Manager', 'Lagos', 'full-time', 'https://flutterwave.com/us/careers', 'flutterwave.com', true, now()),
  ('Andela', 'Senior Frontend Engineer', 'Remote', 'full-time', 'https://andela.com/careers', 'andela.com', true, now()),
  ('MTN Nigeria', 'Data Analyst', 'Lagos', 'full-time', 'https://mtn.com.ng/careers', 'mtn.com.ng', true, now()),
  ('Interswitch', 'DevOps Engineer', 'Lagos', 'full-time', 'https://interswitchgroup.com/careers', 'interswitchgroup.com', true, now()),
  ('Kuda Bank', 'iOS Developer', 'Lagos', 'full-time', 'https://kuda.com/careers', 'kuda.com', true, now()),
  ('Carbon', 'Credit Risk Analyst', 'Lagos', 'full-time', 'https://getcarbon.co/careers', 'getcarbon.co', true, now()),
  ('Cowrywise', 'Growth Marketing Manager', 'Lagos', 'full-time', 'https://cowrywise.com/careers', 'cowrywise.com', true, now()),
  ('Piggyvest', 'UI/UX Designer', 'Lagos', 'full-time', 'https://piggyvest.com/careers', 'piggyvest.com', true, now()),
  ('Zoho Nigeria', 'Sales Executive', 'Lagos', 'full-time', 'https://zoho.com/careers', 'zoho.com', true, now()),
  ('Dangote Group', 'Financial Controller', 'Lagos', 'full-time', 'https://dangote.com/careers', 'dangote.com', true, now()),
  ('Bolt Nigeria', 'Operations Manager', 'Lagos', 'full-time', 'https://bolt.eu/en/careers', 'bolt.eu', true, now()),
  ('Mono', 'Developer Relations Engineer', 'Remote', 'full-time', 'https://mono.co/careers', 'mono.co', true, now()),
  ('Terragon Group', 'Data Scientist', 'Lagos', 'full-time', 'https://terragon.com.ng/careers', 'terragon.com.ng', true, now()),
  ('Stanbic IBTC', 'Relationship Manager', 'Abuja', 'full-time', 'https://stanbicibtc.com/careers', 'stanbicibtc.com', true, now());
