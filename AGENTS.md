# AGENTS.md — JobHunch

Guidance for AI coding agents (Cursor, etc.) working in this repository. **Update this file when you complete meaningful milestones**, new routes, schema changes, or conventions.

## Product

**JobHunch** — A job review and careers platform focused on Nigeria and Africa (anonymous company reviews, curated job listings, personal application tracking). Comparable intent to Glassdoor, localized for African workplaces.

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js **14** (App Router), TypeScript |
| Backend / DB | **Supabase** (Postgres, Auth, RLS) |
| UI | **Tailwind CSS**, **shadcn/ui** (components use **@base-ui/react** under the hood) |
| Icons | `lucide-react` |
| Email (planned / branding) | Resend mentioned in product spec; wire when implementing transactional email |

## Environment variables

Create `.env.local` from `.env.example` (if present):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` — canonical public origin, no trailing slash. **Production:** `https://thejobhunch.com`. **Local dev:** `http://localhost:3000`. Used by `getSiteUrl()` in `lib/site-url.ts` when the `Origin` header is missing (server actions / OAuth `redirectTo`, magic-link `emailRedirectTo`, callback fallback).

## Authentication

- **Google OAuth** and **magic link** (email) via Supabase Auth — no passwords.
- Redirect URLs use **`${getSiteUrl()}/auth/callback`** (and optional **`?next=`** for return paths) from `app/auth/actions.ts`. **Supabase Dashboard → Authentication → URL configuration** must include `https://thejobhunch.com` and (for local testing) `http://localhost:3000`. If OAuth rejects unknown redirect URLs, ensure callback URLs with query strings are allowed (or add the exact `.../auth/callback?next=...` patterns Supabase expects).
- Post-login redirect: **`/dashboard`** by default; **`/auth?next=/path`** passes through OAuth/magic-link `redirectTo` so users return to e.g. **`/jobs/[id]`** after sign-in (`lib/auth-redirect.ts` + `app/auth/callback/route.ts`).
- **Middleware** refreshes the Supabase session (`middleware.ts`, `lib/supabase/middleware.ts`) — no hardcoded site URLs.
- Browser client: `lib/supabase/client.ts`; server client: `lib/supabase/server.ts`.

## Database & migrations

Migrations live in **`supabase/migrations/`**. Apply via Supabase CLI or paste into the **SQL Editor** (order matters).

| File | Purpose |
|------|---------|
| `20260326183000_initial_schema.sql` | Core schema: `profiles`, `companies`, `reviews`, `jobs`, `job_applications`, enums, RLS, `profiles` trigger on `auth.users`, **`public_reviews`** view (anonymity-safe reads) |
| `20260326210100_public_reviews_owner_view.sql` | Extends `public_reviews` with **`is_owner`** (append column; explicit column list — avoid reordering columns in `CREATE OR REPLACE VIEW`) |
| `20260326223000_profiles_backfill_and_insert_policy.sql` | Backfill missing `profiles` rows; insert-own-profile policy (fixes FK issues for reviews) |
| `20260327120000_seed_jobs_nigeria.sql` | Seeds **15** Nigerian job rows (also duplicated for manual run in `supabase/seed_jobs_manual.sql` if present) |
| `20260327240000_job_applications_location_job_type.sql` | Adds **`location`** and **`job_type`** to `job_applications` + check constraint; ends with `NOTIFY pgrst, 'reload schema'` for PostgREST |
| `20260330153000_companies_add_size.sql` | Adds optional **`size`** column on `companies` for public company profile display + PostgREST schema reload |
| `20260331110000_profiles_legacy_bubble_linking.sql` | Prepares `profiles` for legacy Bubble users: adds `email`, `first_name`, `last_name`, `imported_from_bubble`, `source`; removes hard FK on `profiles.id`; updates `handle_new_user()` to link by email before insert |
| `20260410120000_jobs_status_and_detail_fields.sql` | Adds **`jobs.status`** (`open` / `closed` / `draft`, default `open`), **`salary_range`**, **`responsibilities`**, **`requirements`**; index on `(status, posted_at)`; PostgREST reload |
| `20260411120000_jobs_last_seen_apply_url_unique.sql` | Adds **`jobs.last_seen_at`**; partial unique index **`jobs_apply_url_unique_idx`** on **`apply_url`** (for PostgREST upsert / scraper dedupe); `NOTIFY pgrst, 'reload schema'`. If duplicates block the index, see **README → Job Scraping → Troubleshooting** (dedupe + `UNIQUE (apply_url)` constraint). |
| `20260412120000_admin_profiles_is_admin_jobs_rls.sql` | Adds **`profiles.is_admin`** (default `false`); extends **`jobs.status`** with **`deleted`** (soft delete); extends **`jobs.job_type`** with **`hybrid`**; replaces **`jobs` RLS**: rows with **`status = deleted`** hidden from non-admins; **`INSERT`/`UPDATE` on `jobs`** for **`authenticated`** users with **`is_admin = true`**; service-role scraper unchanged (bypasses RLS); replaces **`jobs_apply_url_unique_idx`** so uniqueness applies only when **`status` is not `deleted`** (reuse of `apply_url` after soft delete). Includes commented SQL to promote an owner by **`profiles.email`**. |

**RLS summary:** Users own their `profiles` and `job_applications`; `reviews` are readable by all, writable by owner; **`jobs`**: anon/authenticated **SELECT** returns non-deleted rows for everyone; **admins** (`profiles.is_admin`) also see **deleted**; **`INSERT`/`UPDATE` on `jobs`** allowed for **service role** (scraper) and for **authenticated admins**; no **`DELETE`** policy on **`jobs`** for the anon key (soft delete via **`UPDATE`** only); **`companies`** readable broadly; review reads for the app use **`public_reviews`**, not raw **`reviews`**, so anonymous reviews never leak identity in list/detail UIs.

**Admin access:** Apply the migration, then run once in the SQL Editor: `update public.profiles set is_admin = true where lower(btrim(email)) = lower('owner@example.com');` (user must have signed in so `profiles.id` matches auth). Open **`/admin/jobs`** while signed in as that user. Non-admins and logged-out users are **redirected to `/`** (`lib/require-admin.ts`, `app/admin/layout.tsx`). Admin URLs are **not** linked from the public or dashboard nav.

**Important:** If the app errors on missing columns (`location`, `job_type`) or schema cache for `job_applications`, the latest migration above must be applied in Supabase.

One-time legacy user import script: `scripts/migrate-bubble-users.ts` (service-role only). It pre-seeds Bubble users in `profiles` and relies on `handle_new_user()` to attach `auth.users.id` on first sign-in by matching `email`.

## Frontend routes (App Router)

| Path | Notes |
|------|--------|
| `/` | Marketing landing (`app/page.tsx`, `components/landing/*`) — light theme |
| `/auth` | Sign-in |
| `/auth/callback` | OAuth / magic-link exchange |
| `/privacy`, `/terms` | Placeholder legal pages (`components/landing/legal-page-shell.tsx`) |
| `/login`, `/signup` | Redirect to `/auth` (SEO-friendly paths for sitemap / links) |
| `/companies` | Public company directory (SSR); links to `/company/[slug]` |
| `/jobs` | Public job board (SSR + `revalidate`, `PublicJobsList` client filters); lists **`status = open`** only; cards link to **`/jobs/[id]`** and company profile |
| `/jobs/[id]` | Public job detail (SSR + `generateMetadata`); Apply (external) + **Track** → `job_applications` when signed in, else **`/auth?next=/jobs/[id]`** |
| `/robots.txt` | `app/robots.ts` — allow all crawlers; sitemap URL `https://thejobhunch.com/sitemap.xml` |
| `/sitemap.xml` | `app/sitemap.ts` — dynamic sitemap (`export const dynamic = "force-dynamic"`) using `createClient()` from `lib/supabase/server.ts`; static URLs + every `companies.slug` → `/company/[slug]` + every open job `jobs.id` → `/jobs/[id]` |
| `/dashboard` | Shell: sidebar + mobile header (`app/dashboard/layout.tsx`) |
| `/dashboard/reviews` | Company discovery; links to `/dashboard/reviews/[slug]` |
| `/dashboard/reviews/new` | Multi-step review wizard (`components/reviews/ReviewWizard.tsx`) |
| `/dashboard/reviews/[slug]` | Company + reviews from `public_reviews` |
| `/dashboard/reviews/[slug]/edit` | Edit own review |
| `/dashboard/jobs` | Job board (`components/jobs/JobBoard.tsx`) — filters, pagination, detail dialog, **Save to tracker** |
| `/dashboard/applications` | Application tracker (`components/applications/ApplicationsTracker.tsx`) |
| `/dashboard/profile` | Placeholder |
| `/admin` | Redirects to **`/admin/jobs`** |
| `/admin/jobs` | Owner-only job admin: table (filters, pagination), add/edit, toggle open/closed, soft delete (`status = deleted`). Dark shell in **`app/admin/layout.tsx`**. Server actions: **`app/admin/jobs/actions.ts`**. |
| `/admin/jobs/new` | Create manual job (`source = manual`, `last_seen_at` set). |
| `/admin/jobs/[id]/edit` | Edit job (restores from **deleted** by setting status to open/closed/draft). |
| `/admin/reviews`, `/admin/companies` | Placeholders (“coming soon”). |
| `/company/[slug]` | Public, crawlable company page with SSR metadata (`generateMetadata`: title `"{Name} Reviews – JobHunch"`, description from `companies.description` with review-count fallback), rating summaries, reviews (pros/cons blurred for logged-out users), and open jobs (links to **`/jobs/[id]`** + apply) |

## SEO & Google Search Console

- **Root metadata** — `app/layout.tsx`: `metadataBase` `https://thejobhunch.com`, default title/description, Open Graph + Twitter (`/og-image.png` placeholder until the asset exists in `public/`).
- **Per-page metadata** — `app/page.tsx`, `app/companies/page.tsx`, `app/jobs/page.tsx`; company pages as above.
- **Sitemap** — `app/sitemap.ts` lists static routes (`/`, `/companies`, `/jobs`, `/login`, `/signup`), all company profile URLs, and **open** job URLs `https://thejobhunch.com/jobs/{id}` (`jobs.status = open`).
- **Crawlers** — `app/robots.ts` allows `/` for all user agents and points to the production sitemap URL.

## UI / brand conventions (dashboard & product)

- Light background **`#F7F8FA`**, cards white, borders **`#E6E7EA`** (or **`#E5E7EB`** on marketing).
- Primary green **`#27AE60`**, accent gold **`#F5A623`**, text **`#0D0D0D`**, muted **`#6B7280`**.
- Sidebar active item: green background, white text. Nav badges (e.g. job count, application count) match existing pattern in `app/dashboard/layout.tsx`.

## Domain concepts

- **`job_application_status`**: `saved` | `applied` | `interview` | `offer` | `rejected`.
- **Jobs:** `job_type` values align with DB check: `full-time`, `part-time`, `contract`, `remote`, **`hybrid`**. **`status`**: `open` (shown on public `/jobs` + sitemap), `closed`, `draft`, **`deleted`** (soft delete; hidden from public and from non-admin reads via RLS). Optional detail fields: `salary_range`, `responsibilities`, `requirements`.
- **Reviews:** Insert/update use `reviews` table; **always read** via **`public_reviews`** for listing/detail. Wizard uses native controls where Base UI was unreliable (employment status, etc.).

## Pitfalls & ops

- **Stale Next.js build:** If dev throws `Cannot find module './NNN.js'` under `.next`, stop the dev server, delete the **`.next`** folder, run `npm run dev` again.
- **Windows / Watchpack:** Harmless warnings scanning `C:\` system files sometimes appear; not app bugs.
- **Supabase schema cache:** After DDL changes, migration `20260327240000...` includes `NOTIFY pgrst, 'reload schema'`. If API still lags, wait a minute or reload from Supabase dashboard.
- **Favicon conflicts in App Router:** Do not keep both `app/favicon.ico` and `public/favicon.ico`. This causes `500` with “conflicting public file and page file” on `/favicon.ico`. Prefer `public/favicon.ico` and set `metadata.icons.icon` in `app/layout.tsx`.
- **Job scraper / `42P10`:** The Python pipeline ([`scripts/scrape_jobs.py`](scripts/scrape_jobs.py), [`.github/workflows/scrape-jobs.yml`](.github/workflows/scrape-jobs.yml)) upserts on **`apply_url`**, which requires a **unique** index or constraint on that column. If Supabase returns **`42P10`** (*no unique or exclusion constraint matching the ON CONFLICT specification*), dedupe rows and add uniqueness — see **README → Job Scraping → Troubleshooting**.

## What to preserve when changing code

- Do not bypass **`public_reviews`** for user-facing review lists.
- Respect RLS — client uses authenticated Supabase user; defensive `user_id` filters where used.
- Prefer matching existing patterns (dashboard layout, `createClient`, shadcn components).

## Periodic maintenance

When shipping a feature or changing schema:

1. Add or adjust migrations under `supabase/migrations/`.
2. **Update this file** (and `CLAUDE.md`) with new routes, tables, or conventions.

---

*Last updated: 2026-04-10 — Admin `/admin/jobs` (owner `profiles.is_admin`, RLS, soft delete, hybrid job type), migration `20260412120000`. Prior: job scraper, `20260411120000`, public `/jobs/[id]`.*
