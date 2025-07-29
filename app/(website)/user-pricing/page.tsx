

"use client"

import { useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal"

const plans = [
  {
    name: "BRONZE PLAN",
    price: 4.99,
    period: "Per Month",
    description:
      "Plan description: Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development.",
    features: ["A 60-sec elevator pitch", "A free CV review and alteration online"],
    buttonText: "Join with basic",
    cardBgClass: "bg-white border border-gray-200",
    nameColorClass: "text-[#2B7FD0]",
    priceColorClass: "text-gray-900",
    periodColorClass: "text-[#000000]",
    descriptionColorClass: "text-[#8593A3]",
    featureColorClass: "text-gray-700",
    checkIconColorClass: "text-[#8593A3]",
    buttonVariant: "outline",
    buttonClass: "text-[#2B7FD0] border-[#2B7FD0] bg-transparent",
  },
  {
    name: "GOLD PLAN",
    price: 49.99,
    period: "Per Year",
    description:
      "Plan description: Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development.",
    features: ["A 60-sec elevator pitch", "A free CV review and alteration online"],
    buttonText: "Get the premium",
    cardBgClass: "bg-[#2B7FD0] border border-gray-200",
    nameColorClass: "text-white",
    priceColorClass: "text-white",
    periodColorClass: "text-white",
    descriptionColorClass: "text-white",
    featureColorClass: "text-white",
    checkIconColorClass: "text-white",
    buttonVariant: "outline",
    buttonClass: "text-[#282828] border-[#2B7FD0] bg-white",
  },
]

export default function PricingList() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null)

  const handleOpenModal = (price: number) => {
    setSelectedPrice(price)
    setIsModalOpen(true)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
      style={{ backgroundImage: "url('/wave-pattern.png')" }}
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Price List</h1>
        <p className="text-xl text-gray-600">For Elevator Pitch</p>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-[756px]">
        {plans.map((plan, index) => (
          <Card key={index} className={`flex flex-col p-8 rounded-xl shadow-lg w-full md:w-1/2 ${plan.cardBgClass}`}>
            <h2 className={`text-base font-medium uppercase tracking-wider text-left mb-4 ${plan.nameColorClass}`}>
              {plan.name}
            </h2>
            <div className="flex items-start mb-4">
              <span className={`text-5xl font-bold ${plan.priceColorClass}`}>${plan.price}</span>
              <span className={`text-base ml-2 ${plan.periodColorClass}`}>{plan.period}</span>
            </div>
            <p className={`text-base font-bold text-right mb-6 ${plan.descriptionColorClass}`}>
              What the user will get
            </p>
            <p className={`text-base mb-8 w-[298px] ${plan.descriptionColorClass}`}>{plan.description}</p>
            <ul className="space-y-4 mb-8 w-full">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className={`flex items-center gap-2 ${plan.featureColorClass}`}>
                  <div className=" bg-[#2B7FD0] rounded-full w-[21px] h-[21px] ">
                  <Check className={`w-5 h-5 mr-2 text-white `} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.buttonVariant as "outline"}
              className={`w-full max-w-xs py-6 rounded-[80px] text-[18px] font-semibold `}
              onClick={() => handleOpenModal(plan.price)}
            >
              {plan.buttonText}
            </Button>
          </Card>
        ))}
      </div>
      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        price={selectedPrice !== null ? selectedPrice.toString() : ""}
      />
    </div>
  )
}
