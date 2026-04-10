import type { Metadata } from "next";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { PublicJobsList, type PublicJobListItem } from "@/components/jobs/PublicJobsList";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Browse Jobs in Nigeria | JobHunch",
  description:
    "Find jobs at top Nigerian and African companies. Browse curated roles by location, job type, and industry — read company reviews and apply with confidence on JobHunch.",
  openGraph: {
    title: "Browse Jobs in Nigeria | JobHunch",
    description:
      "Find jobs at top Nigerian and African companies. Browse curated roles and read company reviews on JobHunch.",
    type: "website",
    url: "https://thejobhunch.com/jobs",
    images: [{ url: "/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Jobs in Nigeria | JobHunch",
    description:
      "Find jobs at top Nigerian and African companies. Browse curated roles on JobHunch.",
    images: ["/og-image.png"],
  },
};

function embedCompany(
  companies: { slug: string; industry: string | null } | { slug: string; industry: string | null }[] | null,
): { slug: string | null; industry: string | null } {
  if (!companies) return { slug: null, industry: null };
  if (Array.isArray(companies)) {
    const c = companies[0];
    return { slug: c?.slug ?? null, industry: c?.industry ?? null };
  }
  return { slug: companies.slug, industry: companies.industry };
}

export default async function JobsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id,title,company_name,location,job_type,posted_at,company_id, companies(slug,industry)",
    )
    .eq("status", "open")
    .order("posted_at", { ascending: false, nullsFirst: false });

  const rows = (data ?? []) as {
    id: string;
    title: string;
    company_name: string;
    location: string | null;
    job_type: string | null;
    posted_at: string | null;
    company_id: string | null;
    companies: { slug: string; industry: string | null } | { slug: string; industry: string | null }[] | null;
  }[];

  const jobs: PublicJobListItem[] = rows.map((row) => {
    const { slug, industry } = embedCompany(row.companies);
    return {
      id: row.id,
      title: row.title,
      companyName: row.company_name,
      companySlug: slug,
      industry,
      location: row.location,
      jobType: row.job_type,
      postedAt: row.posted_at,
    };
  });

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0D0D0D] antialiased">
      <LandingNavbar />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-6">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-semibold text-[#0D0D0D] md:text-3xl">Jobs</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Open roles from companies on JobHunch. Visit a company profile for reviews and culture insights.
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

        {!error && jobs.length > 0 ? <PublicJobsList jobs={jobs} /> : null}
      </main>
      <LandingFooter />
    </div>
  );
}
