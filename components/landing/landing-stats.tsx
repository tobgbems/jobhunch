export function LandingStats() {
  return (
    <section className="border-b border-[#E5E7EB] bg-[#F7F8FA] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 text-center sm:grid-cols-3 sm:gap-8">
          <div className="space-y-2">
            <p className="text-3xl font-bold tracking-tight text-[#0D0D0D] sm:text-4xl">
              <span className="text-[#27AE60]">100+</span> Companies
            </p>
            <p className="text-sm text-[#6B7280]">and growing across Nigeria and Africa</p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-[#F5A623] sm:text-4xl">Anonymous</p>
            <p className="text-sm text-[#6B7280]">Your identity is always protected</p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold tracking-tight text-[#0D0D0D] sm:text-4xl">
              <span className="text-[#27AE60]">Free</span> to start
            </p>
            <p className="text-sm text-[#6B7280]">No credit card required</p>
          </div>
        </div>
      </div>
    </section>
  );
}
