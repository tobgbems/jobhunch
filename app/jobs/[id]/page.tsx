import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, Briefcase, Calendar, MapPin } from "lucide-react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { TrackJobButton } from "@/components/jobs/TrackJobButton";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 120;

const META_DESC_MAX = 160;

function truncateMetaDescription(text: string, max = META_DESC_MAX) {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
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
    hybrid: "Hybrid",
  };
  return map[type] ?? type;
}

function normalizeUrl(url: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

type CompanyRel = {
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string | null;
};

type JobDetailRow = {
  id: string;
  company_id: string | null;
  title: string;
  company_name: string;
  location: string | null;
  job_type: string | null;
  description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  salary_range: string | null;
  apply_url: string | null;
  posted_at: string | null;
  status: string;
  companies: CompanyRel | CompanyRel[] | null;
};

function embedCompany(
  companies: CompanyRel | CompanyRel[] | null,
): CompanyRel | null {
  if (!companies) return null;
  if (Array.isArray(companies)) return companies[0] ?? null;
  return companies;
}

async function getOpenJob(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id,company_id,title,company_name,location,job_type,description,responsibilities,requirements,salary_range,apply_url,posted_at,status, companies(name,slug,logo_url,industry)",
    )
    .eq("id", id)
    .eq("status", "open")
    .maybeSingle();

  if (error || !data) return null;
  return data as JobDetailRow;
}

function buildMetaDescription(job: JobDetailRow): string {
  const company = embedCompany(job.companies);
  const parts = [
    job.description,
    job.salary_range ? `Salary: ${job.salary_range}` : null,
    job.location ? `Location: ${job.location}` : null,
    company?.name ? `at ${company.name}` : job.company_name,
  ].filter(Boolean);
  const raw = parts.join(" · ") || `${job.title} — ${job.company_name}`;
  return truncateMetaDescription(raw);
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await getOpenJob(params.id);
  if (!job) {
    return {
      title: "Job | JobHunch",
      description: "Browse jobs and company reviews on JobHunch.",
    };
  }
  const company = embedCompany(job.companies);
  const companyLabel = company?.name ?? job.company_name;
  const title = `${job.title} at ${companyLabel} | JobHunch`;
  const description = buildMetaDescription(job);
  const url = `https://thejobhunch.com/jobs/${encodeURIComponent(job.id)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
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

export default async function PublicJobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const job = await getOpenJob(params.id);

  if (!job) {
    notFound();
  }

  const company = embedCompany(job.companies);
  const applyHref = normalizeUrl(job.apply_url);
  const companyHref = company?.slug ? `/company/${encodeURIComponent(company.slug)}` : null;
  const logoUrl = company?.logo_url?.trim() ? company.logo_url.trim() : null;

  const companyId = job.company_id;

  let moreJobs: { id: string; title: string; location: string | null; job_type: string | null; posted_at: string | null }[] =
    [];
  if (companyId) {
    const { data: related } = await supabase
      .from("jobs")
      .select("id,title,location,job_type,posted_at")
      .eq("company_id", companyId)
      .eq("status", "open")
      .neq("id", job.id)
      .order("posted_at", { ascending: false, nullsFirst: false })
      .limit(8);
    moreJobs = (related ?? []) as typeof moreJobs;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0D0D0D] antialiased">
      <LandingNavbar />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-6">
        <article className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {logoUrl ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F7F8FA]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
                  </div>
                ) : (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#27AE60] text-lg font-bold text-white">
                    {(company?.name ?? job.company_name).trim().charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Job listing</p>
                  <h1 className="text-2xl font-bold leading-tight md:text-3xl">{job.title}</h1>
                  <p className="text-base text-[#6B7280]">
                    {companyHref ? (
                      <Link
                        href={companyHref}
                        className="font-semibold text-[#27AE60] underline-offset-4 hover:underline"
                      >
                        {company?.name ?? job.company_name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-[#0D0D0D]">{job.company_name}</span>
                    )}
                  </p>
                  {company?.industry ? (
                    <p className="text-sm text-[#6B7280]">{company.industry}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-xs font-medium text-[#0D0D0D]">
                  <MapPin className="size-3.5 text-[#6B7280]" aria-hidden />
                  {job.location ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-xs font-medium text-[#0D0D0D]">
                  <Briefcase className="size-3.5 text-[#6B7280]" aria-hidden />
                  {formatJobType(job.job_type)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-xs font-medium text-[#0D0D0D]">
                  <Calendar className="size-3.5 text-[#6B7280]" aria-hidden />
                  Posted {formatDate(job.posted_at)}
                </span>
                {job.salary_range ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-xs font-medium text-[#0D0D0D]">
                    {job.salary_range}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:max-w-xs md:shrink-0">
              {applyHref ? (
                <a
                  href={applyHref}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "h-11 w-full gap-2 bg-[#27AE60] font-medium text-white hover:bg-[#229954]",
                  )}
                >
                  Apply now
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              ) : (
                <Button disabled className="h-11 w-full">
                  Apply now (link unavailable)
                </Button>
              )}
              <TrackJobButton
                jobId={job.id}
                companyName={job.company_name}
                jobTitle={job.title}
                location={job.location}
                jobType={job.job_type}
                applyUrl={job.apply_url}
              />
            </div>
          </div>

          <div className="mt-10 space-y-8 border-t border-[#E5E7EB] pt-8">
            {job.description ? (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-[#0D0D0D]">About the role</h2>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#374151]">{job.description}</div>
              </section>
            ) : null}
            {job.responsibilities ? (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-[#0D0D0D]">Responsibilities</h2>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#374151]">
                  {job.responsibilities}
                </div>
              </section>
            ) : null}
            {job.requirements ? (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-[#0D0D0D]">Requirements</h2>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#374151]">{job.requirements}</div>
              </section>
            ) : null}
            {!job.description && !job.responsibilities && !job.requirements ? (
              <p className="text-sm text-[#6B7280]">
                Full description not available on JobHunch yet. Use Apply now to view details on the company&apos;s careers
                page.
              </p>
            ) : null}
          </div>
        </article>

        {moreJobs.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              More jobs at {company?.name ?? job.company_name}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {moreJobs.map((j) => (
                <li key={j.id}>
                  <Card className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                    <CardContent className="flex flex-col gap-2 p-4">
                      <Link
                        href={`/jobs/${j.id}`}
                        className="font-medium text-[#0D0D0D] underline-offset-4 hover:text-[#27AE60] hover:underline"
                      >
                        {j.title}
                      </Link>
                      <p className="text-xs text-[#6B7280]">
                        {j.location ?? "—"} · {formatJobType(j.job_type)} · Posted {formatDate(j.posted_at)}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <LandingFooter />
    </div>
  );
}
