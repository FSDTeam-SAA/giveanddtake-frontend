"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface Feature {
  text: string;
}

interface Plan {
  _id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
  for: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Plan[];
}

const fetchRecruiterPlans = async (): Promise<Plan[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data: ApiResponse = await response.json();
  return data.data.filter((plan) => plan.for === "recruiter");
};

const transformApiPlanToLocalPlan = (apiPlan: Plan): {
  name: string;
  description?: string;
  monthlyPrice?: string;
  annualPrice?: string;
  features: Feature[];
  buttonText: string;
  planId: string;
} => {
  const isPayAsYouGo = apiPlan.title.toLowerCase().includes("pay as you go");

  if (isPayAsYouGo) {
    return {
      name: apiPlan.title,
      description: `$${apiPlan.price.toFixed(2)} per Job Advert (30 Days Post)`,
      features: apiPlan.features.map((feature) => ({ text: feature })),
      buttonText: "Purchase",
      planId: apiPlan._id,
    };
  }

  const supportsAnnual = !apiPlan.title.toLowerCase().includes("basic");
  const monthlyPrice = apiPlan.price;

  return {
    name: apiPlan.title,
    monthlyPrice: `$${monthlyPrice.toFixed(2)} per month`,
    ...(supportsAnnual && { annualPrice: `$${(monthlyPrice * 12).toFixed(2)} per annum` }),
    features: apiPlan.features.map((feature) => ({ text: feature })),
    buttonText: `Sign up to ${apiPlan.title.toLowerCase().split(" ")[0]}`,
    planId: apiPlan._id,
  };
};

export default function PricingPlans() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [showPlanOptions, setShowPlanOptions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ReturnType<typeof transformApiPlanToLocalPlan> | null>(null);

  // NEW: track user's current plan id
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  const { data: apiPlans, isLoading, error } = useQuery({
    queryKey: ["recruiterPlans"],
    queryFn: fetchRecruiterPlans,
  });

  // session for auth to /user/single
  const { data: session, status } = useSession();

  const handlePlanSelect = (plan: ReturnType<typeof transformApiPlanToLocalPlan>) => {
    // Guard: don't open modal if this is already the current plan
    if (currentPlanId === plan.planId) return;

    setSelectedPlan(plan);
    if (plan.description) {
      // Pay as You Go - extract price (supports 12 or 12.00)
      const priceMatch = plan.description.match(/\$(\d+(?:\.\d{2})?)/);
      setSelectedPrice(priceMatch ? priceMatch[1] : "0.00");
      setIsModalOpen(true);
    } else {
      // Subscription plans
      if (!plan.annualPrice) {
        const priceMatch = plan.monthlyPrice?.match(/\$(\d+(?:\.\d{2})?)/);
        setSelectedPrice(priceMatch ? priceMatch[1] : "0.00");
        setIsModalOpen(true);
      } else {
        setShowPlanOptions(true);
      }
    }
  };

  const handlePaymentOptionSelect = (isMonthly: boolean) => {
    if (selectedPlan) {
      const priceStr = isMonthly ? selectedPlan.monthlyPrice : selectedPlan.annualPrice;
      const priceMatch = priceStr?.match(/\$(\d+(?:\.\d{2})?)/);
      const priceValue = priceMatch ? priceMatch[1] : "0.00";
      setSelectedPrice(priceValue);
      setIsModalOpen(true);
      setShowPlanOptions(false);
    }
  };

  // NEW: fetch the user once authenticated and set currentPlanId
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "authenticated" && (session as any)?.accessToken) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/user/single`, {
            headers: {
              Authorization: `Bearer ${(session as any).accessToken}`,
            },
          });
          const result = await response.json();
          if (result?.success) {
            setCurrentPlanId(result?.data?.plan?._id ?? null);
          } else {
            console.error("Failed to fetch user data:", result?.message);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    };

    fetchUserData();
  }, [session, status]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Loading plans...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-500">Error loading plans</h1>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!apiPlans || apiPlans.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">No recruiter plans available</h1>
        </div>
      </div>
    );
  }

  const pricingPlans = apiPlans.map(transformApiPlanToLocalPlan);

  return (
    <div>
      <div className="mb-12 mt-[60px] text-center">
        <h1 className="mb-2 text-4xl font-bold text-gray-800">Recruiter Price List</h1>
        <p className="text-xl text-gray-600">For Elevator Pitch</p>
      </div>

      <div className="flex items-center justify-center bg-gray-50 py-16">
        {/* Plan Options Modal */}
        {showPlanOptions && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-xl font-bold">
                Select Payment Option for {selectedPlan.name}
              </h3>
              <div className="space-y-3">
                {selectedPlan.monthlyPrice && (
                  <Button className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
                          onClick={() => handlePaymentOptionSelect(true)}>
                    Monthly: {selectedPlan.monthlyPrice}
                  </Button>
                )}
                {selectedPlan.annualPrice && (
                  <Button className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
                          onClick={() => handlePaymentOptionSelect(false)}>
                    Annual: {selectedPlan.annualPrice}
                  </Button>
                )}
                <Button variant="ghost" className="w-full" onClick={() => setShowPlanOptions(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid w-full max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricingPlans.map((plan, index) => {
            const isCurrent = currentPlanId === plan.planId;

            return (
              <Card key={index} className="flex flex-col justify-between shadow-lg border-none rounded-xl overflow-hidden">
                <CardHeader className="p-6 pb-0">
                  <CardTitle
                    className={`font-medium ${
                      plan.name.toLowerCase().includes("pay as you go")
                        ? "text-gray-800"
                        : "text-base text-[#2B7FD0]"
                    }`}
                  >
                    {plan.name}
                  </CardTitle>
                  <div className="mt-2">
                    {plan.description ? (
                      <p className="text-gray-500 text-sm">{plan.description}</p>
                    ) : (
                      <>
                        {plan.monthlyPrice && (
                          <p className="text-[32px] font-bold text-[#282828]">
                            {plan.monthlyPrice}
                          </p>
                        )}
                        {plan.annualPrice && (
                          <p className="text-[32px] font-bold text-[#282828]">
                            {plan.annualPrice}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-4 flex-grow">
                  <h3 className="font-medium text-base text-[#8593A3] mb-3">What you will get</h3>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#2B7FD0]">
                          <Check className="h-5 w-5 flex-shrink-0 text-white" />
                        </div>
                        <span className="text-base text-[#343434] font-medium">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  {isCurrent ? (
                    <Button
                      className="h-[58px] w-full rounded-[80px] text-lg font-semibold"
                      variant="secondary"
                      disabled
                    >
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      className="h-[58px] w-full rounded-[80px] text-lg font-semibold text-[#8593A3]"
                      variant="outline"
                      onClick={() => handlePlanSelect(plan)}
                    >
                      {plan.buttonText}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Payment Method Modal */}
        <PaymentMethodModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          price={selectedPrice || "0.00"}
          planId={selectedPlan?.planId || ""}
        />
      </div>
    </div>
  );
}
