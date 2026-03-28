"use client";

import Link from "next/link";
import { DashboardNav, type DashboardNavItem } from "@/app/dashboard/DashboardNav";
import { DashboardLogoutButton } from "@/app/dashboard/DashboardLogoutButton";

type DashboardMobileHeaderProps = {
  navItems: DashboardNavItem[];
  displayName: string;
  avatarUrl: string;
  initials: string;
  email?: string | null;
};

export function DashboardMobileHeader({ navItems, displayName, avatarUrl, initials, email }: DashboardMobileHeaderProps) {
  return (
    <div className="md:hidden">
      <header className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-[#0D0D0D]">
              <span className="inline-block size-2.5 shrink-0 rounded-full bg-[#27AE60]" aria-hidden />
              JobHunch
            </Link>

            <div className="flex items-center gap-2">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="size-9 rounded-full object-cover" />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-[#27AE60]/10 text-sm font-semibold text-[#27AE60]">
                  {initials || "JH"}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3">
            <DashboardNav navItems={navItems} orientation="horizontal" />
          </div>

          {email ? <p className="mt-2 truncate text-xs text-[#6B7280]">{email}</p> : null}
          <p className="sr-only">{displayName}</p>

          <div className="mt-4 border-t border-[#E5E7EB] pt-3">
            <DashboardLogoutButton />
          </div>
        </div>
      </header>
    </div>
  );
}
