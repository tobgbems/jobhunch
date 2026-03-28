"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileFullName } from "@/app/dashboard/profile/actions";

type ProfileSettingsProps = {
  email: string | null;
  initialFullName: string;
  avatarUrl: string;
  initials: string;
};

export function ProfileSettings({ email, initialFullName, avatarUrl, initials }: ProfileSettingsProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFullName(initialFullName);
  }, [initialFullName]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfileFullName(fullName);
      if (result.ok) {
        toast.success("Profile updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteAccount() {
    toast.info("To delete your account, contact support.");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm font-medium text-[#6B7280]">Profile</p>
        <h1 className="text-[22px] font-semibold text-[#0D0D0D] md:text-2xl">Settings</h1>
      </header>

      <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <CardHeader className="px-8 pb-2 pt-8">
          <CardTitle className="text-lg font-semibold text-[#0D0D0D]">Your profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 px-8 pb-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="size-20 shrink-0 rounded-full object-cover ring-4 ring-[#27AE60]/25 sm:size-[80px]"
              />
            ) : (
              <div
                className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#27AE60] text-2xl font-semibold text-white ring-4 ring-[#27AE60]/25 sm:size-[80px]"
                aria-hidden
              >
                {initials || "JH"}
              </div>
            )}
            <form onSubmit={handleSave} className="min-w-0 flex-1 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium text-[#0D0D0D]">
                  Full name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  className="h-11 rounded-lg border-[#E5E7EB] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#0D0D0D]">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    value={email ?? ""}
                    readOnly
                    tabIndex={-1}
                    className="h-11 cursor-not-allowed rounded-lg border-[#E5E7EB] bg-[#F3F4F6] pr-10 text-[#6B7280]"
                  />
                  <Lock
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]"
                    aria-hidden
                  />
                </div>
                <p className="text-xs text-[#6B7280]">Email cannot be changed</p>
              </div>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-[#27AE60] font-medium text-white hover:bg-[#229954]"
              >
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-[#E5E7EB] bg-[#F0FDF4] shadow-[0_1px_4px_rgba(0,0,0,0.06)] [border-left-width:4px] [border-left-color:#27AE60]">
        <CardHeader className="px-8 pb-2 pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <Lock className="size-5 text-[#27AE60]" aria-hidden />
            <CardTitle className="text-lg font-semibold text-[#0D0D0D]">Verified Employee badge</CardTitle>
            <span className="rounded-full bg-white/80 px-3 py-1 text-[12px] font-medium text-[#6B7280] ring-1 ring-[#E5E7EB]">
              Coming soon
            </span>
          </div>
          <CardDescription className="text-[#6B7280]">
            Verify your work email to build trust on your reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-8 pb-8">
          <p className="text-sm leading-relaxed text-[#0D0D0D]">
            Add your work email to get a Verified Employee badge on your reviews. Employers and users trust verified
            reviews more.
          </p>
          <div className="space-y-3">
            <Input
              placeholder="yourname@company.com"
              disabled
              className="h-11 cursor-not-allowed rounded-lg border-[#E5E7EB] bg-white/60 text-[#9CA3AF]"
            />
            <Button type="button" disabled variant="outline" className="rounded-lg border-[#D1D5DB] text-[#9CA3AF]">
              Verify email
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-red-200 bg-[#FEF2F2] shadow-[0_1px_4px_rgba(0,0,0,0.06)] [border-left-width:4px] [border-left-color:#EF4444]">
        <CardHeader className="px-8 pb-2 pt-8">
          <CardTitle className="text-lg font-semibold text-red-900">Danger zone</CardTitle>
          <CardDescription className="text-red-900/70">Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={handleDeleteAccount}
            className="rounded-lg border-red-200 text-red-700 hover:bg-red-50"
          >
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
