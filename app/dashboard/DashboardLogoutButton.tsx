"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DashboardLogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function confirmSignOut() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setPending(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={[
          "w-full justify-start gap-2 rounded-lg border-transparent font-medium text-[#6B7280] shadow-none hover:border-transparent hover:bg-[#FEF2F2] hover:text-red-600",
          className ?? "",
        ].join(" ")}
      >
        <LogOut className="size-4 shrink-0" aria-hidden />
        Log out
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-[#0D0D0D]">
              Log out of JobHunch?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-[#4B5563]">
              You&apos;ll need to sign in again to access your reviews, jobs, and applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-lg border border-[#D1D5DB] bg-white text-[#0D0D0D] shadow-sm hover:bg-[#F3F4F6] hover:text-[#0D0D0D] sm:w-auto"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full rounded-lg bg-red-600 text-white hover:bg-red-700 sm:w-auto"
              onClick={() => void confirmSignOut()}
              disabled={pending}
            >
              {pending ? "Signing out…" : "Log out"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
