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

**Prerequisites:** Apply the migration that adds `last_seen_at` and the partial unique index on `apply_url` (`supabase/migrations/20260411120000_jobs_last_seen_apply_url_unique.sql`).

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
