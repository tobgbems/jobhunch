"use server";

import { revalidatePath } from "next/cache";
import type { JobFormStatus, AdminJobType, JobListStatus } from "@/lib/admin-jobs";
import { getAdminContext } from "@/lib/require-admin";

const JOB_TYPES = new Set<AdminJobType>(["full-time", "part-time", "contract", "remote", "hybrid"]);
const FORM_STATUSES = new Set<JobFormStatus>(["open", "closed", "draft"]);

function normalizeApplyUrl(url: string): string {
  const t = url.trim();
  if (!t) {
    return "";
  }
  if (/^https?:\/\//i.test(t)) {
    return t;
  }
  return `https://${t}`;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function searchCompanies(query: string): Promise<
  { ok: true; rows: { id: string; name: string; industry: string | null }[] } | { ok: false; error: string }
> {
  const ctx = await getAdminContext();
  if (!ctx) {
    return { ok: false, error: "Unauthorized" };
  }

  const q = query.trim();
  if (q.length < 1) {
    return { ok: true, rows: [] };
  }

  const safe = q.replace(/[%_]/g, "").trim();
  if (!safe) {
    return { ok: true, rows: [] };
  }

  const pattern = `%${safe}%`;
  const { data, error } = await ctx.supabase
    .from("companies")
    .select("id,name,industry")
    .ilike("name", pattern)
    .order("name", { ascending: true })
    .limit(50);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, rows: (data ?? []) as { id: string; name: string; industry: string | null }[] };
}

export async function createJob(input: {
  title: string;
  companyId: string;
  location: string;
  jobType: AdminJobType;
  industry: string;
  salaryRange: string;
  description: string;
  responsibilities: string;
  requirements: string;
  applyUrl: string;
  status: JobFormStatus;
}): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) {
    return { ok: false, error: "Unauthorized" };
  }

  const title = input.title.trim();
  const location = input.location.trim();
  const description = input.description.trim();
  const applyUrl = normalizeApplyUrl(input.applyUrl);
  const industry = input.industry.trim();

  if (!title || !location || !description || !applyUrl) {
    return { ok: false, error: "Please fill all required fields." };
  }
  if (!JOB_TYPES.has(input.jobType)) {
    return { ok: false, error: "Invalid job type." };
  }
  if (!FORM_STATUSES.has(input.status)) {
    return { ok: false, error: "Invalid status." };
  }

  const { data: company, error: companyError } = await ctx.supabase
    .from("companies")
    .select("id,name")
    .eq("id", input.companyId)
    .maybeSingle();

  if (companyError || !company) {
    return { ok: false, error: "Company not found." };
  }

  if (industry) {
    const { error: indErr } = await ctx.supabase
      .from("companies")
      .update({ industry })
      .eq("id", company.id);
    if (indErr) {
      return { ok: false, error: indErr.message };
    }
  }

  const now = new Date().toISOString();
  const { error } = await ctx.supabase.from("jobs").insert({
    company_id: company.id,
    company_name: company.name,
    title,
    location,
    job_type: input.jobType,
    description,
    responsibilities: input.responsibilities.trim() || null,
    requirements: input.requirements.trim() || null,
    salary_range: input.salaryRange.trim() || null,
    apply_url: applyUrl,
    source: "manual",
    status: input.status,
    last_seen_at: now,
    posted_at: now,
    is_scraped: false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath("/jobs", "layout");
  return { ok: true };
}

export async function updateJob(
  jobId: string,
  input: {
    title: string;
    companyId: string;
    location: string;
    jobType: AdminJobType;
    industry: string;
    salaryRange: string;
    description: string;
    responsibilities: string;
    requirements: string;
    applyUrl: string;
    status: JobFormStatus;
  },
): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) {
    return { ok: false, error: "Unauthorized" };
  }

  const title = input.title.trim();
  const location = input.location.trim();
  const description = input.description.trim();
  const applyUrl = normalizeApplyUrl(input.applyUrl);
  const industry = input.industry.trim();

  if (!title || !location || !description || !applyUrl) {
    return { ok: false, error: "Please fill all required fields." };
  }
  if (!JOB_TYPES.has(input.jobType)) {
    return { ok: false, error: "Invalid job type." };
  }
  if (!FORM_STATUSES.has(input.status)) {
    return { ok: false, error: "Invalid status." };
  }

  const { data: company, error: companyError } = await ctx.supabase
    .from("companies")
    .select("id,name")
    .eq("id", input.companyId)
    .maybeSingle();

  if (companyError || !company) {
    return { ok: false, error: "Company not found." };
  }

  if (industry) {
    const { error: indErr } = await ctx.supabase
      .from("companies")
      .update({ industry })
      .eq("id", company.id);
    if (indErr) {
      return { ok: false, error: indErr.message };
    }
  }

  const { error } = await ctx.supabase
    .from("jobs")
    .update({
      company_id: company.id,
      company_name: company.name,
      title,
      location,
      job_type: input.jobType,
      description,
      responsibilities: input.responsibilities.trim() || null,
      requirements: input.requirements.trim() || null,
      salary_range: input.salaryRange.trim() || null,
      apply_url: applyUrl,
      status: input.status,
    })
    .eq("id", jobId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}/edit`);
  revalidatePath("/jobs");
  revalidatePath("/jobs", "layout");
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

export async function toggleJobStatusOpenClosed(jobId: string): Promise<ActionResult & { status?: JobListStatus }> {
  const ctx = await getAdminContext();
  if (!ctx) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: row, error: fetchError } = await ctx.supabase
    .from("jobs")
    .select("status")
    .eq("id", jobId)
    .maybeSingle();

  if (fetchError || !row) {
    return { ok: false, error: fetchError?.message ?? "Job not found." };
  }

  const s = row.status as JobListStatus;
  if (s !== "open" && s !== "closed") {
    return { ok: false, error: "Toggle is only available for open or closed jobs." };
  }

  const next = s === "open" ? "closed" : "open";
  const { error } = await ctx.supabase.from("jobs").update({ status: next }).eq("id", jobId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath("/jobs", "layout");
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true, status: next };
}

export async function softDeleteJob(jobId: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) {
    return { ok: false, error: "Unauthorized" };
  }

  const { error } = await ctx.supabase.from("jobs").update({ status: "deleted" }).eq("id", jobId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath("/jobs", "layout");
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}
