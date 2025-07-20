import { PricingCard } from "./pricing-card"
import Image from "next/image"

export function PricingSection() {
  const basicPlan = {
    planName: "BASIC PLAN",
    features: [
      "Plan description: Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development.",
    ],
    buttonText: "Join with basic",
    buttonVariant: "outline" as const,
  }

  const premiumPlan = {
    planName: "PREMIUM PLAN",
    priceMonthly: "$3.99",
    priceYearly: "$39.99",
    features: ["Record or upload a 60 second elevator pitch", "Free CV Review"],
    buttonText: "Get the premium",
    buttonVariant: "default" as const,
    isPremium: true,
  }

  return (
    <section className="relative w-full py-12 md:py-24 lg:py-32 overflow-hidden">
      {/* Background abstract wave pattern */}
      <Image
        src="/placeholder.svg?height=400&width=800"
        alt="Abstract wave pattern"
        width={800}
        height={400}
        className="absolute top-0 left-0 w-full h-full object-cover opacity-10 z-0"
      />

      <div className="container px-4 md:px-6 text-center relative z-10">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Pricing & Plan (Jobseekers Page)
        </h2>
        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl mt-4">
          Lorem ipsum dolor sit amet consectetur. Id eget mi. Malesuada id eget mi. Malesuada
        </p>
        <div className="grid gap-8 md:grid-cols-2 mt-12 max-w-4xl mx-auto">
          <PricingCard {...basicPlan} />
          <PricingCard {...premiumPlan} />
        </div>
      </div>
    </section>
  )
}
