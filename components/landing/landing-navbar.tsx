import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#reviews", label: "Reviews" },
  { href: "#jobs", label: "Jobs" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-0 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90">
            <Image
              src="/logo.svg"
              alt="JobHunch"
              width={140}
              height={30}
              className="h-7 w-auto sm:h-8"
              priority
            />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex" aria-label="Primary">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#0D0D0D]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/auth"
              className="inline-flex h-9 items-center justify-center rounded-lg border-2 border-[#27AE60] px-3 text-sm font-medium text-[#27AE60] transition hover:bg-[#27AE60]/5 sm:px-4"
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#27AE60] px-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#229954] sm:px-4"
            >
              Get started free
            </Link>
          </div>
        </div>

        <nav
          className="-mx-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pb-1 md:hidden"
          aria-label="Primary mobile"
        >
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-xs font-medium text-[#6B7280] transition-colors hover:text-[#0D0D0D]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
