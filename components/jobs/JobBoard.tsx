"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  Bookmark,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type JobRow = {
  id: string;
  company_id: string | null;
  company_name: string;
  company_slug: string | null;
  title: string;
  location: string | null;
  job_type: string | null;
  salary_range: string | null;
  responsibilities: string | null;
  requirements: string | null;
  apply_url: string | null;
  source: string | null;
  posted_at: string | null;
};

type RawJobRow = Omit<JobRow, "company_slug"> & {
  companies: { slug: string } | { slug: string }[] | null;
};

const PAGE_SIZE = 10;

const JOB_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
] as const;

const LOCATION_OPTIONS = [
  { value: "all", label: "All locations" },
  { value: "Lagos", label: "Lagos" },
  { value: "Abuja", label: "Abuja" },
  { value: "Nairobi", label: "Nairobi" },
  { value: "Remote", label: "Remote" },
] as const;

function formatJobTypeLabel(t: string | null) {
  if (!t) return "—";
  const map: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
    remote: "Remote",
    hybrid: "Hybrid",
  };
  return map[t] ?? t;
}

function formatPostedAt(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function hasText(value: string | null) {
  return Boolean(value?.trim());
}

function isRemoteLocation(location: string | null) {
  return (location ?? "").trim().toLowerCase() === "remote";
}

function matchesJobType(job: JobRow, filter: string) {
  if (filter === "all") return true;
  if (filter === "remote") {
    return isRemoteLocation(job.location) || job.job_type === "remote";
  }
  return job.job_type === filter;
}

function matchesLocation(job: JobRow, filter: string) {
  if (filter === "all") return true;
  const loc = (job.location ?? "").trim().toLowerCase();
  if (filter === "Remote") return loc === "remote";
  if (filter === "Lagos") return loc.includes("lagos");
  if (filter === "Abuja") return loc.includes("abuja");
  if (filter === "Nairobi") return loc.includes("nairobi");
  return false;
}

function matchesSearch(job: JobRow, q: string) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    job.title.toLowerCase().includes(s) ||
    job.company_name.toLowerCase().includes(s) ||
    (job.source ?? "").toLowerCase().includes(s)
  );
}

export function JobBoard() {
  const supabase = React.useMemo(() => createClient(), []);
  const [jobs, setJobs] = React.useState<JobRow[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [locationFilter, setLocationFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [detailJob, setDetailJob] = React.useState<JobRow | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,company_id,company_name,title,location,job_type,salary_range,responsibilities,requirements,apply_url,source,posted_at,companies(slug)",
        )
        .neq("status", "deleted")
        .order("posted_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setJobs([]);
      } else {
        const mapped = ((data ?? []) as RawJobRow[]).map((row) => {
          const relation = Array.isArray(row.companies) ? row.companies[0] : row.companies;
          const { companies, ...job } = row;
          return {
            ...job,
            company_slug: relation?.slug ?? null,
          };
        });
        setJobs(mapped);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filtered = React.useMemo(() => {
    return jobs.filter(
      (j) =>
        matchesSearch(j, search) && matchesJobType(j, typeFilter) && matchesLocation(j, locationFilter),
    );
  }, [jobs, search, typeFilter, locationFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [search, typeFilter, locationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openDetail = (job: JobRow) => {
    setDetailJob(job);
    setSaveStatus("idle");
    setSaveMessage(null);
  };

  const closeDetail = () => {
    setDetailJob(null);
    setSaveStatus("idle");
    setSaveMessage(null);
  };

  const applyInNewTab = (url: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const saveToTracker = async (job: JobRow) => {
    setSaveStatus("saving");
    setSaveMessage(null);
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      setSaveStatus("error");
      setSaveMessage("You must be signed in to save jobs.");
      return;
    }
    const { error } = await supabase.from("job_applications").insert({
      user_id: user.id,
      job_id: job.id,
      company_name: job.company_name,
      job_title: job.title,
      location: job.location,
      job_type: job.job_type,
      apply_url: job.apply_url,
      status: "saved",
    });
    if (error) {
      setSaveStatus("error");
      setSaveMessage(error.message);
      return;
    }
    setSaveStatus("saved");
    setSaveMessage("Saved to My Applications.");
  };

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-[22px] font-semibold text-[#0D0D0D] md:text-2xl">Job Board</h1>
        <p className="text-sm text-[#6B7280]">Opportunities from top African companies</p>
        <p className="mt-1 max-w-2xl text-xs text-[#6B7280]">
          Jobs are sourced from company career pages and updated regularly.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          type="search"
          placeholder="Search jobs or companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-lg border-[#E5E7EB] bg-[#F7F8FA] sm:min-w-[220px] sm:flex-1"
        />
        <div className="flex flex-col gap-1">
          <label
            htmlFor="job-board-type-filter"
            className="text-xs font-medium uppercase tracking-wide text-[#6B7280]"
          >
            Job Type
          </label>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
            <SelectTrigger
              id="job-board-type-filter"
              className="h-11 w-full rounded-lg border-[#E5E7EB] bg-white sm:w-[180px]"
            >
              <SelectValue placeholder="Job type" />
            </SelectTrigger>
            <SelectContent className="z-[80] border border-[#E5E7EB] bg-white text-[#0D0D0D] shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
              {JOB_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="job-board-location-filter"
            className="text-xs font-medium uppercase tracking-wide text-[#6B7280]"
          >
            Location
          </label>
          <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v ?? "all")}>
            <SelectTrigger
              id="job-board-location-filter"
              className="h-11 w-full rounded-lg border-[#E5E7EB] bg-white sm:w-[180px]"
            >
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent className="z-[80] border border-[#E5E7EB] bg-white text-[#0D0D0D] shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
              {LOCATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading jobs…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#E6E7EA] bg-white py-16 text-center">
          <Briefcase className="size-10 text-[#E6E7EA]" aria-hidden />
          <p className="text-sm font-medium text-[#0D0D0D]">No jobs match your search</p>
          <p className="max-w-sm text-xs text-[#6B7280]">Try clearing filters or searching with different keywords.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {pageSlice.map((job, i) => {
              const globalIndex = (safePage - 1) * PAGE_SIZE + i;
              const avatarGreen = globalIndex % 2 === 0;
              const letter = job.company_name.trim().charAt(0).toUpperCase() || "?";
              return (
                <li key={job.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetail(job)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDetail(job);
                      }
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] sm:flex-row sm:items-center sm:justify-between",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white",
                          avatarGreen ? "bg-[#27AE60]" : "bg-[#F5A623]",
                        )}
                        aria-hidden
                      >
                        {letter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h2 className="text-base font-semibold text-[#0D0D0D]">{job.title}</h2>
                            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#6B7280]">
                              {job.company_slug ? (
                                <Link
                                  href={`/company/${encodeURIComponent(job.company_slug)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-medium text-[#27AE60] underline-offset-4 hover:underline"
                                >
                                  {job.company_name}
                                </Link>
                              ) : (
                                <span>{job.company_name}</span>
                              )}
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3.5 shrink-0" aria-hidden />
                                {job.location ?? "—"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Briefcase className="size-3.5 shrink-0" aria-hidden />
                                {formatJobTypeLabel(job.job_type)}
                              </span>
                              {isRemoteLocation(job.location) ? (
                                <span className="inline-flex items-center rounded-full bg-[#27AE60] px-3 py-1 text-[12px] font-semibold text-white">
                                  Remote
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs text-[#6B7280] sm:text-right">
                            Posted {formatPostedAt(job.posted_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 sm:pl-4">
                      <Button
                        type="button"
                        className="h-10 w-full rounded-lg bg-[#27AE60] font-medium text-white hover:bg-[#229954] sm:w-auto"
                        disabled={!job.apply_url}
                        onClick={(e) => {
                          e.stopPropagation();
                          applyInNewTab(job.apply_url);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#E6E7EA]"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <span className="text-sm text-[#6B7280]">
                Page {safePage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#E6E7EA]"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </>
      )}

      <Dialog open={detailJob !== null} onOpenChange={(open) => !open && closeDetail()}>
        {detailJob ? (
          <DialogContent
            showCloseButton={false}
            className={cn(
              "!fixed !inset-y-0 !top-0 !right-0 !bottom-0 !left-auto z-[80] !h-full !max-h-full !w-full !max-w-md !translate-x-0 !translate-y-0 gap-0 rounded-none border-0 border-l border-[#E5E7EB] bg-white p-0 shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:rounded-l-2xl",
            )}
          >
            <div className="flex h-full flex-col overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-3 border-b border-[#F3F4F6] pb-5">
                <DialogHeader className="flex-1 space-y-2 text-left">
                  <DialogTitle className="text-xl font-bold leading-snug text-[#0D0D0D]">
                    {detailJob.title}
                  </DialogTitle>
                  <DialogDescription className="text-base font-medium text-[#6B7280]">
                      {detailJob.company_slug ? (
                        <Link
                          href={`/company/${encodeURIComponent(detailJob.company_slug)}`}
                          className="text-[#27AE60] underline-offset-4 hover:underline"
                        >
                          {detailJob.company_name}
                        </Link>
                      ) : (
                        detailJob.company_name
                      )}
                  </DialogDescription>
                </DialogHeader>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]"
                  aria-label="Close"
                  onClick={closeDetail}
                >
                  <X className="size-5" />
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-xs font-medium text-[#0D0D0D]">
                  <MapPin className="size-3.5 text-[#6B7280]" aria-hidden />
                  {detailJob.location ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-xs font-medium text-[#0D0D0D]">
                  <Briefcase className="size-3.5 text-[#6B7280]" aria-hidden />
                  {formatJobTypeLabel(detailJob.job_type)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-xs font-medium text-[#0D0D0D]">
                  <Calendar className="size-3.5 text-[#6B7280]" aria-hidden />
                  Posted {formatPostedAt(detailJob.posted_at)}
                </span>
                {hasText(detailJob.salary_range) ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-xs font-medium text-[#0D0D0D]">
                    <Banknote className="size-3.5 text-[#6B7280]" aria-hidden />
                    {detailJob.salary_range}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 space-y-6 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                {hasText(detailJob.responsibilities) ? (
                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-[#0D0D0D]">About the role</h2>
                    <div className="whitespace-pre-line text-sm leading-relaxed text-[#374151]">
                      {detailJob.responsibilities}
                    </div>
                  </section>
                ) : null}

                {hasText(detailJob.requirements) ? (
                  <section className="space-y-2">
                    <h2 className="text-base font-semibold text-[#0D0D0D]">Requirements</h2>
                    <div className="whitespace-pre-line text-sm leading-relaxed text-[#374151]">
                      {detailJob.requirements}
                    </div>
                  </section>
                ) : null}

                {!hasText(detailJob.responsibilities) && !hasText(detailJob.requirements) ? (
                  <p className="text-sm leading-relaxed text-[#6B7280]">
                    Full description not available on JobHunch yet. Use Apply now to view details on the company&apos;s careers
                    page.
                  </p>
                ) : null}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Button
                  type="button"
                  className="h-11 w-full gap-2 rounded-lg bg-[#27AE60] font-medium text-white hover:bg-[#229954]"
                  disabled={!detailJob.apply_url}
                  onClick={() => applyInNewTab(detailJob.apply_url)}
                >
                  Apply Now
                  <ArrowUpRight className="size-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-2 rounded-lg border-2 border-[#27AE60] font-medium text-[#27AE60] hover:bg-[#27AE60]/5"
                  disabled={saveStatus === "saving"}
                  onClick={() => saveToTracker(detailJob)}
                >
                  <Bookmark className="size-4" aria-hidden />
                  {saveStatus === "saving" ? "Saving…" : "Save to tracker"}
                </Button>
                {saveMessage ? (
                  <p
                    className={cn(
                      "text-center text-xs",
                      saveStatus === "error" ? "text-red-600" : "text-[#27AE60]",
                    )}
                  >
                    {saveMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}
