import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Job listings",
  description:
    "Browse curated job openings across Nigerian and African companies. View roles and apply on JobHunch.",
};

type JobRow = {
  id: string;
  title: string;
  location: string | null;
  job_type: string | null;
  posted_at: string | null;
  apply_url: string | null;
  company_id: string | null;
  companySlug: string | null;
};

function embedCompanySlug(
  companies: { slug: string } | { slug: string }[] | null,
): string | null {
  if (!companies) return null;
  if (Array.isArray(companies)) return companies[0]?.slug ?? null;
  return companies.slug;
}

function normalizeUrl(url: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatJobType(type: string | null) {
  if (!type) return "—";
  const map: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
    remote: "Remote",
  };
  return map[type] ?? type;
}

export default async function JobsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("id,title,location,job_type,posted_at,apply_url,company_id, companies(slug)")
    .order("posted_at", { ascending: false, nullsFirst: false })
    .limit(100);

  const rows = (data ?? []) as {
    id: string;
    title: string;
    location: string | null;
    job_type: string | null;
    posted_at: string | null;
    apply_url: string | null;
    company_id: string | null;
    companies: { slug: string } | { slug: string }[] | null;
  }[];

  const jobs: JobRow[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    location: row.location,
    job_type: row.job_type,
    posted_at: row.posted_at,
    apply_url: row.apply_url,
    company_id: row.company_id,
    companySlug: embedCompanySlug(row.companies),
  }));

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0D0D0D] antialiased">
      <LandingNavbar />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-6">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-semibold text-[#0D0D0D] md:text-3xl">Jobs</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Open roles from companies on JobHunch. Visit a company profile for more context and reviews.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-[#6B7280]">Could not load jobs. Please try again later.</p>
        ) : null}

        {!error && !jobs.length ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            No listings right now. Check back soon.
          </div>
        ) : null}

        <div className="space-y-3">
          {jobs.map((job) => {
            const slug = job.companySlug;
            const companyHref = slug ? `/company/${encodeURIComponent(slug)}#jobs` : null;
            const applyHref = normalizeUrl(job.apply_url);

            return (
              <Card key={job.id} className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
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
                    {companyHref ? (
                      <Link
                        href={companyHref}
                        className="text-sm font-medium text-[#27AE60] underline-offset-4 hover:underline"
                      >
                        View company profile
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {applyHref ? (
                      <a href={applyHref} target="_blank" rel="noreferrer">
                        <Button className="bg-[#27AE60] text-white hover:bg-[#229954]">Apply</Button>
                      </a>
                    ) : (
                      <Button disabled>Apply</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
