"use client";

import * as React from "react";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  ClipboardList,
  ExternalLink,
  Pencil,
  Plus,
  Send,
  Trash2,
  XCircle,
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full min-w-0 rounded-lg border border-[#E6E7EA] bg-white px-3 py-2 text-sm text-[#0D0D0D] shadow-sm outline-none placeholder:text-[#9CA3AF] focus-visible:ring-2 focus-visible:ring-[#27AE60]/35";

type JobApplicationStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

type JobJoin = {
  title: string | null;
  company_name: string | null;
  location: string | null;
  job_type: string | null;
  apply_url: string | null;
} | null;

export type ApplicationRow = {
  id: string;
  user_id: string;
  job_id: string | null;
  company_name: string;
  job_title: string;
  location: string | null;
  job_type: string | null;
  apply_url: string | null;
  status: JobApplicationStatus;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  jobs: JobJoin;
};

type TabFilter = "all" | JobApplicationStatus;

const STATUS_TABS: { value: TabFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_SELECT_OPTIONS: { value: JobApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const JOB_TYPE_VALUES = ["full-time", "part-time", "contract", "remote"] as const;

function formatJobTypeLabel(t: string | null | undefined) {
  if (!t) return null;
  const map: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
    remote: "Remote",
  };
  return map[t] ?? t;
}

function formatDisplayDate(iso: string | null | undefined) {
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

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoFromYmd(ymd: string) {
  if (!ymd) return null;
  const d = new Date(`${ymd}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function ymdFromIso(iso: string | null | undefined) {
  if (!iso) return todayYmd();
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return todayYmd();
  }
}

function statusBadgeClass(status: JobApplicationStatus) {
  switch (status) {
    case "saved":
      return "bg-[#F3F4F6] text-[#4B5563]";
    case "applied":
      return "bg-blue-100 text-blue-800";
    case "interview":
      return "bg-[#F5A623]/20 text-[#B86B00]";
    case "offer":
      return "bg-[#27AE60]/15 text-[#1E8449]";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-[#F3F4F6] text-[#4B5563]";
  }
}

function statusDotClass(status: JobApplicationStatus) {
  switch (status) {
    case "saved":
      return "bg-[#9CA3AF]";
    case "applied":
      return "bg-blue-500";
    case "interview":
      return "bg-[#F5A623]";
    case "offer":
      return "bg-[#27AE60]";
    case "rejected":
      return "bg-red-500";
    default:
      return "bg-[#9CA3AF]";
  }
}

function dateAddedLine(createdAt: string) {
  return `Added ${formatDisplayDate(createdAt)}`;
}

function normalizeJobsJoin(raw: unknown): JobJoin {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const first = raw[0];
    return (first as JobJoin) ?? null;
  }
  return raw as JobJoin;
}

function resolveDisplay(app: ApplicationRow) {
  const j = app.jobs;
  const title = app.job_title?.trim() || j?.title?.trim() || "Untitled role";
  const company = app.company_name?.trim() || j?.company_name?.trim() || "Company";
  const location = app.location ?? j?.location ?? null;
  const jobType = app.job_type ?? j?.job_type ?? null;
  const applyUrl = app.apply_url ?? j?.apply_url ?? null;
  return { title, company, location, jobType, applyUrl };
}

type FormState = {
  job_title: string;
  company_name: string;
  location: string;
  job_type: string;
  apply_url: string;
  status: JobApplicationStatus;
  notes: string;
  applied_at_ymd: string;
};

const emptyForm = (): FormState => ({
  job_title: "",
  company_name: "",
  location: "",
  job_type: "full-time",
  apply_url: "",
  status: "applied",
  notes: "",
  applied_at_ymd: todayYmd(),
});

function formFromApplication(app: ApplicationRow): FormState {
  const { title, company, location, jobType, applyUrl } = resolveDisplay(app);
  return {
    job_title: title,
    company_name: company,
    location: location ?? "",
    job_type: jobType ?? "full-time",
    apply_url: applyUrl ?? "",
    status: app.status,
    notes: app.notes ?? "",
    applied_at_ymd: ymdFromIso(app.applied_at ?? app.created_at),
  };
}

export function ApplicationsTracker() {
  const supabase = React.useMemo(() => createClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<ApplicationRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [tab, setTab] = React.useState<TabFilter>("all");

  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"add" | "edit">("add");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<ApplicationRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setRows([]);
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const { data, error } = await supabase
      .from("job_applications")
      .select(
        `
        id,
        user_id,
        job_id,
        company_name,
        job_title,
        location,
        job_type,
        apply_url,
        status,
        notes,
        applied_at,
        created_at,
        jobs ( title, company_name, location, job_type, apply_url )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const list = (data ?? []).map((row) => {
      const r = row as unknown as Record<string, unknown>;
      return {
        ...r,
        jobs: normalizeJobsJoin(r.jobs),
      } as ApplicationRow;
    });
    setRows(list.filter((r) => r.user_id === user.id));
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const counts = React.useMemo(() => {
    const c = {
      all: rows.length,
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    for (const r of rows) {
      c[r.status] += 1;
    }
    return c;
  }, [rows]);

  const filtered = React.useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((r) => r.status === tab);
  }, [rows, tab]);

  const openAdd = () => {
    setFormMode("add");
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (app: ApplicationRow) => {
    setFormMode("edit");
    setEditingId(app.id);
    setForm(formFromApplication(app));
    setFormError(null);
    setFormOpen(true);
  };

  const submitForm = async () => {
    setFormError(null);
    const title = form.job_title.trim();
    const company = form.company_name.trim();
    if (!title || !company) {
      setFormError("Job title and company name are required.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setFormError("You must be signed in.");
      return;
    }

    setSaving(true);
    const locationVal = form.location.trim() || null;
    const applyVal = form.apply_url.trim() || null;
    const notesVal = form.notes.trim() || null;
    const appliedIso = isoFromYmd(form.applied_at_ymd);

    if (formMode === "add") {
      const { error } = await supabase.from("job_applications").insert({
        user_id: user.id,
        job_id: null,
        company_name: company,
        job_title: title,
        location: locationVal,
        job_type: form.job_type,
        apply_url: applyVal,
        status: form.status,
        notes: notesVal,
        applied_at: appliedIso,
      });
      setSaving(false);
      if (error) {
        setFormError(error.message);
        return;
      }
    } else if (editingId) {
      const { error } = await supabase
        .from("job_applications")
        .update({
          company_name: company,
          job_title: title,
          location: locationVal,
          job_type: form.job_type,
          apply_url: applyVal,
          status: form.status,
          notes: notesVal,
          applied_at: appliedIso,
        })
        .eq("id", editingId)
        .eq("user_id", user.id);
      setSaving(false);
      if (error) {
        setFormError(error.message);
        return;
      }
    }

    setFormOpen(false);
    await load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !userId) return;
    setDeleting(true);
    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", deleteTarget.id)
      .eq("user_id", userId);
    setDeleting(false);
    if (error) {
      setLoadError(error.message);
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    await load();
  };

  const openApply = (url: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[22px] font-semibold text-[#0D0D0D] md:text-2xl">My Applications</h1>
          <p className="text-sm text-[#6B7280]">Track every job you&apos;ve applied to, in one place.</p>
        </div>
        <Button
          type="button"
          onClick={openAdd}
          className="h-11 shrink-0 gap-2 rounded-lg bg-[#27AE60] font-medium text-white hover:bg-[#229954]"
        >
          <Plus className="size-4" />
          Add Application
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Total</p>
            <ClipboardList className="size-5 text-[#27AE60]" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-[#0D0D0D]">{counts.all}</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Applied</p>
            <Send className="size-5 text-[#27AE60]" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-[#0D0D0D]">{counts.applied}</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Interview</p>
            <Calendar className="size-5 text-[#27AE60]" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-[#0D0D0D]">{counts.interview}</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Offer</p>
            <CheckCircle className="size-5 text-[#27AE60]" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-[#27AE60]">{counts.offer}</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Rejected</p>
            <XCircle className="size-5 text-[#9CA3AF]" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-[#0D0D0D]">{counts.rejected}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)}>
        <div className="overflow-x-auto pb-1">
          <TabsList
            variant="default"
            className="h-auto min-h-0 w-full min-w-max flex-wrap justify-start gap-2 rounded-xl bg-transparent p-0"
          >
            {STATUS_TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={cn(
                  "rounded-full border border-transparent px-4 py-2 text-sm font-medium shadow-none",
                  "data-active:border-[#27AE60] data-active:bg-[#27AE60] data-active:text-white data-active:after:hidden",
                  "data-active:[&>span:last-child]:bg-white/25 data-active:[&>span:last-child]:text-white",
                  "text-[#6B7280] hover:text-[#0D0D0D]",
                )}
              >
                {t.label}
                <span className="ml-1.5 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#0D0D0D]">
                  {counts[t.value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{loadError}</p>
          {/column|schema cache/i.test(loadError) ? (
            <p className="mt-2 text-xs text-red-900/90">
              Run the SQL in{" "}
              <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[0.7rem]">
                supabase/migrations/20260327240000_job_applications_location_job_type.sql
              </code>{" "}
              in the Supabase SQL Editor (adds{" "}
              <code className="font-mono">location</code> and <code className="font-mono">job_type</code>).
            </p>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading applications…</p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#E6E7EA] bg-white py-16 text-center shadow-sm">
          <Briefcase className="size-12 text-[#E6E7EA]" aria-hidden />
          <div className="max-w-md space-y-1 px-4">
            <p className="text-sm font-medium text-[#0D0D0D]">No applications yet.</p>
            <p className="text-sm text-[#6B7280]">
              Save jobs from the job board or add one manually.
            </p>
          </div>
          <Button
            type="button"
            onClick={openAdd}
            className="bg-[#27AE60] text-white hover:bg-[#229954]"
          >
            <Plus className="mr-2 size-4" />
            Add Application
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E6E7EA] bg-white py-12 text-center shadow-sm">
          <p className="text-sm font-medium text-[#0D0D0D]">Nothing in this stage</p>
          <p className="mt-1 text-sm text-[#6B7280]">Try another tab or add a new application.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((app, i) => {
            const { title, company, location, jobType, applyUrl } = resolveDisplay(app);
            const letter = company.trim().charAt(0).toUpperCase() || "?";
            const avatarGreen = i % 2 === 0;
            const typeLabel = formatJobTypeLabel(jobType);
            const notesPreview =
              app.notes && app.notes.trim().length > 0
                ? app.notes.trim().slice(0, 60) + (app.notes.trim().length > 60 ? "…" : "")
                : null;

            return (
              <li key={app.id}>
                <div
                  className={cn(
                    "group flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] lg:flex-row lg:items-center lg:justify-between",
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
                      <h2 className="text-base font-semibold text-[#0D0D0D]">{title}</h2>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#6B7280]">
                        <span>{company}</span>
                        {location ? (
                          <>
                            <span aria-hidden>·</span>
                            <span>{location}</span>
                          </>
                        ) : null}
                        {typeLabel ? (
                          <>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center rounded-md border border-[#E6E7EA] bg-[#F7F8FA] px-2 py-0.5 text-xs font-medium text-[#0D0D0D]">
                              {typeLabel}
                            </span>
                          </>
                        ) : null}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold",
                            statusBadgeClass(app.status),
                          )}
                        >
                          <span
                            className={cn("size-1.5 shrink-0 rounded-full", statusDotClass(app.status))}
                            aria-hidden
                          />
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                        <span className="text-xs text-[#6B7280]">{dateAddedLine(app.created_at)}</span>
                      </div>
                      {notesPreview ? (
                        <p className="mt-2 line-clamp-2 text-sm italic text-[#6B7280]">{notesPreview}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 border-t border-[#F1F2F4] pt-3 opacity-100 lg:border-t-0 lg:pt-0 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#0D0D0D]"
                      aria-label="Edit application"
                      onClick={() => openEdit(app)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {applyUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#0D0D0D]"
                        aria-label="Open apply link"
                        onClick={() => openApply(applyUrl)}
                      >
                        <ExternalLink className="size-4" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-lg text-[#6B7280] hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete application"
                      onClick={() => setDeleteTarget(app)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="grid max-h-[min(90vh,720px)] min-w-0 w-full max-w-lg overflow-y-auto rounded-2xl border-[#E5E7EB] bg-white p-8 text-[#0D0D0D] shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#0D0D0D]">
              {formMode === "add" ? "Add application" : "Edit application"}
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              {formMode === "add"
                ? "Track a role you applied for outside JobHunch."
                : "Update details and status as you move through the process."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-w-0 gap-5">
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="ja-title" className="text-sm font-medium text-[#0D0D0D]">
                Job title <span className="text-red-600">*</span>
              </Label>
              <Input
                id="ja-title"
                value={form.job_title}
                onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
                className={cn(fieldClass, "h-10")}
              />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="ja-company" className="text-[#0D0D0D]">
                Company name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="ja-company"
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                className={cn(fieldClass, "h-10")}
              />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="ja-loc" className="text-[#0D0D0D]">
                Location
              </Label>
              <Input
                id="ja-loc"
                placeholder="e.g. Lagos, Remote"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className={cn(fieldClass, "h-10")}
              />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="ja-job-type" className="text-[#0D0D0D]">
                Job type
              </Label>
              <select
                id="ja-job-type"
                className={cn(fieldClass, "h-10 cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat pr-9")}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                }}
                value={form.job_type}
                onChange={(e) => setForm((f) => ({ ...f, job_type: e.target.value }))}
              >
                {JOB_TYPE_VALUES.map((jt) => (
                  <option key={jt} value={jt}>
                    {formatJobTypeLabel(jt)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="ja-url" className="text-[#0D0D0D]">
                Apply URL
              </Label>
              <Input
                id="ja-url"
                placeholder="Link to job posting"
                value={form.apply_url}
                onChange={(e) => setForm((f) => ({ ...f, apply_url: e.target.value }))}
                className={cn(fieldClass, "h-10")}
              />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="ja-status" className="text-sm font-medium text-[#0D0D0D]">
                Status
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: (v ?? f.status) as JobApplicationStatus }))
                }
              >
                <SelectTrigger id="ja-status" className={cn("h-11 w-full rounded-lg border-[#E5E7EB]")}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_SELECT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn("size-2 shrink-0 rounded-full", statusDotClass(opt.value))}
                          aria-hidden
                        />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="ja-notes" className="text-[#0D0D0D]">
                Notes
              </Label>
              <Textarea
                id="ja-notes"
                placeholder="Interview date, contact person, anything useful..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className={cn(fieldClass, "min-h-[100px] resize-y py-2.5")}
              />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="ja-date" className="text-[#0D0D0D]">
                Date applied
              </Label>
              <Input
                id="ja-date"
                type="date"
                value={form.applied_at_ymd}
                onChange={(e) => setForm((f) => ({ ...f, applied_at_ymd: e.target.value }))}
                className={cn(fieldClass, "h-10")}
              />
            </div>
          </div>

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <div className="flex flex-col-reverse gap-2 border-t border-[#E6E7EA] pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full border-[#E6E7EA] bg-white text-[#0D0D0D] hover:bg-[#F7F8FA] sm:w-auto"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              className="w-full bg-[#27AE60] text-white hover:bg-[#229954] sm:w-auto"
              onClick={() => void submitForm()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="w-full max-w-sm rounded-2xl border-[#E5E7EB] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#0D0D0D]">Remove application?</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Remove this application from your tracker?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-lg border-[#E5E7EB] bg-white text-[#0D0D0D] hover:bg-[#F7F8FA] sm:w-auto"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              className="w-full rounded-lg bg-red-600 text-white hover:bg-red-700 sm:w-auto"
              onClick={() => void confirmDelete()}
            >
              {deleting ? "Removing…" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
