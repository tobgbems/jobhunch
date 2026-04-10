---
name: Public Jobs SEO Build
overview: Implement SEO-friendly public jobs listing and job detail pages with server-side Supabase fetching, plus schema support for open status and detailed job fields. Preserve existing dashboard jobs/tracker behavior while improving crawlability via internal links and sitemap job URLs.
todos:
  - id: migration-jobs-public-fields
    content: Add Supabase migration for jobs.status + salary_range + responsibilities + requirements with constraints/index/reload
    status: completed
  - id: public-jobs-list-upgrade
    content: Refactor app/jobs/page.tsx into SSR data fetch + client-side filters/search/cards and internal detail links
    status: completed
  - id: public-job-detail-route
    content: Implement app/jobs/[id]/page.tsx with SSR fetch, CTAs, metadata, and related company jobs
    status: completed
  - id: discoverability-links
    content: Update landing navbar/footer and relevant listings to link to /jobs and /jobs/{id}
    status: completed
  - id: sitemap-job-entries
    content: Extend app/sitemap.ts to include dynamic open job URLs
    status: completed
  - id: docs-and-validation
    content: Update AGENTS.md + CLAUDE.md and run lint/behavior checks
    status: completed
isProject: false
---

# Public Jobs SEO Rollout

## Scope

Deliver a crawlable public job board at [/jobs](C:/Users/Tobi/Documents/Coding projects/jobhunch/app/jobs/page.tsx) and job detail route at `/jobs/[id]` using server-side Supabase access, dynamic metadata, and sitemap discovery.

## Current baseline (confirmed)

- Public jobs list route already exists: [/app/jobs/page.tsx](C:/Users/Tobi/Documents/Coding projects/jobhunch/app/jobs/page.tsx), but it lacks keyword/filter UX and internal links to a job detail page.
- No public job detail route exists yet under `app/jobs/[id]`.
- Sitemap exists at [/app/sitemap.ts](C:/Users/Tobi/Documents/Coding projects/jobhunch/app/sitemap.ts) but only includes `/jobs` (not `/jobs/{id}`).
- Landing nav currently points Jobs to dashboard route in [/components/landing/landing-navbar.tsx](C:/Users/Tobi/Documents/Coding projects/jobhunch/components/landing/landing-navbar.tsx).
- `jobs` table has public read RLS already; we will extend schema for `status`, `salary_range`, `responsibilities`, `requirements`.

## Implementation steps

1. **Add migration for job publishing + detail fields**
  - Create new SQL migration in [/supabase/migrations](C:/Users/Tobi/Documents/Coding projects/jobhunch/supabase/migrations).
  - Add nullable columns on `public.jobs`:
    - `status text` with check constraint including `'open' | 'closed' | 'draft'` (default `'open'`).
    - `salary_range text`
    - `responsibilities text`
    - `requirements text`
  - Add index for `status` + `posted_at` to support public listing queries.
  - Include `NOTIFY pgrst, 'reload schema'` at end.
2. **Upgrade public `/jobs` page to SSR + interactive client filters**
  - Keep server data fetch in [/app/jobs/page.tsx](C:/Users/Tobi/Documents/Coding projects/jobhunch/app/jobs/page.tsx) via `createClient()`.
  - Query only open jobs: `eq('status','open')`, ordered by `posted_at desc`.
  - Fetch fields needed for cards and filtering: title, company name, company slug, location, job_type, posted_at, and company industry (via `companies(industry,slug)` relation) for category/industry filter.
  - Introduce a small client component (e.g. `components/jobs/PublicJobsList.tsx`) that receives SSR jobs and performs client-side search/filtering (keyword, location, job type, industry/category) without full reload.
  - Update metadata title/description to your requested SEO copy.
3. **Create SSR public job detail route `/jobs/[id]`**
  - Add [/app/jobs/[id]/page.tsx](C:/Users/Tobi/Documents/Coding projects/jobhunch/app/jobs/[id]/page.tsx).
  - Server-fetch a single open job by `id` with related company fields (`name`, `slug`, `logo_url`, `industry`).
  - Render full detail UI: title, company block, location, job type, salary range, description, responsibilities, requirements, date posted.
  - CTA behavior:
    - **Apply Now**: external URL in new tab, always visible.
    - **Track this Application**: visible for all users; if logged in, insert into `job_applications` (`status: saved`), if logged out, route to `/auth` (with optional redirect param back to this job).
  - Add optional “More jobs at {company}” section querying additional `status='open'` jobs by same `company_id` excluding current `id`.
4. **Add dynamic metadata for job detail pages**
  - In [/app/jobs/[id]/page.tsx](C:/Users/Tobi/Documents/Coding projects/jobhunch/app/jobs/[id]/page.tsx), implement `generateMetadata`:
    - Title: `"[Job Title] at [Company Name] | JobHunch"`
    - Description: concise summary from description/salary/location fallback.
    - Include OG/Twitter fields consistent with public company page pattern.
  - Use dynamic SSR approach (no `generateStaticParams`) so newly added jobs appear without build-time generation.
5. **Improve crawl paths and navigation**
  - Update landing header Jobs link in [/components/landing/landing-navbar.tsx](C:/Users/Tobi/Documents/Coding projects/jobhunch/components/landing/landing-navbar.tsx) from `/dashboard/jobs` to `/jobs`.
  - Update footer Jobs link in [/components/landing/landing-footer.tsx](C:/Users/Tobi/Documents/Coding projects/jobhunch/components/landing/landing-footer.tsx) from `#jobs` to `/jobs` for stronger discoverability.
  - On public jobs listing and company jobs sections, include internal links to `/jobs/{id}`.
6. **Extend sitemap for job detail URLs**
  - Update [/app/sitemap.ts](C:/Users/Tobi/Documents/Coding projects/jobhunch/app/sitemap.ts) to fetch open jobs and append `/jobs/{id}` entries (`changeFrequency: 'daily'`, sensible priority).
  - Keep existing company URLs and static URLs unchanged.
7. **Keep dashboard behavior intact**
  - Do not replace dashboard jobs UI or existing `JobBoard` flows.
  - Ensure any new `jobs.status` constraint/default is backward compatible with existing seeded/inserted rows (default open avoids breaks).
  - Reuse existing tracker insert shape from dashboard when implementing public “Track this Application”.
8. **Docs + verification**
  - Update [/AGENTS.md](C:/Users/Tobi/Documents/Coding projects/jobhunch/AGENTS.md) and [/CLAUDE.md](C:/Users/Tobi/Documents/Coding projects/jobhunch/CLAUDE.md) with:
    - new route `/jobs/[id]`
    - new jobs columns and purpose
    - sitemap now includes per-job URLs.
  - Run lint checks on changed files and validate: logged-out access, metadata rendering, apply CTA, tracker auth behavior, and sitemap output.

