import { createClient } from "@/lib/supabase/server";
import { DashboardHome, type DashboardRecentReview } from "@/components/dashboard/DashboardHome";

export default async function DashboardHomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ count: companiesCount }, { count: reviewsCount }, { count: jobsCount }, { count: applicationsCount }] =
    await Promise.all([
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase.from("reviews").select("*", { count: "exact", head: true }),
      supabase.from("jobs").select("*", { count: "exact", head: true }),
      supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "there";
  const firstName = displayName.trim().split(/\s+/)[0] || "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const { data: recentRows } = await supabase
    .from("public_reviews")
    .select("id, company_id, company_name, job_title, rating_overall, pros, reviewer_name, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  const ids = Array.from(new Set((recentRows ?? []).map((r) => r.company_id as string)));
  let slugByCompanyId = new Map<string, string>();
  if (ids.length) {
    const { data: slugRows } = await supabase.from("companies").select("id, slug").in("id", ids);
    slugByCompanyId = new Map((slugRows ?? []).map((row) => [row.id as string, row.slug as string]));
  }

  const recentReviews: DashboardRecentReview[] = (recentRows ?? [])
    .map((r) => ({
      id: r.id as string,
      company_name: r.company_name as string,
      job_title: r.job_title as string,
      rating_overall: Number(r.rating_overall),
      pros: r.pros as string,
      reviewer_name: r.reviewer_name as string,
      company_slug: slugByCompanyId.get(r.company_id as string) ?? "",
    }))
    .filter((r) => r.company_slug.length > 0);

  return (
    <DashboardHome
      firstName={firstName}
      greeting={greeting}
      stats={{
        companies: companiesCount ?? 0,
        reviews: reviewsCount ?? 0,
        jobs: jobsCount ?? 0,
        myApplications: applicationsCount ?? 0,
      }}
      recentReviews={recentReviews}
    />
  );
}
