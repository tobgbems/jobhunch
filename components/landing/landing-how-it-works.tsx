export function LandingHowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Create your free account",
      body: "Sign up with Google or your email. No password needed.",
    },
    {
      n: "2",
      title: "Find your company",
      body: "Search for your current or past employer.",
    },
    {
      n: "3",
      title: "Read or write a review",
      body: "Share your experience anonymously or discover what others say.",
    },
  ];

  return (
    <section className="border-b border-[#E5E7EB] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-[#27AE60]">How it works</p>
        <h2 className="mt-2 text-balance text-center text-3xl font-bold tracking-tight text-[#0D0D0D] sm:text-4xl">
          From signup to insights in minutes
        </h2>

        <div className="relative mt-14 grid gap-10 lg:grid-cols-3 lg:gap-6">
          <div
            className="pointer-events-none absolute left-0 right-0 top-8 hidden h-0.5 bg-[#E5E7EB] lg:block"
            style={{ marginLeft: "12%", marginRight: "12%" }}
            aria-hidden
          />
          {steps.map((step) => (
            <div key={step.n} className="relative flex flex-col items-center text-center lg:items-stretch">
              <div className="relative z-10 mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#27AE60] bg-white text-lg font-bold text-[#27AE60] shadow-sm">
                {step.n}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#0D0D0D]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
