import { Briefcase, Building2, ListChecks, Shield } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Anonymous reviews",
    body: "Find out what employees really think. Reviews are anonymous by choice. Your identity stays protected.",
  },
  {
    icon: Building2,
    title: "Discover company culture",
    body: "Read the good, the bad, and the honest. Understand a company's real culture before you accept that offer.",
  },
  {
    icon: Briefcase,
    title: "Curated job board",
    body: "Browse opportunities from top African companies. Every listing is vetted. No spam, no fake roles.",
  },
  {
    icon: ListChecks,
    title: "Track your applications",
    body: "Stay organized across every application, whether you applied on JobHunch or anywhere else.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 border-b border-[#E5E7EB] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-[#27AE60]">Everything you need</p>
        <h2 className="mt-2 text-balance text-center text-3xl font-bold tracking-tight text-[#0D0D0D] sm:text-4xl">
          Make smarter career moves
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              id={i === 2 ? "jobs" : undefined}
              className="scroll-mt-28 rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-6 transition hover:border-[#27AE60]/40 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#27AE60]/10 text-[#27AE60]">
                <f.icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#0D0D0D]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
