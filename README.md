This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

**Production:** [https://thejobhunch.com](https://thejobhunch.com)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Job Scraping

A Python script pulls listings from Nigerian job boards (Jobberman, MyJobMag), upserts them into Supabase on `apply_url`, and closes listings that have not been seen in 14 days. Rows with `source = 'manual'` are never auto-closed.

**Prerequisites:** The scraper needs `jobs.last_seen_at` and **uniqueness on `apply_url`** so PostgREST can upsert with `on_conflict=apply_url`. Apply [`supabase/migrations/20260411120000_jobs_last_seen_apply_url_unique.sql`](supabase/migrations/20260411120000_jobs_last_seen_apply_url_unique.sql), which adds `last_seen_at` and a partial unique index `jobs_apply_url_unique_idx`. A table-level `UNIQUE (apply_url)` constraint (see troubleshooting below) is an equivalent alternative.

### Troubleshooting: Upsert fails with `42P10` (GitHub Actions or local)

If the scraper or GitHub Actions logs show PostgreSQL **`42P10`** — *there is no unique or exclusion constraint matching the ON CONFLICT specification* — PostgREST does not see a unique index or constraint on `apply_url`. That often happens when **`CREATE UNIQUE INDEX` never completed** because **duplicate non-null `apply_url` rows** already existed.

Run this in the **Supabase SQL Editor** (same project as `SUPABASE_URL` in secrets):

**1. Remove duplicates, keeping the newest row per `apply_url`:**

```sql
-- Clean duplicates keeping newest
DELETE FROM public.jobs
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY apply_url ORDER BY created_at DESC
      ) AS rn
    FROM public.jobs
    WHERE apply_url IS NOT NULL
  ) dupes
  WHERE rn > 1
);
```

**2. Ensure a unique definition on `apply_url`** (drops the migration’s partial index name if present, then adds a constraint — Postgres enforces uniqueness and PostgREST upserts work):

```sql
-- First drop the existing index
DROP INDEX IF EXISTS public.jobs_apply_url_unique_idx;

-- Create a proper constraint instead (this also creates an index under the hood)
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_apply_url_unique
UNIQUE (apply_url);

NOTIFY pgrst, 'reload schema';
```

If the partial index from the migration **never** existed, `DROP INDEX IF EXISTS` is harmless. If you used a different index name, adjust the `DROP` line accordingly. Skip the `ALTER TABLE ... ADD CONSTRAINT` if `jobs_apply_url_unique` already exists.

### Run locally

1. Copy `.env.example` to `.env` and set `SUPABASE_URL` (same value as `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` (service role, not the anon key).
2. Install dependencies: `pip install -r scripts/requirements.txt`
3. Run: `python scripts/scrape_jobs.py`

The script prints a short summary (inserted, updated, deactivated).

### GitHub Actions

1. In the GitHub repo, go to **Settings → Secrets and variables → Actions**.
2. Add repository secrets **`SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** with the same values you use in Supabase.
3. The workflow **Scrape jobs** runs on a schedule (Monday and Thursday, 07:00 WAT) and can be run anytime via **Actions → Scrape jobs → Run workflow**.

### Add a new source later

1. Add a function in `scripts/scrape_jobs.py` that returns the same row shape (`title`, `company_name`, `location`, `job_type`, `description`, `apply_url`, `posted_at`, `source`).
2. Use `requests` + BeautifulSoup where HTML is sufficient; add Playwright only if a site requires a headless browser, then include `playwright` in `scripts/requirements.txt` and add a browser install step to `.github/workflows/scrape-jobs.yml`.
3. Call your function from `main()` inside a `try`/`except` that logs a warning and continues so one broken source does not stop the run.
4. Respect `REQUEST_DELAY_SEC` between requests.
