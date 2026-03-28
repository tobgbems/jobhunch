"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function AlertDialog(props: React.ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />;
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      showCloseButton={false}
      className={cn(
        "max-w-[400px] gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-6 text-[#0D0D0D] shadow-[0_8px_32px_rgba(0,0,0,0.18)] ring-1 ring-black/10 sm:max-w-[400px]",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogContent,
  DialogDescription as AlertDialogDescription,
  AlertDialogFooter,
  DialogHeader as AlertDialogHeader,
  DialogTitle as AlertDialogTitle,
};
