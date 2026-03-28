"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

const authCallbackUrl = () => `${getSiteUrl()}/auth/callback`;

export async function signInWithGoogle() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authCallbackUrl(),
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
      emailRedirectTo: authCallbackUrl(),
    },
  });

  if (error) {
    redirect("/auth?error=magic_link_failed");
  }

  redirect(`/auth?success=magic_link_sent&email=${encodeURIComponent(email)}`);
}
