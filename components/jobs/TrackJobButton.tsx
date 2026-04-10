"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TrackJobButtonProps = {
  jobId: string;
  companyName: string;
  jobTitle: string;
  location: string | null;
  jobType: string | null;
  applyUrl: string | null;
};

export function TrackJobButton({
  jobId,
  companyName,
  jobTitle,
  location,
  jobType,
  applyUrl,
}: TrackJobButtonProps) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = React.useState<string | null>(null);

  const onTrack = async () => {
    setStatus("saving");
    setMessage(null);
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      setStatus("idle");
      router.push(`/auth?next=${encodeURIComponent(`/jobs/${jobId}`)}`);
      return;
    }

    const { error } = await supabase.from("job_applications").insert({
      user_id: user.id,
      job_id: jobId,
      company_name: companyName,
      job_title: jobTitle,
      location,
      job_type: jobType,
      apply_url: applyUrl,
      status: "saved",
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("saved");
    setMessage("Saved to My Applications.");
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 rounded-lg border-2 border-[#27AE60] font-medium text-[#27AE60] hover:bg-[#27AE60]/5"
        disabled={status === "saving"}
        onClick={onTrack}
      >
        <Bookmark className="size-4" aria-hidden />
        {status === "saving" ? "Saving…" : "Track this application"}
      </Button>
      {message ? (
        <p
          className={cn(
            "text-center text-xs sm:text-left",
            status === "error" ? "text-red-600" : "text-[#27AE60]",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
