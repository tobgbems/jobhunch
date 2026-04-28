import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "#features", label: "Features" },
  { href: "#reviews", label: "Reviews" },
  { href: "/jobs", label: "Jobs" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex shrink-0 items-center transition-opacity hover:opacity-90">
          <Image src="/logo.svg" alt="JobHunch" width={130} height={28} className="h-7 w-auto" />
        </Link>

        <nav
          className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm text-[#6B7280]"
          aria-label="Footer"
        >
          {footerLinks.map((item, i) => (
            <span key={item.href} className="inline-flex items-center">
              <span className="mx-2 text-[#E5E7EB]" aria-hidden>
                ·
              </span>
              <a href={item.href} className="transition-colors hover:text-[#0D0D0D]">
                {item.label}
              </a>
            </span>
          ))}
          <span className="inline-flex items-center">
            <span className="mx-2 text-[#E5E7EB]" aria-hidden>
              ·
            </span>
            <Link href="/privacy" className="transition-colors hover:text-[#0D0D0D]">
              Privacy Policy
            </Link>
          </span>
          <span className="inline-flex items-center">
            <span className="mx-2 text-[#E5E7EB]" aria-hidden>
              ·
            </span>
            <Link href="/terms" className="transition-colors hover:text-[#0D0D0D]">
              Terms
            </Link>
          </span>
        </nav>

        <p className="text-sm text-[#6B7280] lg:text-right">© 2026 JobHunch. Built for Africa.</p>
      </div>
    </footer>
  );
}
