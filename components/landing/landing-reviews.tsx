import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StarRating } from "@/components/reviews/StarRating";

type FeaturedReview = {
  id: string;
  company_id: string;
  company_name: string;
  job_title: string | null;
  employment_status: "current" | "former";
  rating_overall: number;
  pros: string;
  cons: string;
  company_slug: string | null;
};

function truncateText(value: string, maxLength = 100) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}...`;
}

function employmentLabel(value: "current" | "former") {
  return value === "current" ? "Current employee" : "Former employee";
}

export async function LandingReviews() {
  const supabase = createClient();

  const { data: reviewRows } = await supabase
    .from("public_reviews")
    .select("id,company_id,company_name,job_title,employment_status,rating_overall,pros,cons")
    .order("rating_overall", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  const baseReviews = (reviewRows ?? []) as Omit<FeaturedReview, "company_slug">[];
  const companyIds = Array.from(new Set(baseReviews.map((review) => review.company_id)));

  let slugByCompanyId: Record<string, string> = {};
  if (companyIds.length > 0) {
    const { data: companyRows } = await supabase.from("companies").select("id,slug").in("id", companyIds);
    slugByCompanyId = Object.fromEntries((companyRows ?? []).map((company) => [company.id, company.slug]));
  }

  const featuredReviews: FeaturedReview[] = baseReviews.map((review) => ({
    ...review,
    company_slug: slugByCompanyId[review.company_id] ?? null,
  }));

  const allReviewsHref = featuredReviews[0]?.company_slug
    ? `/company/${encodeURIComponent(featuredReviews[0].company_slug)}`
    : "/dashboard/reviews";

  return (
    <section id="reviews" className="scroll-mt-24 border-b border-[#E5E7EB] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-[#27AE60]">Trusted insights</p>
        <h2 className="mt-2 text-balance text-center text-3xl font-bold tracking-tight text-[#0D0D0D] sm:text-4xl">
          Real reviews from African professionals
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-[#6B7280] sm:text-base">
          See honest feedback from current and former employees across top companies in Nigeria and Africa.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredReviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-[#E5E7EB] bg-[#FDFDFD] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[#0D0D0D]">{review.company_name}</p>
                  <p className="mt-1 text-sm text-[#6B7280]">{review.job_title ?? "Employee"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={Math.max(1, Math.min(5, Math.round(review.rating_overall)))} readOnly />
                  <span className="text-sm font-semibold text-[#0D0D0D]">{review.rating_overall.toFixed(1)}</span>
                </div>
              </div>

              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                {employmentLabel(review.employment_status)}
              </p>

              <div className="mt-4 grid gap-3">
                <div className="relative rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#27AE60]">Pros</p>
                  <p className="select-none text-sm leading-relaxed text-[#0D0D0D] blur-[2px]">
                    {truncateText(review.pros, 100)}
                  </p>
                  <Link
                    href="/login"
                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 text-xs font-semibold text-[#0D0D0D] backdrop-blur-[1px]"
                  >
                    Sign in to read full reviews -&gt;
                  </Link>
                </div>

                <div className="relative rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">Cons</p>
                  <p className="select-none text-sm leading-relaxed text-[#0D0D0D] blur-[2px]">
                    {truncateText(review.cons, 100)}
                  </p>
                  <Link
                    href="/login"
                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 text-xs font-semibold text-[#0D0D0D] backdrop-blur-[1px]"
                  >
                    Sign in to read full reviews -&gt;
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {featuredReviews.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-6 text-center text-sm text-[#6B7280]">
            No featured reviews yet.
          </div>
        ) : null}

        <div className="mt-8 flex justify-center">
          <Link
            href={allReviewsHref}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#27AE60] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#229954]"
          >
            Read all reviews
          </Link>
        </div>
      </div>
    </section>
  );
}
