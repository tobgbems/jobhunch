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
- `NEXT_PUBLIC_SITE_URL` — used for auth redirects (e.g. `http://localhost:3000`)

## Authentication

- **Google OAuth** and **magic link** (email) via Supabase Auth — no passwords.
- Post-login default redirect: **`/dashboard`** (`app/auth/actions.ts`, `app/auth/callback/route.ts`).
- **Middleware** refreshes the Supabase session (`middleware.ts`, `lib/supabase/middleware.ts`).
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

**RLS summary:** Users own their `profiles` and `job_applications`; `reviews` are readable by all, writable by owner; `jobs` / `companies` readable broadly; inserts to `jobs` restricted to service role; review reads for the app use **`public_reviews`**, not raw `reviews`, so anonymous reviews never leak identity in list/detail UIs.

**Important:** If the app errors on missing columns (`location`, `job_type`) or schema cache for `job_applications`, the latest migration above must be applied in Supabase.

## Frontend routes (App Router)

| Path | Notes |
|------|--------|
| `/` | Marketing landing (`app/page.tsx`, `components/landing/*`) — light theme |
| `/auth` | Sign-in |
| `/auth/callback` | OAuth / magic-link exchange |
| `/privacy`, `/terms` | Placeholder legal pages (`components/landing/legal-page-shell.tsx`) |
| `/dashboard` | Shell: sidebar + mobile header (`app/dashboard/layout.tsx`) |
| `/dashboard/reviews` | Company discovery; links to `/dashboard/reviews/[slug]` |
| `/dashboard/reviews/new` | Multi-step review wizard (`components/reviews/ReviewWizard.tsx`) |
| `/dashboard/reviews/[slug]` | Company + reviews from `public_reviews` |
| `/dashboard/reviews/[slug]/edit` | Edit own review |
| `/dashboard/jobs` | Job board (`components/jobs/JobBoard.tsx`) — filters, pagination, detail dialog, **Save to tracker** |
| `/dashboard/applications` | Application tracker (`components/applications/ApplicationsTracker.tsx`) |
| `/dashboard/profile` | Placeholder |

## UI / brand conventions (dashboard & product)

- Light background **`#F7F8FA`**, cards white, borders **`#E6E7EA`** (or **`#E5E7EB`** on marketing).
- Primary green **`#27AE60`**, accent gold **`#F5A623`**, text **`#0D0D0D`**, muted **`#6B7280`**.
- Sidebar active item: green background, white text. Nav badges (e.g. job count, application count) match existing pattern in `app/dashboard/layout.tsx`.

## Domain concepts

- **`job_application_status`**: `saved` | `applied` | `interview` | `offer` | `rejected`.
- **Jobs:** `job_type` values align with DB check: `full-time`, `part-time`, `contract`, `remote`; some listings use `location = 'Remote'` with `full-time` job type.
- **Reviews:** Insert/update use `reviews` table; **always read** via **`public_reviews`** for listing/detail. Wizard uses native controls where Base UI was unreliable (employment status, etc.).

## Pitfalls & ops

- **Stale Next.js build:** If dev throws `Cannot find module './NNN.js'` under `.next`, stop the dev server, delete the **`.next`** folder, run `npm run dev` again.
- **Windows / Watchpack:** Harmless warnings scanning `C:\` system files sometimes appear; not app bugs.
- **Supabase schema cache:** After DDL changes, migration `20260327240000...` includes `NOTIFY pgrst, 'reload schema'`. If API still lags, wait a minute or reload from Supabase dashboard.

## What to preserve when changing code

- Do not bypass **`public_reviews`** for user-facing review lists.
- Respect RLS — client uses authenticated Supabase user; defensive `user_id` filters where used.
- Prefer matching existing patterns (dashboard layout, `createClient`, shadcn components).

## Periodic maintenance

When shipping a feature or changing schema:

1. Add or adjust migrations under `supabase/migrations/`.
2. **Update this file** (and `CLAUDE.md`) with new routes, tables, or conventions.

---

*Last updated: 2026-03-27 — includes landing, auth, reviews, job board, applications tracker, and migration list.*
