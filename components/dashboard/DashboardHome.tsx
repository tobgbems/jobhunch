import Link from "next/link";
import {
  Briefcase,
  Building2,
  ClipboardList,
  MessageSquare,
  PenLine,
  Plus,
  Search,
} from "lucide-react";
import { StarRating } from "@/components/reviews/StarRating";

export type DashboardRecentReview = {
  id: string;
  company_name: string;
  job_title: string;
  rating_overall: number;
  pros: string;
  reviewer_name: string;
  company_slug: string;
};

type DashboardHomeProps = {
  firstName: string;
  greeting: string;
  stats: {
    companies: number;
    reviews: number;
    jobs: number;
    myApplications: number;
  };
  recentReviews: DashboardRecentReview[];
};

const cardBase =
  "rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]";

function truncatePros(text: string, max = 100) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function DashboardHome({ firstName, greeting, stats, recentReviews }: DashboardHomeProps) {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[22px] font-semibold leading-tight text-[#0D0D0D] md:text-2xl">
          {greeting}, {firstName}!
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">Here&apos;s what&apos;s happening on JobHunch today.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={cardBase}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Companies Reviewed</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#0D0D0D]">{stats.companies}</p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#27AE60]/10">
              <Building2 className="size-5 text-[#27AE60]" aria-hidden />
            </span>
          </div>
        </div>
        <div className={cardBase}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Total Reviews</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#0D0D0D]">{stats.reviews}</p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#27AE60]/10">
              <MessageSquare className="size-5 text-[#27AE60]" aria-hidden />
            </span>
          </div>
        </div>
        <div className={cardBase}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Jobs Available</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#0D0D0D]">{stats.jobs}</p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#27AE60]/10">
              <Briefcase className="size-5 text-[#27AE60]" aria-hidden />
            </span>
          </div>
        </div>
        <div className={cardBase}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">My Applications</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#0D0D0D]">{stats.myApplications}</p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#F5A623]/15">
              <ClipboardList className="size-5 text-[#F5A623]" aria-hidden />
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-[#0D0D0D]">Quick actions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className={`${cardBase} flex flex-col gap-4 p-8`}>
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#27AE60]/10">
              <PenLine className="size-6 text-[#27AE60]" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0D0D0D]">Write a Review</h3>
              <p className="mt-1 text-sm text-[#6B7280]">Share your workplace experience</p>
            </div>
            <Link
              href="/dashboard/reviews/new"
              className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#27AE60] text-sm font-medium text-white transition hover:bg-[#229954]"
            >
              Get started
            </Link>
          </div>
          <div className={`${cardBase} flex flex-col gap-4 p-8`}>
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#27AE60]/10">
              <Search className="size-6 text-[#27AE60]" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0D0D0D]">Browse Jobs</h3>
              <p className="mt-1 text-sm text-[#6B7280]">Explore opportunities from top companies</p>
            </div>
            <Link
              href="/dashboard/jobs"
              className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#27AE60] text-sm font-medium text-white transition hover:bg-[#229954]"
            >
              Browse jobs
            </Link>
          </div>
          <div className={`${cardBase} flex flex-col gap-4 p-8`}>
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#27AE60]/10">
              <Plus className="size-6 text-[#27AE60]" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0D0D0D]">Track Application</h3>
              <p className="mt-1 text-sm text-[#6B7280]">Add a job you&apos;ve applied to</p>
            </div>
            <Link
              href="/dashboard/applications"
              className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#27AE60] text-sm font-medium text-white transition hover:bg-[#229954]"
            >
              Open tracker
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-[#0D0D0D]">Latest company reviews</h2>
        <div className="mt-4 space-y-4">
          {recentReviews.length === 0 ? (
            <div
              className={`${cardBase} p-8 text-sm text-[#6B7280]`}
            >
              No reviews yet. Be the first to share your experience.
            </div>
          ) : (
            recentReviews.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/reviews/${encodeURIComponent(r.company_slug)}`}
                className={`${cardBase} block p-6`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#0D0D0D]">{r.company_name}</p>
                    <p className="mt-0.5 text-sm text-[#6B7280]">{r.job_title}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <StarRating
                      value={Math.max(1, Math.min(5, Math.round(r.rating_overall)))}
                      readOnly
                    />
                    <span className="text-sm font-medium text-[#0D0D0D]">{r.rating_overall.toFixed(1)}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#6B7280]">
                  {r.reviewer_name === "Anonymous" ? "Anonymous Employee" : r.reviewer_name}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#0D0D0D]">
                  {truncatePros(r.pros)}
                </p>
              </Link>
            ))
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Link
            href="/dashboard/reviews"
            className="text-sm font-medium text-[#27AE60] underline-offset-4 hover:underline"
          >
            View all reviews
          </Link>
        </div>
      </div>
    </div>
  );
}
