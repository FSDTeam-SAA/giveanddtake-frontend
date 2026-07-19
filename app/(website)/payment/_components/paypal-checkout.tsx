"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style: {
          layout: string;
          color: string;
          shape: string;
          label: string;
          height?: number;
        };
        createOrder: () => string | Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (err: unknown) => void;
        onCancel?: () => void;
      }) => {
        render: (element: HTMLDivElement | null) => Promise<void> | void;
        close?: () => void;
      };
    };
    paypalSdkPromise?: Promise<Window["paypal"] | undefined>;
  }
}

interface PayPalCheckoutProps {
  userId: string;
  planId: string;
  amount: string;
  onSuccess?: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const buildSdkUrl = (clientId: string) =>
  `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;

const removeStalePaypalScripts = () => {
  document
    .querySelectorAll<HTMLScriptElement>('script[src*="paypal.com/sdk/js"]')
    .forEach((script) => {
      if (script.dataset.paypalSdk !== "true") {
        script.remove();
      }
    });
};

const loadPaypalSdk = (clientId: string) => {
  if (!clientId) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID"));
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }

  if (window.paypal) {
    return Promise.resolve(window.paypal);
  }

  const scriptUrl = buildSdkUrl(clientId);

  if (!window.paypalSdkPromise) {
    removeStalePaypalScripts();
    window.paypalSdkPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-paypal-sdk="true"]'
      );

      if (existingScript) {
        if (window.paypal) {
          resolve(window.paypal);
          return;
        }

        existingScript.addEventListener("load", () => resolve(window.paypal));
        existingScript.addEventListener("error", () =>
          reject(new Error("Failed to load PayPal SDK"))
        );
        return;
      }

      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.dataset.paypalSdk = "true";
      script.onload = () => resolve(window.paypal);
      script.onerror = (err) => {
        console.error("Failed to load PayPal SDK", err);
        window.paypalSdkPromise = undefined;
        reject(new Error("Failed to load PayPal SDK"));
      };
      document.body.appendChild(script);
    });
  }

  return window.paypalSdkPromise;
};

export default function PayPalCheckout({
  userId,
  planId,
  amount,
  onSuccess,
}: PayPalCheckoutProps) {
  const paypalRef = useRef<HTMLDivElement | null>(null);
  const isRendered = useRef(false);
  const router = useRouter();

  const [sdkLoading, setSdkLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  const handleSuccess = useCallback(() => {
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push("/success");
  }, [onSuccess, router]);

  useEffect(() => {
    let isActive = true;
    type PayPalButtons = ReturnType<NonNullable<Window["paypal"]>["Buttons"]>;
    let buttonsInstance: PayPalButtons | null = null;

    if (!clientId) {
      setErrorMessage(
        "PayPal is not configured. Please choose card payment or contact support."
      );
      setSdkLoading(false);
      return;
    }

    if (!userId || !planId) {
      setErrorMessage("Missing plan or user details. Please reselect your plan.");
      setSdkLoading(false);
      return;
    }

    const renderButtons = async () => {
      if (!paypalRef.current || isRendered.current) {
        setSdkLoading(false);
        return;
      }

      setSdkLoading(true);

      try {
        const paypalSdk = await loadPaypalSdk(clientId);
        if (
          !isActive ||
          !paypalRef.current ||
          !paypalSdk ||
          isRendered.current
        ) {
          setSdkLoading(false);
          return;
        }

        isRendered.current = true;
        setSdkLoading(false);

        buttonsInstance = paypalSdk.Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
            height: 48,
          },

          // A fresh order is created server-side on every attempt.
          createOrder: async () => {
            setErrorMessage(null);
            const res = await fetch(
              `${BASE_URL}/payments/paypal/create-order`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, planId, userId }),
              }
            );

            if (!res.ok) {
              throw new Error("Failed to create PayPal order");
            }

            const data = await res.json();
            return data.orderId || data.data?.orderId;
          },

          onApprove: async (data) => {
            setIsCapturing(true);
            try {
              const response = await fetch(
                `${BASE_URL}/payments/paypal/capture-order`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: data.orderID,
                    userId,
                    planId,
                  }),
                }
              );

              if (!response.ok) {
                throw new Error("Failed to capture PayPal order");
              }

              handleSuccess();
            } catch (err) {
              console.error("PayPal capture error:", err);
              setIsCapturing(false);
              setErrorMessage(
                "We couldn't finalise your PayPal payment. If you were charged, please contact support before retrying."
              );
            }
          },

          onCancel: () => {
            setErrorMessage("Payment cancelled. You have not been charged.");
          },

          onError: (err: unknown) => {
            console.error("PayPal checkout error:", err);
            setErrorMessage(
              "PayPal ran into a problem. Please try again or pay by card."
            );
          },
        });

        await buttonsInstance.render(paypalRef.current);
      } catch (err) {
        console.error("PayPal SDK load error:", err);
        if (!isActive) return;
        setSdkLoading(false);
        setErrorMessage(
          "Could not load PayPal. Check your connection and try again."
        );
      }
    };

    renderButtons();

    // Retry once if the SDK hangs (network hiccup).
    const retryTimer = window.setTimeout(() => {
      if (!isRendered.current) {
        window.paypalSdkPromise = undefined;
        renderButtons();
      }
    }, 8000);

    return () => {
      isActive = false;
      window.clearTimeout(retryTimer);
      try {
        buttonsInstance?.close?.();
      } catch {
        // The SDK throws if the container is already gone — safe to ignore.
      }
      isRendered.current = false;
    };
  }, [amount, planId, userId, clientId, handleSuccess, reloadKey]);

  if (isCapturing) {
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

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div ref={paypalRef} className="min-h-[150px] w-full">
        {sdkLoading && (
          <div className="space-y-3" aria-busy="true">
            <div className="h-12 w-full animate-pulse rounded-md bg-gray-100" />
            <div className="h-12 w-full animate-pulse rounded-md bg-gray-100" />
            <p className="text-center text-xs text-gray-500">
              Loading secure PayPal checkout…
            </p>
          </div>
        )}
      </div>

      {errorMessage && !sdkLoading && (
        <Button
          variant="outline"
          onClick={() => {
            setErrorMessage(null);
            isRendered.current = false;
            setReloadKey((key) => key + 1);
          }}
          className="w-full gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reload PayPal
        </Button>
      )}

      <p className="text-center text-xs text-gray-500">
        You&apos;ll confirm the payment in a secure PayPal window.
      </p>
    </div>
  );
}
