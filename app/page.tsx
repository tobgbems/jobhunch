import { LandingCtaBanner } from "@/components/landing/landing-cta-banner";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingStats } from "@/components/landing/landing-stats";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0D0D0D] antialiased">
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingStats />
      <LandingPricing />
      <LandingHowItWorks />
      <LandingCtaBanner />
      <LandingFooter />
    </div>
  );
}
