import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { safeNextParam } from "@/lib/auth-redirect";
import { signInWithGoogle, signInWithMagicLink } from "./actions";

type AuthPageProps = {
  searchParams: {
    error?: string;
    success?: string;
    email?: string;
    next?: string;
  };
};

const errorMessages: Record<string, string> = {
  oauth_failed: "Google sign-in failed. Please try again.",
  missing_email: "Please enter a valid email address.",
  magic_link_failed: "Magic link request failed. Please try again.",
  callback_failed: "Authentication callback failed. Please sign in again.",
};

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const errorMessage = searchParams.error ? errorMessages[searchParams.error] : "";
  const isMagicLinkSent = searchParams.success === "magic_link_sent";

  if (user) {
    redirect(safeNextParam(searchParams.next));
  }

  const nextParam = searchParams.next ? safeNextParam(searchParams.next) : "";
  const nextHiddenValue = nextParam && nextParam !== "/dashboard" ? nextParam : "";

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0D0D0D] reviews-light antialiased">
      <div className="mx-auto grid min-h-screen max-w-6xl md:grid-cols-2">
        {/* Brand column */}
        <section className="flex flex-col border-l-4 border-[#27AE60] bg-[#F7F8FA] px-5 py-8 sm:px-8 md:justify-center md:py-12 lg:px-12">
          <Link href="/" className="mb-6 inline-flex w-fit md:mb-10">
            <Image src="/logo.svg" alt="JobHunch" width={140} height={32} className="h-8 w-auto" priority />
          </Link>
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Your next career move starts with the right insight.
          </h1>
          <p className="mt-4 hidden text-base text-[#6B7280] md:block">
            Join professionals across Nigeria and Africa discovering honest workplace reviews.
          </p>
          <ul className="mt-6 hidden space-y-3 md:block">
            {[
              "Anonymous reviews, always",
              "No passwords — magic link or Google",
              "Free to start",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-[#0D0D0D]">
                <Check className="mt-0.5 size-4 shrink-0 text-[#27AE60]" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Form column */}
        <section className="flex flex-col justify-center px-5 pb-10 pt-2 sm:px-8 md:px-10 md:py-12 lg:px-12">
          <Card className="border border-[#E6E7EA] bg-white shadow-md">
            <CardHeader className="space-y-1.5">
              <CardTitle className="text-xl text-[#0D0D0D]">Welcome to JobHunch</CardTitle>
              <CardDescription className="text-[#6B7280]">Sign in or create your free account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {errorMessage}
                </p>
              )}
              {isMagicLinkSent && (
                <p className="rounded-lg border border-[#27AE60]/30 bg-[#27AE60]/10 px-3 py-2.5 text-sm font-medium text-[#1e8449]">
                  Check your inbox — we sent you a magic link.
                </p>
              )}

              <form action={signInWithGoogle}>
                {nextHiddenValue ? <input type="hidden" name="next" value={nextHiddenValue} /> : null}
                <Button
                  type="submit"
                  variant="outline"
                  size="lg"
                  className="h-11 w-full gap-2 border-[#E6E7EA] bg-white text-[#0D0D0D] shadow-sm hover:bg-[#F9FAFB]"
                >
                  <GoogleMark className="size-5" />
                  Continue with Google
                </Button>
              </form>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <span className="w-full border-t border-[#E6E7EA]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[#6B7280]">or continue with email</span>
                </div>
              </div>

              <form action={signInWithMagicLink} className="space-y-3">
                {nextHiddenValue ? <input type="hidden" name="next" value={nextHiddenValue} /> : null}
                <Input
                  name="email"
                  type="email"
                  placeholder="you@domain.com"
                  required
                  autoComplete="email"
                  className="h-11 border-[#E6E7EA] bg-white text-[#0D0D0D]"
                />
                <Button type="submit" size="lg" className="h-11 w-full bg-[#27AE60] text-white hover:bg-[#27AE60]/90">
                  Send magic link
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-[#6B7280] underline-offset-4 transition-colors hover:text-[#0D0D0D] hover:underline">
              Back to home
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
