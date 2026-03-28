import Link from "next/link";

export function LandingCtaBanner() {
  return (
    <section className="bg-[#27AE60] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to make your next move count?
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-white/80">
          Join professionals across Nigeria and Africa who use JobHunch to find the right workplace.
        </p>
        <Link
          href="/auth"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-base font-semibold text-[#27AE60] shadow-sm transition hover:bg-white/95"
        >
          Get started free
        </Link>
      </div>
    </section>
  );
}
