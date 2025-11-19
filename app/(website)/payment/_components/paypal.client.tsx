// app/checkout/paypal/_components/paypal.client.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeaders from "@/components/shared/PageHeaders";
import Image from "next/image";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style: {
          layout: string;
          color: string;
          shape: string;
          label: string;
        };
        createOrder: () => string;
        onApprove: () => Promise<void>;
        onError: (err: unknown) => void;
      }) => {
        render: (element: HTMLDivElement | null) => void;
      };
    };
  }
}

interface CaptureOrderRequest {
  orderId: string;
  userId: string;
  planId: string;
}

export default function PayPalCheckoutClient() {
  const paypalRef = useRef<HTMLDivElement | null>(null);
  const isRendered = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sdkLoading, setSdkLoading] = useState(true);

  const orderId = searchParams.get("orderId") || "";
  const userId = searchParams.get("userId") || "";
  const amount = searchParams.get("amount") || "0.00";
  const planId = searchParams.get("planId") || "";

  useEffect(() => {
    if (!orderId || !paypalRef.current || isRendered.current) return;

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      console.error("Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID");
      setSdkLoading(false);
      return;
    }

    const scriptUrl = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;

    const renderButtons = () => {
      if (!window.paypal || !paypalRef.current || isRendered.current) return;

      isRendered.current = true;
      setSdkLoading(false);

      window.paypal
        ?.Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
          },
          createOrder: () => orderId,
          onApprove: async () => {
            try {
              const requestData: CaptureOrderRequest = {
                orderId,
                userId,
                planId,
              };

              const response = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/payments/paypal/capture-order`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(requestData),
                }
              );

              if (!response.ok) {
                throw new Error("Failed to capture PayPal order");
              }

              router.push("/success");
            } catch (err) {
              console.error("PayPal Capture Error:", err);
            }
          },
          onError: (err: unknown) => {
            console.error("PayPal Checkout Error:", err);
          },
        })
        .render(paypalRef.current);
    };

    if (window.paypal) {
      renderButtons();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptUrl}"]`
    );

    if (script) {
      const handleLoad = () => renderButtons();
      script.addEventListener("load", handleLoad);
      return () => script?.removeEventListener("load", handleLoad);
    }

    script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => renderButtons();
    script.onerror = (e) => {
      console.error("Failed to load PayPal SDK", e);
      setSdkLoading(false);
    };
    document.body.appendChild(script);
  }, [orderId, userId, planId, router]);

  return (
    <div className="container mx-auto p-4">
      <PageHeaders
        title="Payment"
        description="Complete your secure payment using our trusted payment methods."
      />

      <div className="flex flex-col md:flex-row justify-between gap-8">
        {/* Summary column: left on desktop, bottom on mobile */}
        <div className="w-full md:w-1/2 order-2 md:order-1">
          <h2 className="text-2xl font-bold mb-4">Summary</h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Payment Details:</h3>
            <ul className="list-disc list-inside text-gray-600">
              <li>Plan ID: {planId || "—"}</li>
              <li>Charges include Applicable VAT/GST and/or Sales Taxes</li>
            </ul>
          </div>

          <div className="border-t border-gray-300 pt-4 mb-6 flex justify-between items-center">
            <span className="text-xl font-bold">Total Amount:</span>
            <span className="text-xl font-bold text-blue-600">${amount}</span>
          </div>

          <div className="border-t border-gray-300 pt-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">
              Safe &amp; secure payment
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your payment information is processed securely. We do not store
              your credit card details.
            </p>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <Image
              src="/assets/visa.png"
              alt="Visa card"
              width={80}
              height={40}
            />
            <Image
              src="/assets/paypal.png"
              alt="PayPal logo"
              width={100}
              height={100}
            />
            <Image
              src="/assets/master.png"
              alt="Mastercard"
              width={80}
              height={40}
            />
          </div>
        </div>

        {/* PayPal column: right on desktop, top on mobile */}
        <div className="w-full md:w-1/2 order-1 md:order-2">
          <h2 className="text-2xl font-bold mb-4">Pay with PayPal</h2>
          <div
            ref={paypalRef}
            style={{ minHeight: 150 }}
            className="w-full flex items-center justify-center"
          >
            {sdkLoading && (
              <p className="text-sm text-gray-500">
                Loading secure PayPal checkout…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
