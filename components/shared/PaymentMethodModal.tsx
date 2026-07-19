"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, CreditCard, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaymentMethod = "card" | "paypal";

interface PaymentMethodModalProps {
  isOpen: boolean;
  price: string;
  planId: string;
  onClose: () => void;
}

const METHODS: {
  id: PaymentMethod;
  title: string;
  subtitle: string;
}[] = [
  {
    id: "card",
    title: "Credit or debit card",
    subtitle: "Visa, Mastercard, Amex — powered by Stripe",
  },
  {
    id: "paypal",
    title: "PayPal",
    subtitle: "Pay with your PayPal balance or linked account",
  },
];

export function PaymentMethodModal({
  isOpen,
  onClose,
  price,
  planId,
}: PaymentMethodModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const router = useRouter();
  const { data: session } = useSession();

  const userId = (session?.user as { id?: string })?.id || "";
  const amount = Number(price);
  const amountLabel = Number.isFinite(amount) ? amount.toFixed(2) : price;

  const handleContinue = () => {
    if (!userId) {
      router.push("/login");
      return;
    }

    // The checkout page owns order/intent creation for whichever provider is
    // chosen, so this step only carries the selection across.
    const params = new URLSearchParams({
      userId,
      planId,
      amount: amountLabel,
      method,
    });

    router.push(`/payment?${params.toString()}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-5 sm:max-w-[460px] sm:p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-bold text-[#282828]">
            Choose how to pay
          </DialogTitle>
          <p className="text-sm text-[#8593A3]">
            You&apos;ll review everything before we take payment.
          </p>
        </DialogHeader>

        {/* Amount pill */}
        <div className="my-1 flex items-center justify-between rounded-xl bg-[#2B7FD0]/5 px-4 py-3">
          <span className="text-sm font-medium text-[#8593A3]">Total due</span>
          <span className="text-2xl font-bold text-[#2B7FD0]">
            ${amountLabel}
          </span>
        </div>

        {/* Method options */}
        <div
          role="radiogroup"
          aria-label="Payment method"
          className="grid gap-3 py-1"
        >
          {METHODS.map((option) => {
            const isSelected = method === option.id;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setMethod(option.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition",
                  isSelected
                    ? "border-[#2B7FD0] bg-[#2B7FD0]/5 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-gray-100">
                  {option.id === "card" ? (
                    <CreditCard
                      className={cn(
                        "h-5 w-5",
                        isSelected ? "text-[#2B7FD0]" : "text-gray-400"
                      )}
                    />
                  ) : (
                    <Image
                      src="/assets/paypal.png"
                      alt=""
                      width={22}
                      height={22}
                      className="h-5 w-5 object-contain"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isSelected ? "text-[#2B7FD0]" : "text-[#282828]"
                    )}
                  >
                    {option.title}
                  </p>
                  <p className="truncate text-xs text-[#8593A3]">
                    {option.subtitle}
                  </p>
                </div>

                {/* Radio indicator */}
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                    isSelected ? "border-[#2B7FD0]" : "border-gray-300"
                  )}
                >
                  {isSelected && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2B7FD0]" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <Button
            onClick={handleContinue}
            className="h-12 w-full rounded-lg bg-[#2B7FD0] text-base font-semibold text-white transition hover:bg-[#1E5BA8]"
          >
            Continue to checkout
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>

          <p className="flex w-full items-center justify-center gap-1.5 text-xs text-[#8593A3]">
            <Lock className="h-3 w-3" />
            Payments are encrypted and processed securely.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
