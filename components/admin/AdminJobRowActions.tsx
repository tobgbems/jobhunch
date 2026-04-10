"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { softDeleteJob, toggleJobStatusOpenClosed } from "@/app/admin/jobs/actions";
import type { JobListStatus } from "@/lib/admin-jobs";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AdminJobRowActionsProps = {
  jobId: string;
  status: JobListStatus;
};

export function AdminJobRowActions({ jobId, status }: AdminJobRowActionsProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const canToggle = status === "open" || status === "closed";
  const canDelete = status !== "deleted";

  async function onToggle() {
    setPending(true);
    try {
      const result = await toggleJobStatusOpenClosed(jobId);
      if (result.ok) {
        toast.success(result.status === "open" ? "Job is now open." : "Job is now closed.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  async function onConfirmDelete() {
    setPending(true);
    try {
      const result = await softDeleteJob(jobId);
      if (result.ok) {
        toast.success("Job removed from public listings.");
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/admin/jobs/${jobId}/edit`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700",
          )}
        >
          Edit
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:opacity-40"
          disabled={!canToggle || pending}
          onClick={() => void onToggle()}
        >
          Toggle status
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-red-900/60 bg-slate-800 text-red-300 hover:bg-red-950/40 disabled:opacity-40"
          disabled={!canDelete || pending}
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-slate-600 bg-slate-900 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this job?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure? This cannot be undone. The listing will be hidden from the public job board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-slate-600 bg-slate-800 text-slate-100"
              onClick={() => setDeleteOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => void onConfirmDelete()}
              disabled={pending}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
