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
  CreditCard,
  Lock,
  ShieldCheck,
} from "lucide-react";
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
            Complete your upgrade with your card or PayPal account.
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
                    aria-selected={method === "card"}
                    onClick={() => setMethod("card")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition sm:flex-row sm:gap-3 sm:p-4",
                      method === "card"
                        ? "border-[#2B7FD0] bg-[#2B7FD0]/5 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <CreditCard
                      className={cn(
                        "h-5 w-5 shrink-0",
                        method === "card" ? "text-[#2B7FD0]" : "text-gray-400"
                      )}
                    />
                    <div className="text-center sm:text-left">
                      <span
                        className={cn(
                          "block text-sm font-semibold",
                          method === "card"
                            ? "text-[#2B7FD0]"
                            : "text-[#282828]"
                        )}
                      >
                        Card
                      </span>
                      <span className="hidden text-xs text-[#8593A3] sm:block">
                        Visa, Mastercard, Amex
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={method === "paypal"}
                    onClick={() => setMethod("paypal")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition sm:flex-row sm:gap-3 sm:p-4",
                      method === "paypal"
                        ? "border-[#2B7FD0] bg-[#2B7FD0]/5 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <Image
                      src="/assets/paypal.png"
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 shrink-0 object-contain"
                    />
                    <div className="text-center sm:text-left">
                      <span
                        className={cn(
                          "block text-sm font-semibold",
                          method === "paypal"
                            ? "text-[#2B7FD0]"
                            : "text-[#282828]"
                        )}
                      >
                        PayPal
                      </span>
                      <span className="hidden text-xs text-[#8593A3] sm:block">
                        Pay with your balance
                      </span>
                    </div>
                  </button>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6">
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
                    <Image
                      src="/assets/paypal.png"
                      alt="PayPal"
                      width={60}
                      height={30}
                      className="h-7 w-auto object-contain"
                    />
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
