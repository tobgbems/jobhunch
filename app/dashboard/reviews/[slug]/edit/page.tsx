"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ReviewWizard } from "@/components/reviews/ReviewWizard";

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
  company_name: string;
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
};

export default function EditReviewPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("reviewId");
  const supabase = React.useMemo(() => createClient(), []);

  const [initialCompany, setInitialCompany] = React.useState<Company | null>(null);
  const [initialReview, setInitialReview] = React.useState<PublicReview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!reviewId) {
        setInitialReview(null);
        setInitialCompany(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const { data: companyData, error: companyErr } = await supabase
          .from("companies")
          .select("id,name,slug,industry,location,logo_url,website")
          .eq("slug", params.slug)
          .maybeSingle();
        if (companyErr) throw companyErr;

        const { data: reviewData, error: reviewErr } = await supabase
          .from("public_reviews")
          .select("*")
          .eq("id", reviewId)
          .maybeSingle();
        if (reviewErr) throw reviewErr;

        if (cancelled) return;

        if (companyData) setInitialCompany(companyData as Company);
        if (reviewData) {
          const r = reviewData as any;
          const mapped: PublicReview = {
            id: r.id,
            company_id: r.company_id,
            company_name: r.company_name,
            is_anonymous: r.is_anonymous,
            job_title: r.job_title,
            employment_status: r.employment_status,
            rating_overall: r.rating_overall,
            rating_culture: r.rating_culture,
            rating_management: r.rating_management,
            rating_growth: r.rating_growth,
            rating_worklife: r.rating_worklife,
            pros: r.pros,
            cons: r.cons,
          };
          setInitialReview(mapped);
        }
      } catch {
        if (!cancelled) {
          setInitialCompany(null);
          setInitialReview(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.slug, reviewId, supabase]);

  if (isLoading) {
    return <section className="text-sm text-muted-foreground">Loading…</section>;
  }

  if (!reviewId || !initialCompany || !initialReview) {
    return (
      <section className="rounded-xl border border-[#E6E7EA] bg-white p-6 text-sm text-[#5A5A5A] shadow-sm">
        Could not load the review to edit.
        <div className="mt-4">
          <button className="text-primary underline-offset-4 hover:underline" onClick={() => router.push(`/dashboard/reviews/${params.slug}`)}>
            Back to company
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#E6E7EA] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#5A5A5A]">Reviews</p>
            <h1 className="text-2xl font-bold text-[#0D0D0D]">Edit your review</h1>
          </div>
          <button
            className="text-[#27AE60] underline-offset-4 hover:underline"
            onClick={() => router.push(`/dashboard/reviews/${params.slug}`)}
            type="button"
          >
            Back
          </button>
        </div>
      </div>

      <ReviewWizard
        mode="edit"
        initialCompany={initialCompany}
        initialReview={initialReview}
        onSuccess={(slug) => router.push(`/dashboard/reviews/${slug}`)}
      />
    </section>
  );
}

