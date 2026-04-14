import { AdminCompaniesTable } from "@/components/admin/AdminCompaniesTable";
import { requireAdmin } from "@/lib/require-admin";

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  size: string | null;
  website: string | null;
  description: string | null;
  created_at: string;
};

export default async function AdminCompaniesPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("companies")
    .select("id,name,slug,industry,size,website,description,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error.message}</p>
      ) : (
        <AdminCompaniesTable companies={(data ?? []) as CompanyRow[]} />
      )}
    </div>
  );
}
