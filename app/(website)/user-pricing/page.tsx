

"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal"

interface SubscriptionPlan {
  _id: string
  title: string
  description: string
  price: number
  features: string[]
  for: string
  createdAt: string
  updatedAt: string
  __v: number
}

const fetchPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const data = await response.json()
  return data.data.filter((plan: SubscriptionPlan) => plan.for === "candidate")
}

const getPlanStyles = (index: number) => {
  if (index === 0) {
    return {
      cardBgClass: "bg-white border border-gray-200",
      nameColorClass: "text-[#2B7FD0]",
      priceColorClass: "text-gray-900",
      periodColorClass: "text-[#000000]",
      descriptionColorClass: "text-[#8593A3]",
      featureColorClass: "text-gray-700",
      checkIconColorClass: "text-[#8593A3]",
      buttonVariant: "outline",
      buttonClass: "text-[#2B7FD0] border-[#2B7FD0] bg-transparent",
    }
  } else {
    return {
      cardBgClass: "bg-[#2B7FD0] border border-gray-200",
      nameColorClass: "text-white",
      priceColorClass: "text-white",
      periodColorClass: "text-white",
      descriptionColorClass: "text-white",
      featureColorClass: "text-white",
      checkIconColorClass: "text-white",
      buttonVariant: "outline",
      buttonClass: "text-[#282828] border-[#2B7FD0] bg-white",
    }
  }
}

export default function PricingList() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null)

  const { data: plans, isLoading, error } = useQuery<SubscriptionPlan[]>({
    queryKey: ["subscriptionPlans"],
    queryFn: fetchPlans,
  })

  const handleOpenModal = (price: number) => {
    setSelectedPrice(price)
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Loading plans...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-500">Error loading plans</h1>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    )
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">No candidate plans available</h1>
        </div>
      </div>
    )
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
        {plans.map((plan, index) => {
          const styles = getPlanStyles(index)
          return (
            <Card key={plan._id} className={`flex flex-col p-8 rounded-xl shadow-lg w-full md:w-1/2 ${styles.cardBgClass}`}>
              <h2 className={`text-base font-medium uppercase tracking-wider text-left mb-4 ${styles.nameColorClass}`}>
                {plan.title}
              </h2>
              <div className="flex items-start mb-4">
                <span className={`text-5xl font-bold ${styles.priceColorClass}`}>${plan.price}</span>
                <span className={`text-base ml-2 ${styles.periodColorClass}`}>Per Month</span>
              </div>
              <p className={`text-base font-bold text-right mb-6 ${styles.descriptionColorClass}`}>
                What the user will get
              </p>
              <p className={`text-base mb-8 w-[298px] ${styles.descriptionColorClass}`}>{plan.description}</p>
              <ul className="space-y-4 mb-8 w-full">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className={`flex items-center gap-2 ${styles.featureColorClass}`}>
                    <div className="bg-[#2B7FD0] rounded-full w-[21px] h-[21px]">
                      <Check className={`w-5 h-5 mr-2 text-white`} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={styles.buttonVariant as "outline"}
                className={`w-full max-w-xs py-6 rounded-[80px] text-[18px] font-semibold ${styles.buttonClass}`}
                onClick={() => handleOpenModal(plan.price)}
              >
                {index === 0 ? "Join with basic" : "Get the premium"}
              </Button>
            </Card>
          )
        })}
      </div>
      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        price={selectedPrice !== null ? selectedPrice.toString() : ""}
        planId={plans[0]._id}
      />
    </div>
  )
}