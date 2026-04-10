import { notFound } from "next/navigation";
import { AdminJobForm } from "@/components/admin/AdminJobForm";
import type { JobFormStatus } from "@/lib/admin-jobs";
import { requireAdmin } from "@/lib/require-admin";

type CompanyIndustry = { industry: string | null };

function embedCompany(
  companies: CompanyIndustry | CompanyIndustry[] | null,
): CompanyIndustry | null {
  if (!companies) {
    return null;
  }
  if (Array.isArray(companies)) {
    return companies[0] ?? null;
  }
  return companies;
}

type AdminEditJobPageProps = {
  params: { id: string };
};

export default async function AdminEditJobPage({ params }: AdminEditJobPageProps) {
  const { supabase } = await requireAdmin();

  const { data: job, error } = await supabase
    .from("jobs")
    .select(
      "id,company_id,company_name,title,location,job_type,description,responsibilities,requirements,salary_range,apply_url,status, companies(industry)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !job) {
    notFound();
  }

  const row = job as {
    id: string;
    company_id: string | null;
    company_name: string;
    title: string;
    location: string | null;
    job_type: string | null;
    description: string | null;
    responsibilities: string | null;
    requirements: string | null;
    salary_range: string | null;
    apply_url: string | null;
    status: string;
    companies: CompanyIndustry | CompanyIndustry[] | null;
  };

  const company = embedCompany(row.companies);
  const formStatus: JobFormStatus =
    row.status === "open" || row.status === "closed" || row.status === "draft" ? row.status : "draft";

  const { data: companies } = await supabase
    .from("companies")
    .select("id,name,industry")
    .order("name", { ascending: true })
    .limit(500);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Edit Job</h1>
        <p className="mt-1 text-sm text-slate-400">Update listing fields and visibility.</p>
      </div>
      <AdminJobForm
        mode="edit"
        jobId={row.id}
        initialCompanies={(companies ?? []) as { id: string; name: string; industry: string | null }[]}
        defaultValues={{
          title: row.title,
          companyId: row.company_id,
          companyName: row.company_name,
          companyIndustry: company?.industry ?? null,
          location: row.location ?? "",
          jobType: row.job_type,
          industryField: company?.industry ?? "",
          salaryRange: row.salary_range ?? "",
          description: row.description ?? "",
          responsibilities: row.responsibilities ?? "",
          requirements: row.requirements ?? "",
          applyUrl: row.apply_url ?? "",
          status: formStatus,
        }}
      />
    </div>
  );
}
