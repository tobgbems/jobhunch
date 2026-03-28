# CLAUDE.md — JobHunch project context

This file gives Claude (and humans) a concise technical and product overview. **Keep it in sync with development:** update it whenever you add major features, change the database, or establish new patterns. Mirror substantive changes in **`AGENTS.md`** (agent-oriented detail).

## One-line pitch

**JobHunch** helps professionals in Nigeria and Africa discover honest workplace reviews, browse vetted jobs, and track job applications in one place.

## Stack

- **Next.js 14** (App Router), **React 18**, **TypeScript**
- **Supabase**: PostgreSQL, Auth (Google + email magic link), Row Level Security
- **Styling**: Tailwind CSS, **shadcn/ui** (Base UI primitives)
- **Icons**: Lucide

## Local setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and set Supabase URL, anon key, and `NEXT_PUBLIC_SITE_URL` (production: **`https://thejobhunch.com`**; local dev: **`http://localhost:3000`**).
3. Run SQL migrations in Supabase (see `supabase/migrations/`, chronological order).
4. `npm run dev` → http://localhost:3000

**Production site:** [https://thejobhunch.com](https://thejobhunch.com)

## Implemented features (high level)

1. **Marketing site** — Light-themed landing (`app/page.tsx`, `components/landing/*`): hero, features, stats, pricing placeholder, how-it-works, CTA, footer. Anchor navigation; `/privacy` and `/terms` placeholders.
2. **Authentication** — `/auth`, server actions, OAuth and magic-link callback; protected `/dashboard` via middleware and server-side user check.
3. **Dashboard shell** — Light UI, sidebar + mobile nav, profile snippet; nav badges for job count and application count where implemented.
4. **Reviews** — Company search/list, company detail by slug, `ReviewWizard` (create/edit), ratings, anonymity, reads from **`public_reviews`** view with `is_owner` for edit/delete.
5. **Job board** — `/dashboard/jobs`: seeded listings, search/filters (client-side), pagination, job detail panel, **Save to tracker** → `job_applications` with `status: saved`.
6. **Application tracker** — `/dashboard/applications`: stats, status tabs, cards, add/edit modal (native selects for reliability), delete confirm; joins **`jobs`** when `job_id` is set.

## Database artifacts

- **Tables:** `profiles`, `companies`, `reviews`, `jobs`, `job_applications`
- **View:** `public_reviews` — safe reviewer display; includes **`is_owner`** for UI ownership checks
- **Enum:** `job_application_status`
- **Trigger:** new auth users get a `profiles` row (plus backfill migration for legacy users)

Exact migration filenames and purposes are listed in **`AGENTS.md`** (single source of detail).

## Brand / UI tokens (common)

- Green: `#27AE60`
- Gold: `#F5A623`
- Page bg: `#F7F8FA`
- Dark text: `#0D0D0D`

## Files worth knowing

| Area | Location |
|------|-----------|
| Public site URL (auth fallbacks) | `lib/site-url.ts` (`getSiteUrl` → `NEXT_PUBLIC_SITE_URL`) |
| Supabase browser client | `lib/supabase/client.ts` |
| Supabase server client | `lib/supabase/server.ts` |
| Dashboard layout & nav counts | `app/dashboard/layout.tsx` |
| Review wizard | `components/reviews/ReviewWizard.tsx` |
| Job board | `components/jobs/JobBoard.tsx` |
| Applications UI | `components/applications/ApplicationsTracker.tsx` |

## Operational notes

- If Next dev fails with missing `./NNN.js` chunks: delete **`.next`**, restart `npm run dev`.
- After altering tables, ensure migrations are applied; `job_applications` **requires** `location` and `job_type` columns for current app code — see migration `20260327240000_job_applications_location_job_type.sql`.

---

*Last updated: 2026-03-27 — production domain thejobhunch.com, `lib/site-url.ts` for auth base URL.*
