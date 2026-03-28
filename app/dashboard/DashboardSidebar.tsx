"use client";

import Link from "next/link";
import { DashboardNav, type DashboardNavItem } from "@/app/dashboard/DashboardNav";
import { DashboardLogoutButton } from "@/app/dashboard/DashboardLogoutButton";

type DashboardSidebarProps = {
  navItems: DashboardNavItem[];
  displayName: string;
  avatarUrl: string;
  initials: string;
  email?: string | null;
};

export function DashboardSidebar({ navItems, displayName, avatarUrl, initials, email }: DashboardSidebarProps) {
  return (
    <aside className="flex h-[calc(100vh-4rem)] flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex flex-1 flex-col px-5 pb-5 pt-8">
        <Link href="/" className="mb-8 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-[#0D0D0D]">
          <span className="inline-block size-2.5 shrink-0 rounded-full bg-[#27AE60]" aria-hidden />
          JobHunch
        </Link>

        <div className="mb-8 rounded-xl border border-[#E5E7EB] bg-white p-4 pl-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] [border-left-width:3px] [border-left-color:#27AE60]">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="size-11 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#27AE60]/10 text-sm font-semibold text-[#27AE60]">
                {initials || "JH"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0D0D0D]">{displayName}</p>
              <p className="truncate text-xs text-[#6B7280]">{email ?? ""}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <DashboardNav navItems={navItems} orientation="vertical" />
        </div>

        <div className="mt-6 shrink-0 border-t border-[#E5E7EB] pt-5">
          <DashboardLogoutButton />
        </div>
      </div>
    </aside>
  );
}
