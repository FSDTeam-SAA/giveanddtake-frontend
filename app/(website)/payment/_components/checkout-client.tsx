"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { FaPaypal, FaStripe } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import StripeCheckout from "./stripe-checkout";
import PayPalCheckout from "./paypal-checkout";

type PaymentMethod = "card" | "paypal";

interface SubscriptionPlan {
  _id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
  for: string;
  valid?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const fetchPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await fetch(`${BASE_URL}/subscription/plans`);
  if (!response.ok) throw new Error("Failed to load plan details");
  const data = await response.json();
  return Array.isArray(data?.data) ? data.data : [];
};

const billingLabel = (valid?: string) => {
  const normalized = (valid || "").toLowerCase();
  if (normalized === "monthly") return "Billed monthly";
  if (normalized === "yearly") return "Billed yearly";
  if (normalized === "payasyougo") return "Pay as you go";
  return null;
};

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const planId = searchParams.get("planId") || "";
  const amount = searchParams.get("amount") || "0.00";
  const methodParam = searchParams.get("method");

  // The modal passes userId through, but fall back to the session so a
  // refreshed/shared checkout URL still works for the signed-in user.
  const userId =
    searchParams.get("userId") || (session?.user as { id?: string })?.id || "";

  const [method, setMethod] = useState<PaymentMethod>(
    methodParam === "paypal" ? "paypal" : "card"
  );

  const { data: plans } = useQuery({
    queryKey: ["subscriptionPlans", "checkout"],
    queryFn: fetchPlans,
    staleTime: 5 * 60 * 1000,
  });

  const plan = useMemo(
    () => plans?.find((item) => item._id === planId),
    [plans, planId]
  );

  const displayAmount = useMemo(() => {
    const parsed = Number(plan?.price ?? amount);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [plan?.price, amount]);

  const billing = billingLabel(plan?.valid);

  const isMissingContext = !planId || !userId;

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#2B7FD0] transition hover:text-[#1E5BA8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-[#282828] sm:text-3xl">
            Secure checkout
          </h1>
          <p className="mt-1.5 text-sm text-[#8593A3] sm:text-base">
            Choose Stripe or PayPal to complete your upgrade securely.
          </p>
        </div>

        {isMissingContext ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-sm font-medium text-amber-900">
              We couldn&apos;t work out which plan you&apos;re buying.
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Please pick your plan again from the pricing page.
            </p>
            <Link
              href="/user-pricing"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#2B7FD0] px-6 text-sm font-semibold text-white transition hover:bg-[#1E5BA8]"
            >
              View plans
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start lg:gap-8">
            {/* ------------------------- Payment panel ------------------------- */}
            <div className="order-2 lg:order-1 lg:col-span-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-base font-semibold text-[#282828] sm:text-lg">
                  Payment method
                </h2>

                {/* Method selector */}
                <div
                  role="tablist"
                  aria-label="Payment method"
                  className="mt-4 grid grid-cols-2 gap-3"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-label="Pay with Stripe"
                    aria-selected={method === "card"}
                    onClick={() => setMethod("card")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition sm:flex-row sm:gap-3 sm:p-4",
                      method === "card"
                        ? "border-[#635BFF] bg-[#635BFF]/5 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-gray-100">
                      <FaStripe
                        aria-hidden="true"
                        className="h-8 w-9 text-[#635BFF]"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <span
                        className={cn(
                          "block text-sm font-semibold",
                          method === "card"
                            ? "text-[#635BFF]"
                            : "text-[#282828]"
                        )}
                      >
                        Stripe
                      </span>
                      <span className="hidden text-xs text-[#8593A3] sm:block">
                        Card, Cash App &amp; more
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-label="Pay with PayPal"
                    aria-selected={method === "paypal"}
                    onClick={() => setMethod("paypal")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition sm:flex-row sm:gap-3 sm:p-4",
                      method === "paypal"
                        ? "border-[#0070BA] bg-[#0070BA]/5 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-gray-100">
                      <FaPaypal
                        aria-hidden="true"
                        className="h-6 w-6 text-[#003087]"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <span
                        className={cn(
                          "block text-sm font-semibold",
                          method === "paypal"
                            ? "text-[#0070BA]"
                            : "text-[#282828]"
                        )}
                      >
                        PayPal
                      </span>
                      <span className="hidden text-xs text-[#8593A3] sm:block">
                        Balance or linked account
                      </span>
                    </div>
                  </button>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6">
                  <div
                    className={cn(
                      "mb-5 flex items-center gap-3 rounded-lg border px-3 py-2.5",
                      method === "card"
                        ? "border-[#635BFF]/20 bg-[#635BFF]/5"
                        : "border-[#0070BA]/20 bg-[#0070BA]/5"
                    )}
                  >
                    {method === "card" ? (
                      <FaStripe
                        aria-hidden="true"
                        className="h-8 w-9 shrink-0 text-[#635BFF]"
                      />
                    ) : (
                      <FaPaypal
                        aria-hidden="true"
                        className="h-6 w-6 shrink-0 text-[#003087]"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[#282828]">
                        {method === "card" ? "Stripe checkout" : "PayPal checkout"}
                      </p>
                      <p className="text-xs text-[#8593A3]">
                        {method === "card"
                          ? "Choose a Stripe-supported payment option below."
                          : "Pay with your PayPal balance or linked account."}
                      </p>
                    </div>
                  </div>

                  {method === "card" ? (
                    <StripeCheckout
                      userId={userId}
                      planId={planId}
                      amount={String(displayAmount)}
                    />
                  ) : (
                    <PayPalCheckout
                      userId={userId}
                      planId={planId}
                      amount={displayAmount.toFixed(2)}
                    />
                  )}
                </div>
              </div>

              {/* Trust row */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#8593A3]">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  256-bit SSL encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  PCI-DSS compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  We never store card details
                </span>
              </div>
            </div>

            {/* ------------------------- Order summary ------------------------- */}
            <div className="order-1 lg:order-2 lg:col-span-2 lg:sticky lg:top-8">
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-[#282828] sm:text-lg">
                    Order summary
                  </h2>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#282828]">
                        {plan?.title || "Subscription plan"}
                      </p>
                      {billing && (
                        <span className="mt-1.5 inline-block rounded-full bg-[#2B7FD0]/10 px-2.5 py-0.5 text-xs font-medium text-[#2B7FD0]">
                          {billing}
                        </span>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[#282828]">
                      ${displayAmount.toFixed(2)}
                    </p>
                  </div>

                  {plan?.description && (
                    <p className="text-xs leading-relaxed text-[#8593A3]">
                      {plan.description}
                    </p>
                  )}

                  <div className="border-t border-dashed border-gray-200 pt-4">
                    <div className="flex items-center justify-between text-sm text-[#8593A3]">
                      <span>Subtotal</span>
                      <span>${displayAmount.toFixed(2)}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#8593A3]">
                      Charges include applicable VAT/GST and/or sales taxes.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <span className="text-base font-bold text-[#282828]">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-[#2B7FD0]">
                      ${displayAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 bg-[#FAFBFC] p-5 sm:p-6">
                  <p className="mb-3 text-xs font-medium text-[#8593A3]">
                    We accept
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Image
                      src="/assets/visa.png"
                      alt="Visa"
                      width={48}
                      height={30}
                      className="h-7 w-auto object-contain"
                    />
                    <Image
                      src="/assets/master.png"
                      alt="Mastercard"
                      width={48}
                      height={30}
                      className="h-7 w-auto object-contain"
                    />
                    <div
                      aria-label="PayPal"
                      className="flex h-7 items-center gap-1.5 rounded border border-gray-200 bg-white px-2"
                    >
                      <FaPaypal
                        aria-hidden="true"
                        className="h-4 w-4 text-[#003087]"
                      />
                      <span className="text-xs font-semibold text-[#0070BA]">
                        PayPal
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 px-1 text-center text-xs leading-relaxed text-[#8593A3] lg:text-left">
                By completing this purchase you agree to our{" "}
                <Link
                  href="/terms-condition"
                  className="font-medium text-[#2B7FD0] hover:underline"
                >
                  Terms &amp; Conditions
                </Link>
                , including the refund policy.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
