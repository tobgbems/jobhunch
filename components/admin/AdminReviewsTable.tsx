"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteReview } from "@/app/admin/reviews/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AdminReviewRow = {
  id: string;
  company_name: string;
  is_anonymous: boolean;
  reviewer_name: string;
  employment_status: "current" | "former";
  rating_overall: number;
  created_at: string;
};

type AdminReviewsTableProps = {
  reviews: AdminReviewRow[];
};

function formatAdminDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function employmentLabel(v: "current" | "former") {
  return v === "current" ? "Current employee" : "Former employee";
}

export function AdminReviewsTable({ reviews }: AdminReviewsTableProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedReview, setSelectedReview] = React.useState<AdminReviewRow | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) => r.company_name.toLowerCase().includes(q));
  }, [reviews, query]);

  async function onConfirmDelete() {
    if (!selectedReview) return;
    setPending(true);
    try {
      const result = await deleteReview(selectedReview.id);
      if (result.ok) {
        toast.success("Review deleted.");
        setDeleteOpen(false);
        setSelectedReview(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reviews</h1>
          <p className="mt-1 text-sm text-slate-400">
            {reviews.length} total review{reviews.length === 1 ? "" : "s"}
            {query.trim() ? ` · ${filtered.length} shown` : ""}
          </p>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by company name..."
          className="w-full border-slate-600 bg-slate-900 text-slate-100 sm:w-80"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/40">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">Company Name</TableHead>
              <TableHead className="text-slate-400">Reviewer</TableHead>
              <TableHead className="text-slate-400">Rating</TableHead>
              <TableHead className="text-slate-400">Employment Status</TableHead>
              <TableHead className="text-slate-400">Created At</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                  No reviews match your search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((review) => (
                <TableRow key={review.id} className="border-slate-700">
                  <TableCell className="max-w-[220px] truncate font-medium text-slate-100">{review.company_name}</TableCell>
                  <TableCell className="text-slate-300">
                    {review.is_anonymous ? "Anonymous" : review.reviewer_name}
                  </TableCell>
                  <TableCell className="text-slate-300">{review.rating_overall}/5</TableCell>
                  <TableCell className="text-slate-300">{employmentLabel(review.employment_status)}</TableCell>
                  <TableCell className="text-slate-400">{formatAdminDate(review.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-900/60 bg-slate-800 text-red-300 hover:bg-red-950/40 disabled:opacity-40"
                      onClick={() => {
                        setSelectedReview(review);
                        setDeleteOpen(true);
                      }}
                      disabled={pending}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-slate-600 bg-slate-900 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this review?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone and will remove the review from all surfaces.
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
    </div>
  );
}
