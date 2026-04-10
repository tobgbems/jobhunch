"use client";

import * as React from "react";
import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PublicJobListItem = {
  id: string;
  title: string;
  companyName: string;
  companySlug: string | null;
  industry: string | null;
  location: string | null;
  jobType: string | null;
  postedAt: string | null;
};

const JOB_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
] as const;

const ALL_INDUSTRY = "all";
const ALL_LOCATION = "all";

function formatJobType(type: string | null) {
  if (!type) return "—";
  const map: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
    remote: "Remote",
    hybrid: "Hybrid",
  };
  return map[type] ?? type;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isRemoteLocation(location: string | null) {
  return (location ?? "").trim().toLowerCase() === "remote";
}

function matchesJobType(job: PublicJobListItem, filter: string) {
  if (filter === "all") return true;
  if (filter === "remote") {
    return isRemoteLocation(job.location) || job.jobType === "remote";
  }
  return job.jobType === filter;
}

function matchesIndustry(job: PublicJobListItem, filter: string) {
  if (filter === ALL_INDUSTRY) return true;
  const ind = (job.industry ?? "").trim() || "Other";
  return ind === filter;
}

function matchesLocation(job: PublicJobListItem, filter: string) {
  if (filter === ALL_LOCATION) return true;
  const loc = (job.location ?? "").trim();
  return loc === filter;
}

function matchesSearch(job: PublicJobListItem, q: string) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    job.title.toLowerCase().includes(s) || job.companyName.toLowerCase().includes(s)
  );
}

export function PublicJobsList({ jobs }: { jobs: PublicJobListItem[] }) {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [locationFilter, setLocationFilter] = React.useState<string>(ALL_LOCATION);
  const [industryFilter, setIndustryFilter] = React.useState<string>(ALL_INDUSTRY);

  const locationOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) {
      const loc = (j.location ?? "").trim();
      if (loc) set.add(loc);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const industryOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) {
      set.add((j.industry ?? "").trim() || "Other");
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const filtered = React.useMemo(() => {
    return jobs.filter(
      (j) =>
        matchesSearch(j, search) &&
        matchesJobType(j, typeFilter) &&
        matchesLocation(j, locationFilter) &&
        matchesIndustry(j, industryFilter),
    );
  }, [jobs, search, typeFilter, locationFilter, industryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          type="search"
          placeholder="Search by job title or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-lg border-[#E5E7EB] bg-[#F7F8FA] sm:min-w-[200px] sm:flex-1"
          aria-label="Search jobs"
        />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="h-11 w-full rounded-lg border-[#E5E7EB] bg-white sm:w-[170px]">
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
        <Select
          value={locationFilter}
          onValueChange={(v) => setLocationFilter(v ?? ALL_LOCATION)}
        >
          <SelectTrigger className="h-11 w-full rounded-lg border-[#E5E7EB] bg-white sm:w-[170px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent className="z-[80] max-h-60 border border-[#E5E7EB] bg-white text-[#0D0D0D] shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
            <SelectItem value={ALL_LOCATION}>All locations</SelectItem>
            {locationOptions.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={industryFilter}
          onValueChange={(v) => setIndustryFilter(v ?? ALL_INDUSTRY)}
        >
          <SelectTrigger className="h-11 w-full rounded-lg border-[#E5E7EB] bg-white sm:w-[180px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent className="z-[80] max-h-60 border border-[#E5E7EB] bg-white text-[#0D0D0D] shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
            <SelectItem value={ALL_INDUSTRY}>All industries</SelectItem>
            {industryOptions.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E6E7EA] bg-white p-10 text-center text-sm text-[#6B7280]">
          No jobs match your filters. Try adjusting search or filters.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((job) => {
            const companyHref = job.companySlug
              ? `/company/${encodeURIComponent(job.companySlug)}`
              : null;
            return (
              <li key={job.id}>
                <Card className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-base font-semibold text-[#0D0D0D] underline-offset-4 hover:text-[#27AE60] hover:underline"
                        >
                          {job.title}
                        </Link>
                      </div>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#6B7280]">
                        {companyHref ? (
                          <Link
                            href={companyHref}
                            className="font-medium text-[#27AE60] underline-offset-4 hover:underline"
                          >
                            {job.companyName}
                          </Link>
                        ) : (
                          <span className="font-medium text-[#0D0D0D]">{job.companyName}</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                          {job.location ?? "—"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="size-3.5 shrink-0" aria-hidden />
                          {formatJobType(job.jobType)}
                        </span>
                        <span>Posted {formatDate(job.postedAt)}</span>
                      </p>
                      {job.industry ? (
                        <p className="text-xs text-[#6B7280]">
                          <span className="font-medium text-[#0D0D0D]/80">Industry:</span>{" "}
                          {job.industry}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:pt-0">
                      <Link
                        href={`/jobs/${job.id}`}
                        className={cn(
                          buttonVariants({ variant: "default", size: "lg" }),
                          "h-10 bg-[#27AE60] px-4 text-white hover:bg-[#229954]",
                        )}
                      >
                        View details
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
