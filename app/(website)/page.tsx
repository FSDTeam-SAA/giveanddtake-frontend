import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { SectorSection } from "@/components/sector-section";
import { RecentJobsSection } from "@/components/recent-jobs-section";
import PricingSection from "@/components/pricing-section";
import { Suspense } from "react";
import { HowItWorksRecruiter } from "@/components/how-it-works-rec";
import { HowItWorksCompany } from "@/components/how-it-works-company";
import CandidateRecruiterCompanyList from "@/components/CandidateRecruiterCompanyList";

export default function Home() {
  return (
    <div className="">
      <Suspense fallback={<div>Loading...</div>}>
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
