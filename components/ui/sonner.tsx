"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      theme="light"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#0D0D0D] group-[.toaster]:border-[#E6E7EA] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#6B7280]",
          actionButton: "group-[.toast]:bg-[#27AE60] group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
