import Link from "next/link";
import { ReviewMockup } from "./review-mockup";

export function LandingHero() {
  return (
    <section className="border-b border-[#E5E7EB] bg-[#F7F8FA] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-[#0D0D0D] shadow-sm">
            Built for African professionals 🌍
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[#0D0D0D] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Know what it&apos;s really like to work there.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-[#6B7280]">
            JobHunch helps you discover honest workplace reviews, find vetted jobs, and track your applications, all in
            one place, built for Nigeria and Africa.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#27AE60] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#229954]"
            >
              Get started free
            </Link>
            <Link
              href="/dashboard/reviews"
              className="inline-flex h-11 items-center justify-center rounded-lg border-2 border-[#27AE60] bg-white px-6 text-sm font-semibold text-[#27AE60] transition hover:bg-[#27AE60]/5"
            >
              Read reviews
            </Link>
          </div>
          <p className="text-sm text-[#6B7280]">
            Join professionals reviewing companies across Nigeria and Africa
          </p>
        </div>

        <div id="reviews" className="scroll-mt-28 flex justify-center lg:justify-end">
          <ReviewMockup />
        </div>
      </div>
    </section>
  );
}
