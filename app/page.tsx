import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { SectorSection } from "@/components/sector-section"
import { RecentJobsSection } from "@/components/recent-jobs-section"
import { PricingSection } from "@/components/pricing-section"
import { Footer } from "@/components/footer" // Import the new Footer component

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <SectorSection />
        <RecentJobsSection />
        <PricingSection />
      </main>
      <Footer /> {/* Add the Footer component */}
    </div>
  )
}
