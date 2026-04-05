import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Browse companies",
  description:
    "Explore companies on JobHunch. Read anonymous employee reviews and discover workplaces across Nigeria and Africa.",
};

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  location: string | null;
  logo_url: string | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const cardHover =
  "border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]";

export default async function CompaniesPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id,name,slug,industry,location,logo_url")
    .order("name", { ascending: true })
    .limit(500);

  const companies = (data ?? []) as CompanyRow[];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0D0D0D] antialiased">
      <LandingNavbar />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-6">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-semibold text-[#0D0D0D] md:text-3xl">Companies</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Browse organizations with reviews and open roles on JobHunch.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-[#6B7280]">Could not load companies. Please try again later.</p>
        ) : null}

        {!error && !companies.length ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            No companies yet.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link key={c.id} href={`/company/${encodeURIComponent(c.slug)}`} className="block">
              <Card className={`h-full overflow-hidden rounded-xl ${cardHover}`}>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start gap-4">
                    {c.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logo_url}
                        alt=""
                        className="size-12 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#27AE60]/10 text-base font-semibold text-[#27AE60]">
                        {getInitials(c.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-[#0D0D0D]">{c.name}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6B7280]">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="size-3.5 shrink-0" aria-hidden />
                          {c.industry ?? "Industry"}
                        </span>
                        <span className="text-[#E5E7EB]">·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                          {c.location ?? "Location"}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
