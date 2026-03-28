"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/reviews/StarRating";
import { createClient } from "@/lib/supabase/client";
import { slugifyCompanyName } from "@/lib/reviews/slugify";

type Company = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  location: string | null;
  logo_url: string | null;
  website: string | null;
};

type PublicReview = {
  id: string;
  company_id: string;
  company_name: string;
  is_anonymous: boolean;
  job_title: string;
  employment_status: "current" | "former";
  rating_overall: number;
  rating_culture: number;
  rating_management: number;
  rating_growth: number;
  rating_worklife: number;
  pros: string;
  cons: string;
};

type ReviewWizardMode = "create" | "edit";

type ReviewWizardProps = {
  mode: ReviewWizardMode;
  companySlugPrefill?: string | null;
  initialCompany?: Company | null;
  initialReview?: PublicReview | null;
  onSuccess: (companySlug: string) => void;
};

const INDUSTRIES = [
  "Technology",
  "Finance/Fintech",
  "Telecoms",
  "Healthcare",
  "FMCG",
  "Media",
  "Education",
  "Government",
  "Other",
] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ReviewWizard({
  mode,
  initialCompany,
  initialReview,
  onSuccess,
}: ReviewWizardProps) {
  const supabase = React.useMemo(() => createClient(), []);

  const [step, setStep] = React.useState<number>(() => (initialCompany ? 2 : 1));
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(initialCompany ?? null);

  const [companyQuery, setCompanyQuery] = React.useState("");
  const [companyResults, setCompanyResults] = React.useState<Company[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showAddCompany, setShowAddCompany] = React.useState(false);

  const [addCompanyForm, setAddCompanyForm] = React.useState({
    name: "",
    industry: "Technology" as (typeof INDUSTRIES)[number],
    location: "",
    website: "",
  });

  const [jobTitle, setJobTitle] = React.useState(initialReview?.job_title ?? "");
  const [employmentStatus, setEmploymentStatus] = React.useState<"current" | "former">(
    initialReview?.employment_status ?? "current",
  );
  const [ratingOverall, setRatingOverall] = React.useState<number>(initialReview?.rating_overall ?? 0);
  const [ratingWorklife, setRatingWorklife] = React.useState<number>(initialReview?.rating_worklife ?? 0);
  const [ratingManagement, setRatingManagement] = React.useState<number>(initialReview?.rating_management ?? 0);
  const [ratingGrowth, setRatingGrowth] = React.useState<number>(initialReview?.rating_growth ?? 0);
  const [ratingCulture, setRatingCulture] = React.useState<number>(initialReview?.rating_culture ?? 0);
  const [pros, setPros] = React.useState<string>(initialReview?.pros ?? "");
  const [cons, setCons] = React.useState<string>(initialReview?.cons ?? "");
  const [postAnonymous, setPostAnonymous] = React.useState<boolean>(initialReview?.is_anonymous ?? true);

  const [profileFullName, setProfileFullName] = React.useState<string>("");
  const [globalError, setGlobalError] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    // If we prefilled a company after initial render, jump to Step 2.
    if (initialCompany && !selectedCompany) {
      setSelectedCompany(initialCompany);
      setStep(2);
    }
  }, [initialCompany, selectedCompany]);

  React.useEffect(() => {
    // Load the user's profile name for the identity preview.
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userData.user.id)
        .maybeSingle();
      setProfileFullName(profile?.full_name ?? userData.user.user_metadata?.full_name ?? "");
    })();
  }, [supabase]);

  React.useEffect(() => {
    if (step !== 1) return;
    if (!companyQuery || companyQuery.trim().length < 2) {
      setCompanyResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("id,name,slug,industry,location,logo_url,website")
          .ilike("name", `%${companyQuery.trim()}%`)
          .limit(8);
        if (error) throw error;
        setCompanyResults((data ?? []) as Company[]);
        setShowAddCompany((data ?? []).length === 0);
      } catch (e) {
        setCompanyResults([]);
        setShowAddCompany(false);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [companyQuery, supabase, step]);

  const companyNameForAdd = companyQuery.trim();

  const companyForSummary = selectedCompany?.name ?? initialReview?.company_name ?? "Company";

  function validateStep2() {
    const errors: string[] = [];
    if (!selectedCompany) errors.push("Please select a company.");
    if (!jobTitle.trim()) errors.push("Job title is required.");
    if (!employmentStatus) errors.push("Employment status is required.");

    if (ratingOverall < 1) errors.push("Overall rating is required.");
    if (ratingWorklife < 1) errors.push("Work-life rating is required.");
    if (ratingManagement < 1) errors.push("Management rating is required.");
    if (ratingGrowth < 1) errors.push("Career growth rating is required.");
    if (ratingCulture < 1) errors.push("Company culture rating is required.");

    if (pros.trim().length < 20) errors.push("Pros must be at least 20 characters.");
    if (cons.trim().length < 20) errors.push("Cons must be at least 20 characters.");

    return errors;
  }

  async function handleCreateCompany() {
    const name = addCompanyForm.name.trim();
    const slug = slugifyCompanyName(name);

    if (!name) {
      setGlobalError("Company name is required.");
      return;
    }
    if (!slug) {
      setGlobalError("Invalid company name.");
      return;
    }

    setGlobalError("");
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          name,
          slug,
          industry: addCompanyForm.industry,
          location: addCompanyForm.location.trim() || null,
          website: addCompanyForm.website.trim() || null,
        })
        .select("id,name,slug,industry,location,logo_url,website")
        .single();

      if (error) {
        // Race condition safety: if the company already exists, fetch it and continue.
        if (String(error.code) === "23505") {
          const { data: existing, error: fetchErr } = await supabase
            .from("companies")
            .select("id,name,slug,industry,location,logo_url,website")
            .eq("slug", slug)
            .maybeSingle();
          if (fetchErr || !existing) throw fetchErr ?? new Error("Could not fetch existing company.");
          setSelectedCompany(existing as Company);
          setStep(2);
          return;
        }
        throw error;
      }

      if (!data) throw new Error("Company insert returned no data.");
      setSelectedCompany(data as Company);
      setStep(2);
    } catch (e: any) {
      setGlobalError(e?.message ?? "Failed to add company.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (!selectedCompany && !initialReview) {
      setGlobalError("Company is missing.");
      return;
    }

    setGlobalError("");
    const errors = validateStep2();
    if (errors.length) {
      setGlobalError(errors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      // Safety net for legacy users created before profile backfill/trigger.
      // This only inserts the caller's own profile row (allowed by RLS policy).
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: profileFullName || user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
        { onConflict: "id" },
      );

      const payload = {
        company_id: selectedCompany?.id ?? initialReview?.company_id,
        is_anonymous: postAnonymous,
        job_title: jobTitle.trim(),
        employment_status: employmentStatus,
        rating_overall: ratingOverall,
        rating_culture: ratingCulture,
        rating_management: ratingManagement,
        rating_growth: ratingGrowth,
        rating_worklife: ratingWorklife,
        pros: pros.trim(),
        cons: cons.trim(),
      };

      if (mode === "create") {
        const { error } = await supabase.from("reviews").insert({ ...payload, user_id: user.id });
        if (error) throw error;
        onSuccess(selectedCompany!.slug);
      } else {
        if (!initialReview) throw new Error("Missing review.");
        const { error } = await supabase.from("reviews").update(payload).eq("id", initialReview.id);
        if (error) throw error;
        if (!selectedCompany) throw new Error("Company missing for redirect.");
        onSuccess(selectedCompany.slug);
      }
    } catch (e: any) {
      setGlobalError(e?.message ?? "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const identityPreviewName = postAnonymous ? "Anonymous Employee" : profileFullName || "Employee";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-[#6B7280]">{mode === "create" ? "Write a Review" : "Edit Review"}</p>
          <h1 className="mt-1 text-[22px] font-semibold text-[#0D0D0D] md:text-2xl">
            Your feedback helps others choose well.
          </h1>
        </div>

        <div className="flex w-full items-center gap-1 sm:gap-2">
          {[
            { n: 1, label: "Company" },
            { n: 2, label: "Your review" },
            { n: 3, label: "Submit" },
          ].map((s, idx) => (
            <React.Fragment key={s.n}>
              <div className="flex min-w-0 flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition",
                    step >= s.n ? "bg-[#27AE60] text-white" : "border border-[#E5E7EB] bg-white text-[#6B7280]",
                    step === s.n && "ring-2 ring-[#27AE60]/30",
                  )}
                >
                  {s.n}
                </div>
                <span
                  className={cn(
                    "max-w-[5rem] text-center text-[10px] font-medium leading-tight sm:max-w-none sm:text-[11px]",
                    step === s.n ? "text-[#27AE60]" : "text-[#6B7280]",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {idx < 2 ? (
                <div
                  className={cn(
                    "mb-6 h-0.5 min-w-[1rem] flex-1 sm:mb-7",
                    step > s.n ? "bg-[#27AE60]" : "bg-[#E5E7EB]",
                  )}
                  aria-hidden
                />
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </div>

      {globalError ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">{globalError}</div>
      ) : null}

      {step === 1 && mode === "create" ? (
        <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <CardContent className="space-y-4 p-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0D0D0D]">Find or add company</label>
              <Input
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                placeholder="Search by company name (e.g. Paystack, GTBank)"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Type at least 2 characters.</p>
            </div>

            {isSearching ? <p className="text-sm text-muted-foreground">Searching…</p> : null}

            {companyResults.length ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Matches</p>
                <div className="grid gap-2">
                  {companyResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCompany(c);
                        setStep(2);
                        setGlobalError("");
                      }}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#E6E7EA] bg-white px-4 py-3 text-left transition hover:bg-[#F1F2F4]"
                    >
                      <div className="flex items-center gap-3">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.name} className="size-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {getInitials(c.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.industry ?? "Industry"} · {c.location ?? "Location"}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-primary">Select</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {showAddCompany && companyNameForAdd ? (
              <div className="rounded-lg border border-[#E6E7EA] bg-[#F7F8FA] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#0D0D0D]">Add {companyNameForAdd}</p>
                    <p className="text-xs text-muted-foreground">If this company isn’t listed yet, we’ll create it for you.</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setAddCompanyForm((prev) => ({ ...prev, name: companyNameForAdd }));
                      setShowAddCompany(true);
                    }}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    Add company
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  <Input
                    value={addCompanyForm.name}
                    onChange={(e) => setAddCompanyForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Company name"
                  />

                  <select
                    value={addCompanyForm.industry}
                    onChange={(e) =>
                      setAddCompanyForm((p) => ({ ...p, industry: e.target.value as (typeof INDUSTRIES)[number] }))
                    }
                    className="h-11 w-full rounded-lg border border-[#E6E7EA] bg-white px-3 text-sm outline-none focus:border-[#27AE60] focus:ring-2 focus:ring-[#27AE60]/20"
                  >
                    {INDUSTRIES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  <Input
                    value={addCompanyForm.location}
                    onChange={(e) => setAddCompanyForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Location (e.g. Lagos, Abuja, Nairobi)"
                  />
                  <Input
                    value={addCompanyForm.website}
                    onChange={(e) => setAddCompanyForm((p) => ({ ...p, website: e.target.value }))}
                    placeholder="Website (optional)"
                  />

                  <Button
                    type="button"
                    onClick={handleCreateCompany}
                    disabled={isSubmitting}
                    className="w-full bg-primary text-primary-foreground hover:opacity-90"
                  >
                    {isSubmitting ? "Adding…" : "Continue"}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <CardContent className="space-y-6 p-8">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-secondary">Company</p>
                <p className="text-lg font-bold">{selectedCompany?.name ?? initialReview?.company_name ?? "—"}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedCompany?.industry ? `${selectedCompany.industry} · ` : ""}
                {selectedCompany?.location ?? ""}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0D0D0D]">Job title</label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Product Manager" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0D0D0D]">Employment status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEmploymentStatus("current")}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm font-medium transition",
                      employmentStatus === "current"
                        ? "border-[#27AE60] bg-[#27AE60] text-white"
                        : "border-[#E6E7EA] bg-white text-[#0D0D0D] hover:bg-[#F7F8FA]",
                    ].join(" ")}
                  >
                    Current Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmploymentStatus("former")}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm font-medium transition",
                      employmentStatus === "former"
                        ? "border-[#27AE60] bg-[#27AE60] text-white"
                        : "border-[#E6E7EA] bg-white text-[#0D0D0D] hover:bg-[#F7F8FA]",
                    ].join(" ")}
                  >
                    Former Employee
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-[#0D0D0D]">Ratings</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Overall (required)</p>
                  <StarRating value={ratingOverall} onChange={setRatingOverall} readOnly={false} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Work-life (required)</p>
                  <StarRating value={ratingWorklife} onChange={setRatingWorklife} readOnly={false} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Management (required)</p>
                  <StarRating value={ratingManagement} onChange={setRatingManagement} readOnly={false} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Career growth (required)</p>
                  <StarRating value={ratingGrowth} onChange={setRatingGrowth} readOnly={false} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Company culture (required)</p>
                  <StarRating value={ratingCulture} onChange={setRatingCulture} readOnly={false} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0D0D0D]">Pros (required)</label>
                <Textarea
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  placeholder="What did you enjoy most?"
                  minLength={20}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">{pros.trim().length} / 20 minimum</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0D0D0D]">Cons (required)</label>
                <Textarea
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  placeholder="What could be improved?"
                  minLength={20}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">{cons.trim().length} / 20 minimum</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(mode === "edit" ? 3 : 1)}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const errors = validateStep2();
                  if (errors.length) {
                    setGlobalError(errors[0]);
                    return;
                  }
                  setGlobalError("");
                  setStep(3);
                }}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-4">
              <p className="text-lg font-semibold text-[#0D0D0D]">Identity & submit</p>

              <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#0D0D0D]">
                    {postAnonymous ? "Posting anonymously" : "Posting with name"}
                  </p>
                  <p className="text-xs text-[#6B7280]">Toggle to choose how your name appears.</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-medium text-[#0D0D0D]">Post anonymously</span>
                  <Switch checked={postAnonymous} onCheckedChange={(v) => setPostAnonymous(v)} aria-label="Post anonymously" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Preview</p>
                <p className="mt-2 text-sm font-semibold text-[#0D0D0D]">{identityPreviewName}</p>
                <div className="mt-4">
                  <p className="text-xs font-medium text-[#6B7280]">Overall rating</p>
                  <div className="mt-1">
                    <StarRating value={ratingOverall} readOnly />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Summary</p>
                <p className="mt-2 text-sm font-semibold text-[#0D0D0D]">{companyForSummary}</p>
                <p className="text-sm text-[#6B7280]">{jobTitle}</p>
                <p className="mt-3 text-xs font-medium text-[#6B7280]">Overall</p>
                <div className="mt-1">
                  <StarRating value={ratingOverall} readOnly />
                </div>
              </div>
            </div>

            {mode === "edit" ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4">
                <p className="text-sm font-medium text-[#0D0D0D]">Editing this review</p>
                <p className="text-xs text-[#6B7280]">Your changes will be reflected on the company page.</p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-[#E5E7EB]"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-[#27AE60] px-8 font-medium text-white hover:bg-[#229954]"
              >
                {isSubmitting ? "Submitting…" : mode === "create" ? "Submit review" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Safety: not used yet, placeholder for future delete-in-wizard */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent className="rounded-2xl border-[#E5E7EB] shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

