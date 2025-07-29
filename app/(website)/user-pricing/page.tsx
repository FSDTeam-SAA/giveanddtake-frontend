"use client"

import { SetStateAction, useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal"

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
        {/* Bronze Plan Card */}
        <Card className="flex flex-col p-8 rounded-xl shadow-lg w-full md:w-1/2 bg-white border border-gray-200">
          <h2 className="text-base text-[#2B7FD0] font-medium uppercase tracking-wider text-left mb-4">BRONZE PLAN</h2>
          <div className="flex items-start mb-4">
            <span className="text-5xl font-bold text-gray-900">$4.99</span>
            <span className="text-base text-[#000000] ml-2">Per Month</span>
          </div>
          <p className="text-[#8593A3] text-base font-bold text-right mb-6">What the user will get</p>
          <p className="text-[#8593A3] text-base mb-8 w-[298px]">
            Plan description: Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing,
            and web development.
          </p>
          <ul className="space-y-4 mb-8 w-full">
            <li className="flex items-center text-gray-700">
              <Check className="w-5 h-5 text-[#8593A3] mr-2" />A 60-sec elevator pitch
            </li>
            <li className="flex items-center text-gray-700">
              <Check className="w-5 h-5 text-[#8593A3] mr-2" />A free CV review and alteration online
            </li>
          </ul>
          <Button
            variant="outline"
            className="w-full max-w-xs py-6 text-bronzeBlue border-bronzeBlue rounded-[80px] text-[18px] font-semibold bg-transparent"
            onClick={() => handleOpenModal(4.99)}
          >
            Join with basic
          </Button>
        </Card>
        {/* Gold Plan Card */}
        <Card className="flex flex-col p-8 rounded-xl shadow-lg w-full md:w-1/2 bg-[#2B7FD0] border border-gray-200">
          <h2 className="text-base text-white font-medium uppercase tracking-wider text-left mb-4">GOLD PLAN</h2>
          <div className="flex items-start mb-4">
            <span className="text-5xl font-bold text-white">$49.99</span>
            <span className="text-base text-white ml-2">Per Year</span>
          </div>
          <p className="text-white text-base font-bold text-right mb-6">What the user will get</p>
          <p className="text-white text-base mb-8 w-[298px]">
            Plan description: Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing,
            and web development.
          </p>
          <ul className="space-y-4 mb-8 w-full">
            <li className="flex items-center text-white">
              <Check className="w-5 h-5 text-white mr-2" />A 60-sec elevator pitch
            </li>
            <li className="flex items-center text-white">
              <Check className="w-5 h-5 text-white mr-2" />A free CV review and alteration online
            </li>
          </ul>
          <Button
            variant="outline"
            className="w-full max-w-xs py-6 text-[#282828] border-bronzeBlue rounded-[80px] text-[18px] font-semibold bg-white"
            onClick={() => handleOpenModal(49.99)}
          >
            Get the premium
          </Button>
        </Card>
      </div>

      {/* Payment Method Modal controlled by PricingList state */}
      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        price={selectedPrice !== null ? selectedPrice.toString() : ""}
      />
    </div>
  )
}