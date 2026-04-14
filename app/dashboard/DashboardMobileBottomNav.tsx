"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, ClipboardList, MessageSquare, User } from "lucide-react";
import type { DashboardNavItem } from "@/app/dashboard/DashboardNav";
import { cn } from "@/lib/utils";

type DashboardMobileBottomNavProps = {
  navItems: DashboardNavItem[];
};

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/dashboard") return pathname.startsWith("/dashboard");
  return pathname.startsWith(`${href}/`) || pathname === href;
}

function navLabel(item: DashboardNavItem) {
  if (item.href.includes("/applications")) return "Applications";
  return item.label;
}

function navIcon(href: string, active: boolean) {
  const cls = cn("size-5", active ? "text-[#27AE60]" : "text-[#6B7280]");
  if (href.includes("/reviews")) return <MessageSquare className={cls} aria-hidden />;
  if (href.includes("/jobs")) return <Briefcase className={cls} aria-hidden />;
  if (href.includes("/applications")) return <ClipboardList className={cls} aria-hidden />;
  if (href.includes("/profile")) return <User className={cls} aria-hidden />;
  return null;
}

export function DashboardMobileBottomNav({ navItems }: DashboardMobileBottomNavProps) {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E5E7EB] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 md:hidden"
      aria-label="Dashboard mobile navigation"
    >
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const icon = navIcon(item.href, active);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2"
            >
              <span className="relative inline-flex items-center justify-center">
                {icon}
                {typeof item.badge === "number" ? (
                  <span className="absolute -right-3 -top-2 min-w-[1rem] rounded-full bg-[#27AE60] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white tabular-nums">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              <span className={cn("text-[11px] font-medium", active ? "text-[#27AE60]" : "text-[#6B7280]")}>
                {navLabel(item)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
