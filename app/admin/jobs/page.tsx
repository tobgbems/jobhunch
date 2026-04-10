import Link from "next/link";
import { Suspense } from "react";
import { AdminJobRowActions } from "@/components/admin/AdminJobRowActions";
import { AdminJobsFilters } from "@/components/admin/AdminJobsFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ADMIN_JOB_PAGE_SIZE } from "@/lib/admin-jobs";
import type { JobListStatus } from "@/lib/admin-jobs";
import { requireAdmin } from "@/lib/require-admin";

const VALID_STATUS = new Set(["open", "closed", "draft", "deleted"]);
const VALID_SOURCE = new Set(["manual", "jobberman", "myjobmag"]);

function formatAdminDate(iso: string | null) {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function statusBadgeVariant(s: string): "success" | "muted" | "warning" | "destructive" | "outline" {
  if (s === "open") {
    return "success";
  }
  if (s === "closed") {
    return "muted";
  }
  if (s === "draft") {
    return "warning";
  }
  if (s === "deleted") {
    return "destructive";
  }
  return "outline";
}

function buildJobsListUrl(opts: { page?: number; status?: string; source?: string }) {
  const params = new URLSearchParams();
  if (opts.status && VALID_STATUS.has(opts.status)) {
    params.set("status", opts.status);
  }
  if (opts.source && VALID_SOURCE.has(opts.source)) {
    params.set("source", opts.source);
  }
  if (opts.page && opts.page > 1) {
    params.set("page", String(opts.page));
  }
  const q = params.toString();
  return q ? `/admin/jobs?${q}` : "/admin/jobs";
}

type AdminJobsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function AdminJobsPage({ searchParams }: AdminJobsPageProps) {
  const { supabase } = await requireAdmin();

  const rawStatus = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const rawSource = typeof searchParams.source === "string" ? searchParams.source : undefined;
  const rawPage = typeof searchParams.page === "string" ? searchParams.page : undefined;

  const statusFilter = rawStatus && VALID_STATUS.has(rawStatus) ? rawStatus : undefined;
  const sourceFilter = rawSource && VALID_SOURCE.has(rawSource) ? rawSource : undefined;

  let countQuery = supabase.from("jobs").select("*", { count: "exact", head: true });
  if (statusFilter) {
    countQuery = countQuery.eq("status", statusFilter);
  }
  if (sourceFilter) {
    countQuery = countQuery.eq("source", sourceFilter);
  }
  const { count } = await countQuery;

  const total = count ?? 0;
  const parsedPage = parseInt(rawPage ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_JOB_PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage), totalPages);
  const from = (page - 1) * ADMIN_JOB_PAGE_SIZE;
  const to = from + ADMIN_JOB_PAGE_SIZE - 1;

  let dataQuery = supabase
    .from("jobs")
    .select("id,title,company_name,location,source,status,posted_at,last_seen_at,created_at")
    .order("created_at", { ascending: false });
  if (statusFilter) {
    dataQuery = dataQuery.eq("status", statusFilter);
  }
  if (sourceFilter) {
    dataQuery = dataQuery.eq("source", sourceFilter);
  }
  const { data: rows, error } = await dataQuery.range(from, to);

  const jobs = (rows ?? []) as {
    id: string;
    title: string;
    company_name: string;
    location: string | null;
    source: string | null;
    status: string;
    posted_at: string | null;
    last_seen_at: string | null;
    created_at: string;
  }[];

  const prevHref =
    page > 1
      ? buildJobsListUrl({ page: page - 1, status: statusFilter, source: sourceFilter })
      : null;
  const nextHref =
    page < totalPages
      ? buildJobsListUrl({ page: page + 1, status: statusFilter, source: sourceFilter })
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Jobs</h1>
          <p className="mt-1 text-sm text-slate-400">Manage listings, sources, and visibility.</p>
        </div>
        <Link
          href="/admin/jobs/new"
          className={cn(
            buttonVariants({ size: "default" }),
            "bg-[#27AE60] text-white hover:bg-[#219653] sm:self-start",
          )}
        >
          + Add New Job
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="h-10 animate-pulse rounded-lg bg-slate-800 text-sm text-slate-500 px-3 py-2">
            Loading filters…
          </div>
        }
      >
        <AdminJobsFilters />
      </Suspense>

      {error ? (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error.message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/40">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">Title</TableHead>
              <TableHead className="text-slate-400">Company</TableHead>
              <TableHead className="text-slate-400">Location</TableHead>
              <TableHead className="text-slate-400">Source</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Posted</TableHead>
              <TableHead className="text-slate-400">Last seen</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                  No jobs match these filters.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} className="border-slate-700">
                  <TableCell className="max-w-[200px] truncate font-medium text-slate-100">{job.title}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-slate-300">{job.company_name}</TableCell>
                  <TableCell className="text-slate-300">{job.location ?? "—"}</TableCell>
                  <TableCell className="text-slate-300">{job.source ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(job.status)} className="capitalize">
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">{formatAdminDate(job.posted_at)}</TableCell>
                  <TableCell className="text-slate-400">{formatAdminDate(job.last_seen_at)}</TableCell>
                  <TableCell className="text-right">
                    <AdminJobRowActions jobId={job.id} status={job.status as JobListStatus} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <p>
          Page {page} of {totalPages} · {total} job{total === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          {prevHref ? (
            <Link
              href={prevHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700",
              )}
            >
              Previous
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="border-slate-700 opacity-40" disabled>
              Previous
            </Button>
          )}
          {nextHref ? (
            <Link
              href={nextHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700",
              )}
            >
              Next
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="border-slate-700 opacity-40" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
