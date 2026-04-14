"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/require-admin";

export type ReviewActionResult = { ok: true } | { ok: false; error: string };

export async function deleteReview(reviewId: string): Promise<ReviewActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) {
    return { ok: false, error: "Unauthorized" };
  }

  const { error } = await ctx.supabase.from("reviews").delete().eq("id", reviewId);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/dashboard/reviews");
  revalidatePath("/dashboard");
  revalidatePath("/company", "layout");
  return { ok: true };
}
