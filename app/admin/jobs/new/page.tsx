import { AdminJobForm } from "@/components/admin/AdminJobForm";
import { requireAdmin } from "@/lib/require-admin";

export default async function AdminNewJobPage() {
  const { supabase } = await requireAdmin();

  const { data: companies } = await supabase
    .from("companies")
    .select("id,name,industry")
    .order("name", { ascending: true })
    .limit(500);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Add New Job</h1>
        <p className="mt-1 text-sm text-slate-400">Create a manual listing. It will use source &quot;manual&quot;.</p>
      </div>
      <AdminJobForm
        mode="create"
        initialCompanies={(companies ?? []) as { id: string; name: string; industry: string | null }[]}
        defaultValues={{
          title: "",
          companyId: null,
          companyName: "",
          companyIndustry: null,
          location: "",
          jobType: "full-time",
          industryField: "",
          salaryRange: "",
          description: "",
          responsibilities: "",
          requirements: "",
          applyUrl: "",
          status: "open",
        }}
      />
    </div>
  );
}
