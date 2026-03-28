"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companySlug = searchParams.get("companySlug");

  const supabase = React.useMemo(() => createClient(), []);

  const [prefillCompany, setPrefillCompany] = React.useState<Company | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!companySlug) return;

    (async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id,name,slug,industry,location,logo_url,website")
        .eq("slug", companySlug)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) setPrefillCompany(data as Company);
    })();

    return () => {
      cancelled = true;
    };
  }, [companySlug, supabase]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#E6E7EA] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#5A5A5A]">Reviews</p>
            <h1 className="text-2xl font-bold text-[#0D0D0D]">Write a review</h1>
          </div>
        </div>
      </div>

      <ReviewWizard
        mode="create"
        initialCompany={prefillCompany}
        onSuccess={(slug) => router.push(`/dashboard/reviews/${slug}`)}
      />
    </section>
  );
}

