"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, MapPin, PenLine, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/StarRating";
import { cn } from "@/lib/utils";

type Company = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  location: string | null;
  logo_url: string | null;
};

type PublicReview = {
  company_id: string;
  rating_overall: number;
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

export default function ReviewsCompaniesPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  const [query, setQuery] = React.useState("");
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [statsByCompanyId, setStatsByCompanyId] = React.useState<
    Record<string, { avg: number; count: number }>
  >({});
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const q = query.trim();
        let companiesQuery = supabase
          .from("companies")
          .select("id,name,slug,industry,location,logo_url")
          .limit(24);

        if (q.length >= 1) {
          companiesQuery = companiesQuery.ilike("name", `%${q}%`);
        }

        const { data: companiesData, error: companiesErr } = await companiesQuery;
        if (companiesErr) throw companiesErr;

        const list = (companiesData ?? []) as Company[];
        if (cancelled) return;
        setCompanies(list);

        if (!list.length) {
          setStatsByCompanyId({});
          return;
        }

        const ids = list.map((c) => c.id);
        const { data: reviewsData, error: reviewsErr } = await supabase
          .from("public_reviews")
          .select("company_id,rating_overall")
          .in("company_id", ids);
        if (reviewsErr) throw reviewsErr;

        const stats: Record<string, { avg: number; count: number }> = {};
        for (const r of (reviewsData ?? []) as PublicReview[]) {
          const cur = stats[r.company_id] ?? { avg: 0, count: 0 };
          const nextCount = cur.count + 1;
          const nextAvg = (cur.avg * cur.count + r.rating_overall) / nextCount;
          stats[r.company_id] = { avg: nextAvg, count: nextCount };
        }
        if (!cancelled) setStatsByCompanyId(stats);
      } catch (e) {
        if (!cancelled) {
          setCompanies([]);
          setStatsByCompanyId({});
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, supabase]);

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-[22px] font-semibold text-[#0D0D0D] md:text-2xl">Company Reviews</h1>
            <p className="text-sm text-[#6B7280]">Discover what it&apos;s really like to work there</p>
          </div>

          <Button
            className="h-11 shrink-0 gap-2 rounded-lg bg-[#27AE60] font-medium text-white hover:bg-[#229954]"
            onClick={() => router.push("/dashboard/reviews/new")}
          >
            <PenLine className="size-4" aria-hidden />
            Write a Review
          </Button>
        </div>

        <div className="relative mt-6">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies by name"
            className="h-12 rounded-xl border-[#E5E7EB] bg-[#F7F8FA] pl-12 text-base shadow-none placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>

      {isLoading ? <p className="text-sm text-[#6B7280]">Loading…</p> : null}

      {!isLoading && !companies.length ? (
        <div
          className={cn(
            "rounded-xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280] shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
          )}
        >
          No companies found. Try a different search or write a new review.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => {
          const stat = statsByCompanyId[c.id];
          const avg = stat?.avg ?? 0;
          const count = stat?.count ?? 0;
          const roundedAvg = count ? Math.max(1, Math.min(5, Math.round(avg))) : 0;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => router.push(`/dashboard/reviews/${c.slug}`)}
              className="text-left"
            >
              <Card className={cn("h-full overflow-hidden rounded-xl", cardHover)}>
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
                      <Link
                        href={`/company/${encodeURIComponent(c.slug)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 inline-flex text-xs font-medium text-[#27AE60] underline-offset-4 hover:underline"
                      >
                        View public page
                      </Link>
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

                  <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[#F3F4F6] pt-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StarRating value={roundedAvg} readOnly />
                        <span className="text-sm font-semibold text-[#0D0D0D]">
                          {count ? avg.toFixed(1) : "—"}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        {count ? `(${count} reviews)` : "Be the first to review"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}
