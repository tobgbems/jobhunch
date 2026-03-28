"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileFullName(fullName: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Not signed in." };
  }

  const name = fullName.trim();
  if (!name) {
    return { ok: false as const, error: "Please enter your name." };
  }

  const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
