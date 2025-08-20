import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { SectorSection } from "@/components/sector-section";
import { RecentJobsSection } from "@/components/recent-jobs-section";
import PricingSection from "@/components/pricing-section";
import { Suspense } from "react";
import CandidateRecruiterCompanyList from "@/components/CandidateRecruiterCompanyList";

export default function Home() {
  return (
    <div className="">
      <Suspense fallback={<div>Loading...</div>}>
        <HeroSection />
        <HowItWorksSection />
        <SectorSection />
        <RecentJobsSection />
        <PricingSection />

        <CandidateRecruiterCompanyList />
      </Suspense>
    </div>
  );
}
