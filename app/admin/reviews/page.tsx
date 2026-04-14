import { AdminReviewsTable } from "@/components/admin/AdminReviewsTable";
import { requireAdmin } from "@/lib/require-admin";

type ReviewRow = {
  id: string;
  company_name: string;
  is_anonymous: boolean;
  reviewer_name: string;
  employment_status: "current" | "former";
  rating_overall: number;
  created_at: string;
};

export default async function AdminReviewsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("public_reviews")
    .select("id,company_name,is_anonymous,reviewer_name,employment_status,rating_overall,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error.message}</p>
      ) : (
        <AdminReviewsTable reviews={(data ?? []) as ReviewRow[]} />
      )}
    </div>
  );
}
