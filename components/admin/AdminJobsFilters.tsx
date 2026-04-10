"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "draft", label: "Draft" },
  { value: "deleted", label: "Deleted" },
] as const;

const SOURCE_OPTIONS = [
  { value: "all", label: "All sources" },
  { value: "manual", label: "Manual" },
  { value: "jobberman", label: "Jobberman" },
  { value: "myjobmag", label: "MyJobMag" },
] as const;

export function AdminJobsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "all";
  const source = searchParams.get("source") ?? "all";

  const pushFilters = React.useCallback(
    (next: { status?: string; source?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextStatus = next.status ?? status;
      const nextSource = next.source ?? source;

      if (!nextStatus || nextStatus === "all") {
        params.delete("status");
      } else {
        params.set("status", nextStatus);
      }

      if (!nextSource || nextSource === "all") {
        params.delete("source");
      } else {
        params.set("source", nextSource);
      }

      params.delete("page");
      const q = params.toString();
      router.push(q ? `/admin/jobs?${q}` : "/admin/jobs");
    },
    [router, searchParams, status, source],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Select value={status} onValueChange={(v) => pushFilters({ status: v ?? "all" })}>
        <SelectTrigger className="h-10 w-full border-slate-600 bg-slate-900 text-slate-100 sm:w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="z-[80] border border-slate-600 bg-slate-900 text-slate-100">
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={source} onValueChange={(v) => pushFilters({ source: v ?? "all" })}>
        <SelectTrigger className="h-10 w-full border-slate-600 bg-slate-900 text-slate-100 sm:w-[200px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent className="z-[80] border border-slate-600 bg-slate-900 text-slate-100">
          {SOURCE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
