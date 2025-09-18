"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface Feature {
  text: string;
  included: boolean;
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

const fetchCompanyPlans = async (): Promise<Plan[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data: ApiResponse = await response.json();
  return data.data.filter((plan) => plan.for === "company");
};

const transformApiPlanToLocalPlan = (apiPlan: Plan) => {
  return {
    name: apiPlan.title,
    description: `$${apiPlan.price} ${apiPlan.description}`,
    features: apiPlan.features.map((feature) => ({
      text: feature,
      included: true,
    })),
    buttonText: "Purchase",
    planId: apiPlan._id,
  };
};

export default function PricingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] =
    useState<ReturnType<typeof transformApiPlanToLocalPlan> | null>(null);

  // NEW: track the user's current plan id
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  const { data: apiPlans, isLoading, error } = useQuery({
    queryKey: ["companyPlans"],
    queryFn: fetchCompanyPlans,
  });

  const { data: session, status } = useSession();

  const handlePlanSelect = (
    plan: ReturnType<typeof transformApiPlanToLocalPlan>
  ) => {
    // Extract price keeping the decimal point
    const priceMatch = plan.description.match(/\$(\d+\.\d{2}|\d+)/);
    setSelectedPrice(priceMatch ? priceMatch[1] : "0.00");
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  // NEW: fetch the user and set currentPlanId
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "authenticated" && (session as any)?.accessToken) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
            {
              headers: {
                Authorization: `Bearer ${(session as any).accessToken}`,
              },
            }
          );
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
          <h1 className="text-2xl font-semibold text-red-500">
            Error loading plans
          </h1>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!apiPlans || apiPlans.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">No company plans available</h1>
        </div>
      </div>
    );
  }

  const pricingPlans = apiPlans.map(transformApiPlanToLocalPlan);

  return (
    <div className="flex items-center justify-center bg-gray-50 p-4">
      <div>
        <div className="mb-12 mt-[60px] text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            Company Price List
          </h1>
          <p className="text-xl text-gray-600">For Elevator Pitch</p>
        </div>

        <div className="grid w-full container grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 py-4">
          {pricingPlans.map((plan, index) => {
            const isCurrent = currentPlanId === plan.planId;

            return (
              <Card
                key={index}
                className={cn(
                  "flex flex-col justify-between overflow-hidden border-none rounded-lg shadow-sm"
                )}
              >
                <CardHeader className="space-y-2 p-6">
                  <CardTitle className="font-medium text-base text-[#2B7FD0]">
                    {plan.name.toUpperCase()}
                  </CardTitle>
                  <CardDescription className="text-[32px] font-bold text-[#282828]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow space-y-4 p-6 pt-0">
                  <h3 className="font-medium text-base text-[#8593A3]">
                    What you will get
                  </h3>
                  <ul className="space-y-2 text-[#343434]">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
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
      </div>

      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        price={selectedPrice || ""}
        planId={selectedPlan?.planId || ""}
      />
    </div>
  );
}
