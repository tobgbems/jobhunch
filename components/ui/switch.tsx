"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  const isChecked = Boolean(props.checked)

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-[#B8BFCC] transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-[#27AE60] focus-visible:ring-2 focus-visible:ring-[#27AE60]/35 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[22px] data-[size=default]:w-[40px] data-[size=sm]:h-[18px] data-[size=sm]:w-[32px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-[checked]:border-[#27AE60] data-[checked]:bg-[#27AE60] data-[unchecked]:bg-[#D1D5DB] data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-sm ring-1 ring-black/15 transition-transform",
          size === "default" ? "size-[18px]" : "size-3",
          isChecked
            ? size === "default"
              ? "translate-x-5"
              : "translate-x-[18px]"
            : "translate-x-px",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
