"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#reviews", label: "Reviews" },
  { href: "/jobs", label: "Jobs" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleNavClick = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) {
      closeMobileMenu();
      return;
    }

    event.preventDefault();
    closeMobileMenu();

    if (pathname !== "/") {
      router.push(`/${href}`);
      return;
    }

    const section = document.querySelector(href);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", href);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-0 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
            onClick={closeMobileMenu}
          >
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
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick(item.href)}
                className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#0D0D0D]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 sm:gap-3 md:flex">
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

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#0D0D0D] transition hover:bg-[#F7F8FA] md:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-panel"
            aria-label="Toggle menu"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav
          id="mobile-nav-panel"
          className={`w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white px-4 transition-all duration-300 ease-out md:hidden ${
            isMobileMenuOpen
              ? "max-h-[420px] translate-y-0 py-4 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-1 py-0 opacity-0"
          }`}
          aria-label="Primary mobile"
        >
          <div className="flex flex-col">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick(item.href)}
                className="border-b border-[#F3F4F6] py-3 text-sm font-medium text-[#0D0D0D] transition-colors hover:text-[#27AE60] last:border-b-0"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/auth"
              onClick={closeMobileMenu}
              className="inline-flex h-10 items-center justify-center rounded-lg border-2 border-[#27AE60] px-4 text-sm font-medium text-[#27AE60] transition hover:bg-[#27AE60]/5"
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              onClick={closeMobileMenu}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#27AE60] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#229954]"
            >
              Get started free
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
