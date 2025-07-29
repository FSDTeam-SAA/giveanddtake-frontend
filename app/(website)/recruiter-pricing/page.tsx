"use client";

import { Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal";

interface Feature {
  text: string;
}

interface Plan {
  name: string;
  monthlyPrice?: string;
  annualPrice?: string;
  description?: string;
  features: Feature[];
  buttonText: string;
  planId: string;
}

const plans: Plan[] = [
  {
    name: "Pay as You Go",
    description: "$99.99 per Job Advert (30 Days Post)",
    features: [
      { text: "First post free!" },
      { text: "Recruiter's 180-Second Elevator Video Pitch" },
      { text: "Enjoy seamless job posting amendments/closure/reopening" },
      { text: "Schedule your job post" },
      { text: "Initial video screening of job applicants" },
      { text: "Update job applicants promptly" },
    ],
    buttonText: "Sign up",
    planId: "pay_as_you_go",
  },
  {
    name: "BASIC PLAN",
    monthlyPrice: "$190.99 per month",
    annualPrice: "$2,100.89 per annum",
    features: [
      { text: "First post free!" },
      { text: "Recruiter's 180-Second Elevator Video Pitch" },
      { text: "Up to 24 job posts per annual cycle" },
      { text: "Enjoy seamless job posting amendments/closure/reopening" },
      { text: "Schedule your job post" },
      { text: "Initial video screening of job applicants" },
      { text: "View elevator video pitches of all job applicants" },
      { text: "Update job applicants promptly" },
      { text: "12 months for the price of 11 Months!" },
    ],
    buttonText: "Sign up to basic",
    planId: "basic_plan",
  },
  {
    name: "BRONZE PLAN",
    monthlyPrice: "$270.99 per month",
    annualPrice: "$2,969.99 per annum",
    features: [
      { text: "First post free!" },
      { text: "Recruiter's 180-Second Elevator Video Pitch" },
      { text: "Up to 36 job posts per annual cycle" },
      { text: "Enjoy seamless job posting amendment/closure/reopening" },
      { text: "Schedule your job post" },
      { text: "Initial video screening of job applicants" },
      { text: "View elevator video pitches of all job applicants" },
      { text: "Update job applicants promptly" },
      { text: "12 months for the price of 11 Months!" },
    ],
    buttonText: "Sign up to bronze",
    planId: "bronze_plan",
  },
  {
    name: "SILVER PLAN",
    monthlyPrice: "$352.99 per month",
    annualPrice: "$3,882.89 per annum",
    features: [
      { text: "First post free!" },
      { text: "Recruiter's 180-Second Elevator Video Pitch" },
      { text: "Up to 48 job posts per annual cycle" },
      { text: "Enjoy seamless job posting amendment/closure/reopening" },
      { text: "Schedule your job post" },
      { text: "Initial video screening of job applicants" },
      { text: "View elevator video pitches of all job applicants" },
      { text: "Update job applicants promptly" },
      { text: "12 months for the price of 11 Months!" },
    ],
    buttonText: "Sign up to silver",
    planId: "silver_plan",
  },
  {
    name: "GOLD PLAN",
    monthlyPrice: "$425.99 per month",
    annualPrice: "$4,685.99 per year",
    features: [
      { text: "First post free!" },
      { text: "Recruiter's 180-Second Elevator Video Pitch" },
      { text: "Up to 60 job posts per annual cycle" },
      { text: "Enjoy seamless job posting amendments/closure/reopening" },
      { text: "Schedule your job post" },
      { text: "Initial video screening of job applicants" },
      { text: "View elevator video pitches of all job applicants" },
      { text: "Update job applicants promptly" },
      { text: "12 months for the price of 11 Months!" },
    ],
    buttonText: "Sign up to gold",
    planId: "gold_plan",
  },
  {
    name: "PLATINUM PLAN",
    monthlyPrice: "$999.99 per month",
    annualPrice: "$10,999.89 per year",
    features: [
      { text: "First post free!" },
      { text: "Recruiter's 180-Second Elevator Video Pitch" },
      { text: "Unlimited job posts per annual cycle" },
      { text: "Enjoy seamless job posting amendment/closure/reopening" },
      { text: "Schedule your job post" },
      { text: "Initial video screening of job applicants" },
      { text: "View elevator video pitches of all job applicants" },
      { text: "Update job applicants promptly" },
      { text: "12 months for the price of 11 Months!" },
    ],
    buttonText: "Sign up to platinum",
    planId: "platinum_plan",
  },
];

export default function PricingPlans() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [showPlanOptions, setShowPlanOptions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handlePlanSelect = (plan: Plan) => {
    if (!plan.monthlyPrice) {
      // For Pay as You Go - extract price keeping the decimal point
      const priceMatch = plan.description?.match(/\$(\d+\.\d{2})/);
      setSelectedPrice(priceMatch ? priceMatch[1] : "99.99");
      setSelectedPlan(plan);
      setIsModalOpen(true);
    } else {
      setSelectedPlan(plan);
      setShowPlanOptions(true);
    }
  };

  const handlePaymentOptionSelect = (isMonthly: boolean) => {
    if (selectedPlan) {
      // Extract price keeping the decimal point
      const priceStr = isMonthly
        ? selectedPlan.monthlyPrice
        : selectedPlan.annualPrice;
      const priceMatch = priceStr?.match(/\$?(\d+,\d{3}\.\d{2}|\d+\.\d{2})/);
      const priceValue = priceMatch ? priceMatch[1].replace(/,/g, "") : "0.00";
      setSelectedPrice(priceValue);
      setIsModalOpen(true);
      setShowPlanOptions(false);
    }
  };

  return (
    <div>
      <div className="mb-12 mt-[60px] text-center">
        <h1 className="mb-2 text-4xl font-bold text-gray-800">
          Recruiter Price List
        </h1>
        <p className="text-xl text-gray-600">For Elevator Pitch</p>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Plan Options Modal */}
        {showPlanOptions && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-xl font-bold">
                Select Payment Option for {selectedPlan.name}
              </h3>
              <div className="space-y-3">
                <Button
                  className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
                  onClick={() => handlePaymentOptionSelect(true)}
                >
                  Monthly: {selectedPlan.monthlyPrice}
                </Button>
                <Button
                  className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
                  onClick={() => handlePaymentOptionSelect(false)}
                >
                  Annual: {selectedPlan.annualPrice}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowPlanOptions(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid w-full max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className="flex flex-col justify-between shadow-lg border-none rounded-xl overflow-hidden"
            >
              <CardHeader className="p-6 pb-0">
                <CardTitle
                  className={`font-midium   ${
                    plan.name === "Pay as You Go"
                      ? "text-gray-800"
                      : " text-base text-[#2B7FD0]"
                  }`}
                >
                  {plan.name}
                </CardTitle>
                <div className="mt-2">
                  {plan.description ? (
                    <p className="text-gray-500 text-sm">{plan.description}</p>
                  ) : (
                    <>
                      <p className="text-[32px] font-bold text-[#282828]">
                        {plan.monthlyPrice}
                      </p>
                      <p className="text-[32px] font-bold text-[#282828]">
                        {plan.annualPrice}
                      </p>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-4 flex-grow">
                <h3 className="font-midium text-base text-[#8593A3]0 mb-3">
                  What you will get
                </h3>
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 ">
                      <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#2B7FD0]">
                        <Check className="h-5 w-5 flex-shrink-0 text-white" />
                      </div>
                      <span className="text-base text-[#343434] font-medium">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                {/* <Button 
                className="w-full py-2 rounded-md bg-white text-base text-[#8593A3] font-medium"
                onClick={() => handlePlanSelect(plan)}
              >
                {plan.buttonText}
              </Button> */}
                <Button
                  className="h-[58px] w-full rounded-[80px] text-lg font-semibold text-[#8593A3]"
                  variant="outline"
                  onClick={() => handlePlanSelect(plan)}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Payment Method Modal */}
        <PaymentMethodModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          price={selectedPrice || ""}
          // planId={selectedPlan?.planId || ""}
        />
      </div>
    </div>
  );
}
