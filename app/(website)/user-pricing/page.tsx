"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal";
import { useSession } from "next-auth/react";

/* ----------------------------- Types ----------------------------- */

interface SubscriptionPlan {
  _id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
  for: string;
  valid: "monthly" | "yearly" | "PayAsYouGo" | string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  titleColor?: string;
}

interface PlansApiResponse {
  success: boolean;
  message: string;
  data: SubscriptionPlan[];
}

interface UserApiResponse {
  success: boolean;
  message: string;
  data: {
    plan?: Partial<SubscriptionPlan> | null;
  };
}

// Each candidate plan record is shown as its own card, so monthly and annual
// options sit side by side instead of being merged under one title.
type Billing = "free" | "monthly" | "annual";

/* --------------------------- Utilities --------------------------- */

const BILLING_ORDER: Record<Billing, number> = { free: 0, monthly: 1, annual: 2 };
const BILLING_LABEL: Record<Billing, string> = {
  free: "Free",
  monthly: "Monthly",
  annual: "Annual",
};
const BILLING_PERIOD: Record<Billing, string> = {
  free: "",
  monthly: "month",
  annual: "year",
};

// Candidate "PayAsYouGo" plans run for one month (see computeExpiryFromStart
// in the backend), so they are listed as the monthly option.
const billingOf = (plan: Partial<SubscriptionPlan>): Billing => {
  if (plan.price === 0) return "free";
  const valid = (plan.valid || "").toLowerCase();
  if (valid === "yearly") return "annual";
  if (valid === "monthly" || valid === "payasyougo") return "monthly";
  return /per\s*(ann?um|year)/i.test(plan.description || "")
    ? "annual"
    : "monthly";
};

const toDisplayName = (title: string) => {
  const trimmed = (title || "").trim();
  if (!trimmed) return "Plan";
  const meaningful = trimmed.replace(/[^a-z]/gi, "");
  const hasUpper = /[A-Z]/.test(meaningful);
  if (hasUpper) return trimmed;
  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/* --------------------------- Data Fetch -------------------------- */

const fetchCandidatePlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`
  );
  if (!response.ok) throw new Error("Network response was not ok");
  const data: PlansApiResponse = await response.json();
  return data.data
    .filter((plan) => plan.for === "candidate")
    .sort(
      (a, b) =>
        BILLING_ORDER[billingOf(a)] - BILLING_ORDER[billingOf(b)] ||
        a.price - b.price
    );
};

/* -------------------------- Component ---------------------------- */

export default function PricingList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  // undefined = not loaded yet, null = no active plan
  const [currentPlan, setCurrentPlan] = useState<
    Partial<SubscriptionPlan> | null | undefined
  >(undefined);

  const {
    data: pricingPlans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["candidatePlans"],
    queryFn: fetchCandidatePlans,
  });

  /* ------------------ Fetch current user & plan ------------------- */

  useEffect(() => {
    const fetchUserData = async () => {
      if (status !== "authenticated") return;
      const token = (session as any)?.accessToken;
      if (!token) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok)
          throw new Error(`GET /user/single failed with ${response.status}`);
        const result: UserApiResponse = await response.json();
        // The backend only returns a plan while its payment is still active.
        setCurrentPlan(result?.data?.plan ?? null);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setCurrentPlan(undefined);
      }
    };
    fetchUserData();
  }, [session, status]);

  /* -------------------- Derived current plan ---------------------- */

  const current = useMemo(() => {
    if (currentPlan === undefined) return null;
    if (currentPlan === null) {
      // No active paid plan: the free plan is what the candidate has.
      const free = pricingPlans.find((p) => billingOf(p) === "free");
      return free ? { id: free._id, billing: "free" as Billing, plan: free } : null;
    }
    const match = pricingPlans.find((p) => p._id === currentPlan._id);
    const plan = match ?? currentPlan;
    return { id: currentPlan._id ?? null, billing: billingOf(plan), plan };
  }, [currentPlan, pricingPlans]);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setSelectedPlan(plan);
  };

  /* ----------------------------- UI ------------------------------ */

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-semibold">Loading plans...</h1>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-500">
            Error loading plans
          </h1>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Candidate Price List
        </h1>
        <p className="text-md text-gray-600">
          Please view our refunds policy in our Terms and Conditions, or ask our
          Chatbot about refunds.
        </p>
      </div>

      {current && current.plan.title && (
        <div className="mx-auto container max-w-[600px] mb-8 w-full rounded-lg border border-[#2B7FD0] p-4 text-center">
          You&apos;re currently on our{" "}
          <strong style={{ color: current.plan.titleColor ?? "#2B7FD0" }}>
            {toDisplayName(current.plan.title)}
          </strong>
          {current.billing !== "free" && ` (${BILLING_LABEL[current.billing]})`}.
        </div>
      )}

      <div className="flex items-center justify-center">
        <div className="grid w-full max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => {
            const billing = billingOf(plan);
            const isCurrent = current?.id === plan._id;
            // Buying a shorter plan would replace a longer one the candidate
            // already holds, so only same-or-higher billing tiers are offered.
            const isIncluded =
              !isCurrent &&
              !!current &&
              BILLING_ORDER[billing] <= BILLING_ORDER[current.billing];
            const titleColor = plan.titleColor ?? "#2B7FD0";

            return (
              <Card
                key={plan._id}
                className="flex flex-col justify-between shadow-lg border-none rounded-xl overflow-hidden"
              >
                <CardHeader className="p-6 pb-0">
                  <CardTitle
                    className="flex flex-wrap items-center gap-2 text-base font-medium"
                    style={{ color: titleColor }}
                  >
                    {toDisplayName(plan.title)}
                    {billing !== "free" && (
                      <span className="rounded-full border border-current px-2 py-0.5 text-xs font-normal">
                        {BILLING_LABEL[billing]}
                      </span>
                    )}
                    {isCurrent && (
                      <span
                        className="rounded-full px-2 py-1 text-xs font-normal"
                        style={{
                          backgroundColor: `${titleColor}33`, // hex + 20% alpha
                          color: titleColor,
                        }}
                      >
                        Current
                      </span>
                    )}
                  </CardTitle>

                  <p className="mt-2 flex items-baseline gap-1 text-[#282828]">
                    {billing === "free" ? (
                      <span className="text-3xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">
                          ${plan.price.toFixed(2)}
                        </span>
                        <span className="text-base text-[#8593A3]">
                          / {BILLING_PERIOD[billing]}
                        </span>
                      </>
                    )}
                  </p>
                </CardHeader>

                <CardContent className="p-6 pt-4 flex-grow">
                  <h3 className="font-medium text-base text-[#8593A3] mb-3">
                    What you will get
                  </h3>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[#2B7FD0]">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-base text-[#343434] font-medium">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button
                    className="h-[58px] w-full rounded-[80px] text-lg font-semibold border-2 border-[#2B7FD0] bg-transparent text-[#2B7FD0] hover:bg-[#2B7FD0] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    variant="outline"
                    onClick={() => handlePlanSelect(plan)}
                    disabled={
                      isCurrent ||
                      isIncluded ||
                      status === "loading" ||
                      (billing === "free" && status === "authenticated")
                    }
                  >
                    {isCurrent
                      ? "Current Plan"
                      : isIncluded
                      ? "Included in your plan"
                      : billing === "free"
                      ? "Get started"
                      : `Subscribe ${BILLING_LABEL[billing].toLowerCase()}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      <PaymentMethodModal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        price={(selectedPlan?.price ?? 0).toFixed(2)}
        planId={selectedPlan?._id ?? ""}
      />
    </div>
  );
}
