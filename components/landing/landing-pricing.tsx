import Link from "next/link";

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-24 border-b border-[#E5E7EB] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-[#27AE60]">Pricing</p>
        <h2 className="mt-2 text-balance text-center text-3xl font-bold tracking-tight text-[#0D0D0D] sm:text-4xl">
          Simple plans when you&apos;re ready
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[#6B7280]">
          We&apos;re finalizing tiers and features. JobHunch will stay easy to try — details and pricing will be posted
          here soon.
        </p>

        <div className="mx-auto mt-10 max-w-lg">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-[#0D0D0D]">Free to explore</p>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              Start with core reviews and job tools at no cost. Paid options for teams and power users will follow — we
              will spell out exactly what you get before anything changes.
            </p>
            <Link
              href="/auth"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#27AE60] px-6 text-sm font-semibold text-white transition hover:bg-[#229954]"
            >
              Get started free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
