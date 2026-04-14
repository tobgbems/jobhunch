"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/require-admin";

export type CompanyActionResult = { ok: true } | { ok: false; error: string };

function normalizeWebsite(url: string): string | null {
  const t = url.trim();
  if (!t) {
    return null;
  }
  if (/^https?:\/\//i.test(t)) {
    return t;
  }
  return `https://${t}`;
}

export async function updateCompany(
  companyId: string,
  input: {
    name: string;
    industry: string;
    size: string;
    website: string;
    description: string;
  },
): Promise<CompanyActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) {
    return { ok: false, error: "Unauthorized" };
  }

  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Company name is required." };
  }

  const { error } = await ctx.supabase
    .from("companies")
    .update({
      name,
      industry: input.industry.trim() || null,
      size: input.size.trim() || null,
      website: normalizeWebsite(input.website),
      description: input.description.trim() || null,
    })
    .eq("id", companyId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/companies");
  revalidatePath("/companies");
  revalidatePath("/company", "layout");
  return { ok: true };
}
