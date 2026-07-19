"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { AlertCircle, Loader2, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripe, stripeAppearance } from "@/lib/stripe";

interface StripeCheckoutProps {
  userId: string;
  planId: string;
  /** Fallback amount used for the button label until the server confirms one. */
  amount: string;
  onSuccess?: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const confirmOnServer = async (paymentIntentId: string) => {
  const response = await fetch(`${BASE_URL}/payments/stripe/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentIntentId }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message || "We could not verify your payment. Please contact support."
    );
  }

  return data;
};

/* ------------------------------------------------------------------ */
/*                          Inner payment form                         */
/* ------------------------------------------------------------------ */

function StripePaymentForm({
  amountLabel,
  returnUrl,
  onSuccess,
}: {
  amountLabel: string;
  returnUrl: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isElementReady, setIsElementReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      // Keeps card payments on this page; only redirect-based methods
      // (and 3-D Secure challenges) leave the app.
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(
        error.message || "Something went wrong while processing your card."
      );
      setIsSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        await confirmOnServer(paymentIntent.id);
        onSuccess();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Could not finalise your payment."
        );
        setIsSubmitting(false);
      }
      return;
    }

    if (paymentIntent?.status === "processing") {
      setErrorMessage(
        "Your payment is still processing. We'll email your receipt once it clears."
      );
      setIsSubmitting(false);
      return;
    }

    setErrorMessage("The payment was not completed. Please try again.");
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        onReady={() => setIsElementReady(true)}
        options={{ layout: "tabs" }}
      />

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !isElementReady || isSubmitting}
        className="h-12 w-full rounded-lg bg-[#2B7FD0] text-base font-semibold text-white transition hover:bg-[#1E5BA8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Pay {amountLabel}
          </span>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        Secured by Stripe. Your card details never touch our servers.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*                        Outer / provider shell                       */
/* ------------------------------------------------------------------ */

export default function StripeCheckout({
  userId,
  planId,
  amount,
  onSuccess,
}: StripeCheckoutProps) {
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [serverAmount, setServerAmount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFinalisingReturn, setIsFinalisingReturn] = useState(false);
  const hasInitialised = useRef(false);

  const handleSuccess = useCallback(() => {
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push("/success");
  }, [onSuccess, router]);

  const createIntent = useCallback(async () => {
    setLoadError(null);
    setClientSecret(null);

    if (!userId || !planId) {
      setLoadError("Missing plan or user details. Please reselect your plan.");
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/payments/stripe/create-payment-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, userId }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.data?.clientSecret) {
        throw new Error(
          data?.message || "Could not start the card payment. Please try again."
        );
      }

      setClientSecret(data.data.clientSecret);
      setServerAmount(
        typeof data.data.amount === "number" ? data.data.amount : null
      );
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Could not start the card payment. Please try again."
      );
    }
  }, [planId, userId]);

  useEffect(() => {
    if (hasInitialised.current) return;
    hasInitialised.current = true;

    // Coming back from a 3-D Secure / redirect-based flow: Stripe appends the
    // intent to the return_url, so finalise instead of starting a new payment.
    const params = new URLSearchParams(window.location.search);
    const returnedIntent = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");

    if (returnedIntent) {
      if (redirectStatus === "failed") {
        setLoadError("That payment was declined. Please try another card.");
        void createIntent();
        return;
      }

      setIsFinalisingReturn(true);
      confirmOnServer(returnedIntent)
        .then(() => handleSuccess())
        .catch((err) => {
          setIsFinalisingReturn(false);
          setLoadError(
            err instanceof Error ? err.message : "Could not finalise payment."
          );
          void createIntent();
        });
      return;
    }

    void createIntent();
  }, [createIntent, handleSuccess]);

  const displayAmount = serverAmount ?? Number(amount) ?? 0;
  const amountLabel = `$${Number.isFinite(displayAmount) ? displayAmount.toFixed(2) : amount}`;

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/payment?userId=${encodeURIComponent(
          userId
        )}&planId=${encodeURIComponent(planId)}&amount=${encodeURIComponent(
          amount
        )}&method=card`
      : "";

  if (isFinalisingReturn) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B7FD0]" />
        <p className="text-sm font-medium text-gray-700">
          Confirming your payment…
        </p>
        <p className="text-xs text-gray-500">Please don&apos;t close this page.</p>
      </div>
    );
  }

  if (loadError && !clientSecret) {
    return (
      <div className="space-y-4 py-6">
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
        <Button
          variant="outline"
          onClick={() => void createIntent()}
          className="w-full gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="space-y-4 py-4" aria-busy="true">
        <div className="h-11 w-full animate-pulse rounded-lg bg-gray-100" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-gray-100" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{ clientSecret, appearance: stripeAppearance }}
    >
      <StripePaymentForm
        amountLabel={amountLabel}
        returnUrl={returnUrl}
        onSuccess={handleSuccess}
      />
    </Elements>
  );
}
