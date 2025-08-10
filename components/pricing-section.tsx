import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Image from "next/image"

export default function PricingSection() {
  return (
    <div id="#candidates-pricing" className="relative min-h-screen flex items-center justify-center p-4 bg-gray-50 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-30">
        <Image
          src="/assets/vector.png"
          alt="Background wave pattern"
          width={1000}
          height={1000}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 grid gap-6 md:grid-cols-2 w-[756px] ">
        {/* Basic Plan Card */}
        <Card className="rounded-xl shadow-lg p-6  border border-gray-200 w-[362px] ">
          <CardHeader className="pb-4">
            <p className="text-base font-semibold text-[#44B6CA] uppercase tracking-wider mb-[24px]">BASIC PLAN</p>
            <h2 className="text-base font-normal text-[#8593A3] text-nowrap"> <span className="text-[#282828] text-[64px] font-bold ">Free</span> What you will get :</h2>
         
            <p className="text-[#8593A3] !mt-[24px] text-base  leading-relaxed">
              Plan description: Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing,
              and web development.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-[#8593A3]">
                <div className="w-[21px] h-[21px] bg-[#44B6CA] rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
                </div>
                <span>Record or upload a 60 second elevator pitch</span>
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full mt-8 rounded-[80px] border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            >
              Join with basic
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan Card */}
        <Card className="rounded-xl shadow-lg  bg-[#2B7FD0] text-white w-[362px]    ">
          <CardHeader className="mt-4">
            <p className="text-sm font-semibold uppercase tracking-wider">PREMIUM PLAN</p>
            <div className="mt-2">
              <h2 className="text-5xl font-bold inline-flex items-baseline">
                $3.99
                <span className="text-base font-normal ml-1">Per Month</span>
              </h2>
            </div>
            <div className="mt-2 border-b border-white pb-4">
              <h2 className="text-5xl font-bold inline-flex items-baseline">
                $39.99
                <span className="text-base font-normal ml-1">Per Year</span>
              </h2>
            </div>
            <p className="text-sm text-right mt-4">What you will get:</p>
          </CardHeader>
          <CardContent className="mt-1">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-white" />
                <span>Record or upload a 60 second elevator pitch</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-white" />
                <span>Free CV Review</span>
              </li>
            </ul>
            <Button className="w-full mt-8 !rounded-[80px] bg-white text-blue-600 hover:bg-gray-100">Get the premium</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
