"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  PenLine,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StarRating } from "@/components/reviews/StarRating";
import { cn } from "@/lib/utils";

type Company = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  location: string | null;
  logo_url: string | null;
  website: string | null;
};

type PublicReview = {
  id: string;
  company_id: string;
  is_owner: boolean;
  reviewer_name: string;
  is_anonymous: boolean;
  job_title: string;
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

function getEmploymentLabel(status: "current" | "former") {
  return status === "current" ? "Current Employee" : "Former Employee";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function displayReviewerName(r: PublicReview) {
  if (r.is_anonymous) return "Anonymous Employee";
  return r.reviewer_name;
}

function scoreAccentClass(score: number) {
  if (score >= 4) return "bg-[#27AE60]";
  if (score >= 3) return "bg-[#F5A623]";
  return "bg-[#EF4444]";
}

export default function CompanyReviewsPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  const [company, setCompany] = React.useState<Company | null>(null);
  const [reviews, setReviews] = React.useState<PublicReview[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteReviewId, setDeleteReviewId] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setDeleteError("");
      try {
        const { data: companyData, error: companyErr } = await supabase
          .from("companies")
          .select("id,name,slug,industry,location,logo_url,website")
          .eq("slug", params.slug)
          .maybeSingle();
        if (companyErr) throw companyErr;
        if (!companyData) throw new Error("Company not found.");
        if (cancelled) return;
        setCompany(companyData as Company);

        const { data: reviewsData, error: reviewsErr } = await supabase
          .from("public_reviews")
          .select("*")
          .eq("company_id", (companyData as Company).id)
          .order("created_at", { ascending: false });
        if (reviewsErr) throw reviewsErr;
        if (cancelled) return;
        setReviews((reviewsData ?? []) as PublicReview[]);
      } catch (e) {
        if (!cancelled) {
          setCompany(null);
          setReviews([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.slug, supabase]);

  const stats = React.useMemo(() => {
    if (!reviews.length) {
      return {
        overallAvg: 0,
        cultureAvg: 0,
        managementAvg: 0,
        growthAvg: 0,
        worklifeAvg: 0,
        count: 0,
      };
    }
    const sum = reviews.reduce(
      (acc, r) => {
        acc.overall += r.rating_overall;
        acc.culture += r.rating_culture;
        acc.management += r.rating_management;
        acc.growth += r.rating_growth;
        acc.worklife += r.rating_worklife;
        acc.count += 1;
        return acc;
      },
      { overall: 0, culture: 0, management: 0, growth: 0, worklife: 0, count: 0 },
    );
    const overallAvg = sum.overall / sum.count;
    return {
      overallAvg,
      cultureAvg: sum.culture / sum.count,
      managementAvg: sum.management / sum.count,
      growthAvg: sum.growth / sum.count,
      worklifeAvg: sum.worklife / sum.count,
      count: sum.count,
    };
  }, [reviews]);

  async function confirmDelete() {
    if (!deleteReviewId) return;
    setDeleteError("");
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", deleteReviewId);
      if (error) throw error;
      setDeleteOpen(false);
      setDeleteReviewId(null);
      setReviews((prev) => prev.filter((r) => r.id !== deleteReviewId));
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message?: string }).message) : "";
      setDeleteError(msg || "Failed to delete review.");
    }
  }

  const initials =
    company?.name
      .split(" ")
      .map((p) => p[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "";

  const ratingPills = stats.count
    ? [
        { label: "Culture", value: stats.cultureAvg },
        { label: "Management", value: stats.managementAvg },
        { label: "Growth", value: stats.growthAvg },
        { label: "Work-life", value: stats.worklifeAvg },
        { label: "Overall", value: stats.overallAvg },
      ]
    : [];

  return (
    <section className="relative space-y-8 pb-24">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Company reviews</p>
            <h1 className="text-[22px] font-semibold text-[#0D0D0D] md:text-2xl">
              {company?.name ?? (isLoading ? "Loading…" : "Company")}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-lg border-[#E5E7EB]"
              onClick={() => router.push("/dashboard/reviews")}
            >
              Back to companies
            </Button>
            <Button
              className="gap-2 rounded-lg bg-[#27AE60] font-medium text-white hover:bg-[#229954]"
              onClick={() =>
                router.push(`/dashboard/reviews/new?companySlug=${encodeURIComponent(params.slug)}`)
              }
            >
              <PenLine className="size-4" aria-hidden />
              Write a Review
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-[#6B7280]">Loading…</p> : null}

      {!isLoading && !company ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          Company not found.
        </div>
      ) : null}

      {company ? (
        <>
          <Card className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <CardContent className="space-y-8 p-8 md:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  {company.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={company.logo_url}
                      alt=""
                      className="size-16 shrink-0 rounded-2xl object-cover md:size-[64px]"
                    />
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#27AE60]/10 text-xl font-semibold text-[#27AE60] md:size-[64px] md:text-2xl">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 space-y-2">
                    <h2 className="text-[28px] font-bold leading-tight text-[#0D0D0D]">{company.name}</h2>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#6B7280]">
                      <span>{company.industry ?? "Industry"}</span>
                      <span className="text-[#E5E7EB]">·</span>
                      <span>{company.location ?? "Location"}</span>
                      <span className="text-[#E5E7EB]">·</span>
                      <Link
                        href={`/company/${encodeURIComponent(company.slug)}`}
                        className="font-medium text-[#27AE60] underline-offset-4 hover:underline"
                      >
                        Public page
                      </Link>
                      {company.website ? (
                        <>
                          <span className="text-[#E5E7EB]">·</span>
                          <a
                            className="inline-flex items-center gap-1 font-medium text-[#27AE60] underline-offset-4 hover:underline"
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {company.website.replace(/^https?:\/\//, "")}
                            <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 space-y-2 text-left lg:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Average overall</p>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <StarRating
                      value={Math.max(1, Math.min(5, Math.round(stats.overallAvg || 0)))}
                      readOnly
                    />
                    <span className="text-2xl font-bold text-[#0D0D0D]">
                      {stats.count ? stats.overallAvg.toFixed(1) : "—"}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    {stats.count ? `${stats.count} reviews` : "Be the first to review"}
                  </p>
                </div>
              </div>

              {ratingPills.length ? (
                <div className="flex flex-wrap gap-3">
                  {ratingPills.map((item) => (
                    <div
                      key={item.label}
                      className="inline-flex min-w-[7.5rem] flex-1 items-center justify-between gap-2 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-2 sm:min-w-0 sm:flex-none"
                    >
                      <span className="text-xs font-medium text-[#6B7280]">{item.label}</span>
                      <span className="flex items-center gap-2 text-sm font-semibold tabular-nums text-[#0D0D0D]">
                        <span
                          className={cn("size-2 shrink-0 rounded-full", scoreAccentClass(item.value))}
                          aria-hidden
                        />
                        {item.value.toFixed(1)}
                        <span className="text-xs font-normal text-[#6B7280]">/5</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-semibold text-[#0D0D0D]">Latest reviews</h3>
              <p className="text-xs text-[#6B7280]">Anonymous reviews appear as Anonymous Employee.</p>
            </div>

            <div className="grid gap-4">
              {reviews.length ? (
                reviews.map((r) => (
                  <Card
                    key={r.id}
                    className="group rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]"
                  >
                    <CardContent className="space-y-4 p-6 md:p-8">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#0D0D0D]">{displayReviewerName(r)}</p>
                            <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[12px] font-medium text-[#6B7280]">
                              {getEmploymentLabel(r.employment_status)}
                            </span>
                          </div>
                          <p className="text-sm text-[#0D0D0D]">{r.job_title}</p>
                        </div>
                        <p className="shrink-0 text-xs text-[#6B7280] sm:pt-0.5">{formatDate(r.created_at)}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <StarRating
                            value={Math.max(1, Math.min(5, Math.round(r.rating_overall || 0)))}
                            readOnly
                          />
                          <span className="text-sm font-semibold text-[#0D0D0D]">
                            {r.rating_overall.toFixed(1)}
                          </span>
                        </div>
                        {r.is_owner ? (
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#0D0D0D]"
                              aria-label="Edit review"
                              onClick={() =>
                                router.push(
                                  `/dashboard/reviews/${params.slug}/edit?reviewId=${encodeURIComponent(r.id)}`,
                                )
                              }
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-[#6B7280] hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete review"
                              onClick={() => {
                                setDeleteReviewId(r.id);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5">
                          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#27AE60]">
                            <ThumbsUp className="size-4" aria-hidden />
                            Pros
                          </p>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0D0D0D]">{r.pros}</p>
                        </div>
                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5">
                          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-600">
                            <ThumbsDown className="size-4" aria-hidden />
                            Cons
                          </p>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0D0D0D]">{r.cons}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  No reviews yet. Be the first to share your experience.
                </div>
              )}
            </div>
          </div>

          <Link
            href={`/dashboard/reviews/new?companySlug=${encodeURIComponent(params.slug)}`}
            className="fixed bottom-8 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-[#27AE60] text-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition hover:bg-[#229954] md:bottom-10 md:right-10"
            aria-label="Write a Review"
          >
            <PenLine className="size-6" aria-hidden />
          </Link>
        </>
      ) : null}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 text-[#0D0D0D] shadow-[0_16px_40px_rgba(0,0,0,0.20)] ring-1 ring-black/5 sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#0D0D0D]">Delete this review?</DialogTitle>
          </DialogHeader>
          {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-[#E5E7EB]"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="rounded-lg" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
