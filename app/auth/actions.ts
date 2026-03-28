"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export async function signInWithGoogle() {
  const supabase = createClient();
  const origin = headers().get("origin") ?? getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
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
  const origin = headers().get("origin") ?? getSiteUrl();

  if (!email) {
    redirect("/auth?error=missing_email");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    redirect("/auth?error=magic_link_failed");
  }

  redirect(`/auth?success=magic_link_sent&email=${encodeURIComponent(email)}`);
}
