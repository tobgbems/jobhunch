import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/app/dashboard/DashboardSidebar";
import { DashboardMobileBottomNav } from "@/app/dashboard/DashboardMobileBottomNav";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { count: jobsCount } = await supabase.from("jobs").select("*", { count: "exact", head: true });

  const { count: applicationsCount } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const navItems = [
    { href: "/dashboard/reviews", label: "Reviews" },
    { href: "/dashboard/jobs", label: "Jobs", badge: jobsCount ?? 0 },
    { href: "/dashboard/applications", label: "My Applications", badge: applicationsCount ?? 0 },
    { href: "/dashboard/profile", label: "Profile" },
  ];

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = String(
    profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? "JobHunch User",
  );
  const avatarUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? "";
  const initials = displayName
    .split(" ")
    .map((part: string) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0D0D0D] reviews-light">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="grid gap-6 md:grid-cols-[280px_1fr] md:items-start">
          <div className="hidden md:block">
            <DashboardSidebar
              navItems={navItems}
              displayName={displayName}
              avatarUrl={avatarUrl}
              initials={initials}
              email={user.email}
            />
          </div>

          <main className="min-w-0 pb-16 md:pb-0">{children}</main>
        </div>
      </div>
      <DashboardMobileBottomNav navItems={navItems} />
    </div>
  );
}
