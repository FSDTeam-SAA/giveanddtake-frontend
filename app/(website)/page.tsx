import ChatbotWidget from "@/components/chatbot-widget";
import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { useSocket } from "@/hooks/use-socket";
import { useSession } from "next-auth/react";
import { Suspense, useEffect } from "react";

export default function Home() {

  return (
    <div>
      <Suspense fallback={<LoadingFallback />}>
        <HeroSection />
        <HowItWorksSection />
        {/* <HowItWorksRecruiter /> */}
        {/* <HowItWorksCompany /> */}
        {/* <SectorSection /> */}
        {/* <RecentJobsSection /> */}
        {/* <PricingSection /> */}
        {/* <CandidateRecruiterCompanyList /> */}
         <ChatbotWidget />
      </Suspense>
    </div>
  );
}

// ✅ Animated Loading Fallback
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 animate-pulse">Loading...</p>
    </div>
  );
}
