
import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { SectorSection } from "@/components/sector-section";
import { RecentJobsSection } from "@/components/recent-jobs-section";
import { PricingSection } from "@/components/pricing-section";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <HowItWorksSection />
      <SectorSection />
      <RecentJobsSection />
      <PricingSection />
    </div>
  );
}
