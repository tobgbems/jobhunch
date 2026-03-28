"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, ClipboardList, MessageSquare, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardNavItem = { href: string; label: string; badge?: number };

type DashboardNavProps = {
  navItems: DashboardNavItem[];
  orientation: "vertical" | "horizontal";
};

function navIcon(href: string) {
  const cls = "size-[18px] shrink-0";
  if (href.includes("/reviews")) return <MessageSquare className={cls} aria-hidden />;
  if (href.includes("/jobs")) return <Briefcase className={cls} aria-hidden />;
  if (href.includes("/applications")) return <ClipboardList className={cls} aria-hidden />;
  if (href.includes("/profile")) return <UserCircle className={cls} aria-hidden />;
  return null;
}

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/dashboard") return pathname.startsWith("/dashboard");
  return pathname.startsWith(`${href}/`) || pathname === href;
}

export function DashboardNav({ navItems, orientation }: DashboardNavProps) {
  const pathname = usePathname() ?? "/";

  if (orientation === "horizontal") {
    return (
      <nav className="flex items-center gap-1 overflow-x-auto pb-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const icon = navIcon(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-w-0 max-w-[11rem] items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-[#27AE60] text-white"
                  : "text-[#6B7280] hover:bg-[#F0FDF4] hover:text-[#0D0D0D]",
              )}
            >
              {icon ? <span className={active ? "text-white" : "text-[#6B7280]"}>{icon}</span> : null}
              <span className="truncate">{item.label}</span>
              {typeof item.badge === "number" ? (
                <span
                  className={cn(
                    "ml-auto min-w-[1.25rem] shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold tabular-nums",
                    active ? "bg-white/25 text-white" : "bg-[#27AE60] text-white",
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        const icon = navIcon(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-[#27AE60] text-white"
                : "text-[#6B7280] hover:bg-[#F0FDF4] hover:text-[#0D0D0D]",
            )}
          >
            {icon ? <span className={cn(active ? "text-white" : "text-[#6B7280]")}>{icon}</span> : null}
            <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
            {typeof item.badge === "number" ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-white/25 text-white" : "bg-[#27AE60] text-white",
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
