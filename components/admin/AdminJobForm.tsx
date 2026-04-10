"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createJob, searchCompanies, updateJob } from "@/app/admin/jobs/actions";
import type { AdminJobType, JobFormStatus } from "@/lib/admin-jobs";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type CompanyOption = { id: string; name: string; industry: string | null };

const JOB_TYPE_OPTIONS: { value: AdminJobType; label: string }[] = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const STATUS_OPTIONS: { value: JobFormStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "draft", label: "Draft" },
];

function isJobType(v: string | null | undefined): v is AdminJobType {
  return (
    v === "full-time" ||
    v === "part-time" ||
    v === "contract" ||
    v === "remote" ||
    v === "hybrid"
  );
}

export type AdminJobFormProps = {
  mode: "create" | "edit";
  jobId?: string;
  initialCompanies: CompanyOption[];
  defaultValues: {
    title: string;
    companyId: string | null;
    companyName: string;
    companyIndustry: string | null;
    location: string;
    jobType: string | null;
    industryField: string;
    salaryRange: string;
    description: string;
    responsibilities: string;
    requirements: string;
    applyUrl: string;
    status: JobFormStatus;
  };
};

export function AdminJobForm({ mode, jobId, initialCompanies, defaultValues }: AdminJobFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const [title, setTitle] = React.useState(defaultValues.title);
  const [location, setLocation] = React.useState(defaultValues.location);
  const [jobType, setJobType] = React.useState<AdminJobType>(
    isJobType(defaultValues.jobType) ? defaultValues.jobType : "full-time",
  );
  const [industryField, setIndustryField] = React.useState(defaultValues.industryField);
  const [salaryRange, setSalaryRange] = React.useState(defaultValues.salaryRange);
  const [description, setDescription] = React.useState(defaultValues.description);
  const [responsibilities, setResponsibilities] = React.useState(defaultValues.responsibilities);
  const [requirements, setRequirements] = React.useState(defaultValues.requirements);
  const [applyUrl, setApplyUrl] = React.useState(defaultValues.applyUrl);
  const [status, setStatus] = React.useState<JobFormStatus>(defaultValues.status);

  const [companyQuery, setCompanyQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [remoteHits, setRemoteHits] = React.useState<CompanyOption[]>([]);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const [selectedCompany, setSelectedCompany] = React.useState<CompanyOption | null>(() => {
    if (defaultValues.companyId) {
      return {
        id: defaultValues.companyId,
        name: defaultValues.companyName,
        industry: defaultValues.companyIndustry,
      };
    }
    return null;
  });

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(companyQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [companyQuery]);

  React.useEffect(() => {
    if (debouncedQuery.length < 1) {
      setRemoteHits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await searchCompanies(debouncedQuery);
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setRemoteHits(result.rows);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const listToShow = React.useMemo(() => {
    if (debouncedQuery.length >= 1) {
      return remoteHits;
    }
    const q = companyQuery.trim().toLowerCase();
    if (!q) {
      return initialCompanies.slice(0, 40);
    }
    return initialCompanies.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 40);
  }, [companyQuery, debouncedQuery, remoteHits, initialCompanies]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompany) {
      toast.error("Please select a company.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        companyId: selectedCompany.id,
        location,
        jobType,
        industry: industryField,
        salaryRange,
        description,
        responsibilities,
        requirements,
        applyUrl,
        status,
      };

      if (mode === "create") {
        const result = await createJob(payload);
        if (result.ok) {
          toast.success("Job created.");
          router.push("/admin/jobs");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else if (jobId) {
        const result = await updateJob(jobId, payload);
        if (result.ok) {
          toast.success("Job updated.");
          router.push("/admin/jobs");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/jobs"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
          )}
        >
          ← Back to jobs
        </Link>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title" className="text-slate-200">
          Job title <span className="text-red-400">*</span>
        </Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-slate-600 bg-slate-900 text-slate-100"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-200">
          Company <span className="text-red-400">*</span>
        </Label>
        {selectedCompany ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100">
            <span className="font-medium">{selectedCompany.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              onClick={() => {
                setSelectedCompany(null);
                setCompanyQuery("");
                setPickerOpen(true);
              }}
            >
              Change
            </Button>
          </div>
        ) : null}

        {(!selectedCompany || pickerOpen) && (
          <div className="space-y-2">
            <Input
              placeholder="Search companies by name…"
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              onFocus={() => setPickerOpen(true)}
              className="border-slate-600 bg-slate-900 text-slate-100"
            />
            <div className="max-h-52 overflow-auto rounded-lg border border-slate-700 bg-slate-950">
              {listToShow.length === 0 ? (
                <p className="px-3 py-4 text-sm text-slate-500">No companies found.</p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {listToShow.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                        onClick={() => {
                          setSelectedCompany(c);
                          setIndustryField((prev) => prev || (c.industry ?? ""));
                          setPickerOpen(false);
                          setCompanyQuery("");
                        }}
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.industry ? (
                          <span className="mt-0.5 block text-xs text-slate-500">{c.industry}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-slate-200">
          Location <span className="text-red-400">*</span>
        </Label>
        <Input
          id="location"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border-slate-600 bg-slate-900 text-slate-100"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-200">Job type</Label>
          <Select
            value={jobType}
            onValueChange={(v) => setJobType(v && isJobType(v) ? v : "full-time")}
          >
            <SelectTrigger className="border-slate-600 bg-slate-900 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[80] border border-slate-600 bg-slate-900 text-slate-100">
              {JOB_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Status</Label>
          <Select
            value={status}
            onValueChange={(v) =>
              setStatus(v === "open" || v === "closed" || v === "draft" ? v : "open")
            }
          >
            <SelectTrigger className="border-slate-600 bg-slate-900 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[80] border border-slate-600 bg-slate-900 text-slate-100">
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry" className="text-slate-200">
          Industry / category (optional)
        </Label>
        <p className="text-xs text-slate-500">Updates the linked company&apos;s industry when saved.</p>
        <Input
          id="industry"
          value={industryField}
          onChange={(e) => setIndustryField(e.target.value)}
          className="border-slate-600 bg-slate-900 text-slate-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="salary" className="text-slate-200">
          Salary range (optional)
        </Label>
        <Input
          id="salary"
          value={salaryRange}
          onChange={(e) => setSalaryRange(e.target.value)}
          placeholder="e.g. ₦300,000 – ₦500,000/month"
          className="border-slate-600 bg-slate-900 text-slate-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-slate-200">
          Job description <span className="text-red-400">*</span>
        </Label>
        <Textarea
          id="description"
          required
          rows={8}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border-slate-600 bg-slate-900 text-slate-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsibilities" className="text-slate-200">
          Responsibilities (optional)
        </Label>
        <Textarea
          id="responsibilities"
          rows={6}
          value={responsibilities}
          onChange={(e) => setResponsibilities(e.target.value)}
          className="border-slate-600 bg-slate-900 text-slate-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements" className="text-slate-200">
          Requirements (optional)
        </Label>
        <Textarea
          id="requirements"
          rows={6}
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          className="border-slate-600 bg-slate-900 text-slate-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="apply" className="text-slate-200">
          External apply URL <span className="text-red-400">*</span>
        </Label>
        <Input
          id="apply"
          required
          type="text"
          value={applyUrl}
          onChange={(e) => setApplyUrl(e.target.value)}
          placeholder="https://"
          className="border-slate-600 bg-slate-900 text-slate-100"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[#27AE60] text-white hover:bg-[#219653]"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create job" : "Save changes"}
        </Button>
        <Link
          href="/admin/jobs"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700",
          )}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
