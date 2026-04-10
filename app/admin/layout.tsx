import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";

const adminNav = [
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/companies", label: "Companies" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#0f1419] text-slate-100 antialiased">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-56 shrink-0 border-r border-slate-800 bg-[#0b0e12] px-4 py-8 md:block">
          <div className="mb-8 px-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">JobHunch</p>
            <p className="mt-1 text-lg font-semibold text-white">Admin Panel</p>
          </div>
          <nav className="flex flex-col gap-1">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-800 bg-[#0f1419] px-6 py-4 md:hidden">
            <p className="text-sm font-semibold text-white">Admin Panel</p>
          </header>
          <main className="p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
