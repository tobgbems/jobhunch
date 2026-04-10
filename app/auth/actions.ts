"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextParam } from "@/lib/auth-redirect";
import { getSiteUrl } from "@/lib/site-url";

function authCallbackUrl(formData?: FormData) {
  const base = `${getSiteUrl()}/auth/callback`;
  if (!formData) return base;
  const raw = String(formData.get("next") ?? "").trim();
  if (!raw) return base;
  const next = safeNextParam(raw);
  if (next === "/dashboard") return base;
  return `${base}?next=${encodeURIComponent(next)}`;
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authCallbackUrl(formData),
    },
  });

  if (error || !data.url) {
    redirect("/auth?error=oauth_failed");
  }

  redirect(data.url);
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = createClient();

  if (!email) {
    redirect("/auth?error=missing_email");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: authCallbackUrl(formData),
    },
  });

  if (error) {
    redirect("/auth?error=magic_link_failed");
  }

  const rawNext = String(formData.get("next") ?? "").trim();
  const next = rawNext ? safeNextParam(rawNext) : "";
  const nextQs =
    next && next !== "/dashboard" ? `&next=${encodeURIComponent(next)}` : "";

  redirect(`/auth?success=magic_link_sent&email=${encodeURIComponent(email)}${nextQs}`);
}
