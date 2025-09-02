import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="">
      <Suspense fallback={<div>Lo...</div>}>
        <HeroSection />
        <HowItWorksSection />
        {/* <HowItWorksRecruiter />
        <HowItWorksCompany /> */}
        {/* <SectorSection />
        <RecentJobsSection />
        <PricingSection /> */}

        {/* <CandidateRecruiterCompanyList /> */}
      </Suspense>
    </div>
  );
}
