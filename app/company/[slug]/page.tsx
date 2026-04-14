import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Building2, Users, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/StarRating";

type Company = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  location: string | null;
  website: string | null;
  size: string | null;
  description: string | null;
};

type Review = {
  id: string;
  is_anonymous: boolean;
  job_title: string | null;
  employment_status: "current" | "former";
  rating_overall: number;
  rating_culture: number;
  rating_management: number;
  rating_growth: number;
  rating_worklife: number;
  pros: string;
  cons: string;
  created_at: string;
};

type Job = {
  id: string;
  title: string;
  location: string | null;
  job_type: string | null;
  posted_at: string | null;
  apply_url: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatEmploymentStatus(status: "current" | "former") {
  return status === "current" ? "Current Employee" : "Former Employee";
}

function formatJobType(type: string | null) {
  if (!type) return "—";
  const map: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
    remote: "Remote",
    hybrid: "Hybrid",
  };
  return map[type] ?? type;
}

function normalizeUrl(url: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

const META_DESC_MAX = 160;

function truncateMetaDescription(text: string, max = META_DESC_MAX) {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

function computeStats(reviews: Review[]) {
  if (!reviews.length) {
    return {
      count: 0,
      overall: 0,
      culture: 0,
      management: 0,
      growth: 0,
      worklife: 0,
    };
  }

  const sum = reviews.reduce(
    (acc, review) => {
      acc.overall += review.rating_overall;
      acc.culture += review.rating_culture;
      acc.management += review.rating_management;
      acc.growth += review.rating_growth;
      acc.worklife += review.rating_worklife;
      return acc;
    },
    { overall: 0, culture: 0, management: 0, growth: 0, worklife: 0 },
  );

  return {
    count: reviews.length,
    overall: sum.overall / reviews.length,
    culture: sum.culture / reviews.length,
    management: sum.management / reviews.length,
    growth: sum.growth / reviews.length,
    worklife: sum.worklife / reviews.length,
  };
}

async function getCompanyData(slug: string) {
  const supabase = createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,slug,industry,location,website,size,description")
    .eq("slug", slug)
    .maybeSingle<Company>();

  if (!company) return null;

  const [{ data: reviews }, { data: jobs }] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id,is_anonymous,job_title,employment_status,rating_overall,rating_culture,rating_management,rating_growth,rating_worklife,pros,cons,created_at",
      )
      .eq("company_id", company.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("jobs")
      .select("id,title,location,job_type,posted_at,apply_url")
      .eq("company_id", company.id)
      .eq("status", "open")
      .order("posted_at", { ascending: false }),
  ]);

  return {
    company,
    reviews: (reviews ?? []) as Review[],
    jobs: (jobs ?? []) as Job[],
  };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const companyData = await getCompanyData(params.slug);
  if (!companyData) {
    return {
      title: "Company Reviews | JobHunch",
      description: "Read anonymous employee reviews and open roles on JobHunch.",
    };
  }

  const { company, reviews } = companyData;
  const count = reviews.length;
  const fallbackDescription = `Read anonymous employee reviews for ${company.name}. ${count} review${count === 1 ? "" : "s"} from current and former employees.`;
  const description =
    company.description && company.description.trim().length > 0
      ? truncateMetaDescription(company.description)
      : fallbackDescription;

  const title = `${company.name} Reviews – JobHunch`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://thejobhunch.com/company/${encodeURIComponent(company.slug)}`,
      images: [{ url: "/og-image.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function PublicCompanyPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const companyData = await getCompanyData(params.slug);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);

  if (!companyData) {
    notFound();
  }

  const { company, reviews, jobs } = companyData;
  const stats = computeStats(reviews);
  const websiteUrl = normalizeUrl(company.website);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0D0D0D] antialiased">
      <LandingNavbar />
      <main>
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-10">
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Company profile</p>
              <h1 className="text-3xl font-bold leading-tight">{company.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#6B7280]">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-4" aria-hidden />
                  {company.industry ?? "Industry not provided"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden />
                  {company.location ?? "Location not provided"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="size-4" aria-hidden />
                  {company.size ?? "Size not provided"}
                </span>
                {websiteUrl ? (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-[#27AE60] underline-offset-4 hover:underline"
                  >
                    {company.website?.replace(/^https?:\/\//, "")}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-left md:text-right">
              <p className="text-xs uppercase tracking-wide text-[#6B7280]">Average overall</p>
              <div className="mt-1 flex items-center gap-2 md:justify-end">
                <StarRating value={Math.round(stats.overall)} readOnly />
                <span className="text-2xl font-bold">{stats.count ? stats.overall.toFixed(1) : "—"}</span>
              </div>
              <p className="text-xs text-[#6B7280]">{stats.count} review{stats.count === 1 ? "" : "s"}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Overall", value: stats.overall },
              { label: "Culture", value: stats.culture },
              { label: "Management", value: stats.management },
              { label: "Growth", value: stats.growth },
              { label: "Work-life", value: stats.worklife },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">{item.label}</p>
                <p className="mt-1 text-lg font-semibold">{stats.count ? item.value.toFixed(1) : "—"}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="reviews" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Reviews</h2>
            <Link href={`/dashboard/reviews/new?companySlug=${encodeURIComponent(company.slug)}`}>
              <Button className="bg-[#27AE60] text-white hover:bg-[#229954]">Write a review</Button>
            </Link>
          </div>

          {!isLoggedIn ? (
            <div className="sticky top-4 z-10 rounded-xl border border-[#E5E7EB] bg-white/95 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.08)] backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium">Sign in to read full reviews</p>
                <Link href="/auth">
                  <Button className="bg-[#27AE60] text-white hover:bg-[#229954]">Sign in</Button>
                </Link>
              </div>
            </div>
          ) : null}

          {reviews.length === 0 ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280]">
              No reviews yet. Be the first to share your experience.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="rounded-xl border border-[#E5E7EB] bg-white">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{review.job_title ?? "Employee"}</p>
                        <p className="text-xs text-[#6B7280]">{formatEmploymentStatus(review.employment_status)}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <StarRating value={Math.max(1, Math.min(5, Math.round(review.rating_overall)))} readOnly />
                          <span className="text-sm font-semibold">{review.rating_overall.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-[#6B7280]">{formatDate(review.created_at)}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#27AE60]">Pros</p>
                        <div className="relative">
                          <p
                            className={[
                              "whitespace-pre-wrap text-sm leading-relaxed text-[#0D0D0D]",
                              !isLoggedIn ? "blur-[4px] select-none" : "",
                            ].join(" ")}
                          >
                            {review.pros}
                          </p>
                          {!isLoggedIn ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="rounded-full bg-black/75 px-3 py-1 text-xs font-medium text-white">
                                Sign in to read
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">Cons</p>
                        <div className="relative">
                          <p
                            className={[
                              "whitespace-pre-wrap text-sm leading-relaxed text-[#0D0D0D]",
                              !isLoggedIn ? "blur-[4px] select-none" : "",
                            ].join(" ")}
                          >
                            {review.cons}
                          </p>
                          {!isLoggedIn ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="rounded-full bg-black/75 px-3 py-1 text-xs font-medium text-white">
                                Sign in to read
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section id="jobs" className="space-y-4">
          <h2 className="text-2xl font-semibold">Open jobs</h2>
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280]">
              No open roles right now
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id} className="rounded-xl border border-[#E5E7EB] bg-white">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <p className="text-base font-semibold">{job.title}</p>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#6B7280]">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden />
                          {job.location ?? "—"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="size-3.5" aria-hidden />
                          {formatJobType(job.job_type)}
                        </span>
                        <span>Posted {formatDate(job.posted_at)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" className="border-[#27AE60] text-[#27AE60] hover:bg-[#27AE60]/5">
                          View listing
                        </Button>
                      </Link>
                      {job.apply_url ? (
                        <a href={normalizeUrl(job.apply_url) ?? undefined} target="_blank" rel="noreferrer">
                          <Button className="bg-[#27AE60] text-white hover:bg-[#229954]">Apply</Button>
                        </a>
                      ) : (
                        <Button disabled>Apply</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
