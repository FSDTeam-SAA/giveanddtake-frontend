// app/checkout/paypal/paypal.client.tsx
"use client";

import { useEffect, useRef } from "react";
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
        createOrder: () => string; // we already have the orderId
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

  const orderId = searchParams.get("orderId") || "";
  const userId = searchParams.get("userId") || "";
  const amount = searchParams.get("amount") || "0.00";
  const planId = searchParams.get("planId") || "";

  useEffect(() => {
    // Wait for SDK + container + a valid orderId; render once
    if (!orderId || !paypalRef.current || isRendered.current) return;
    if (!window.paypal) return; // SDK not ready yet
    isRendered.current = true;

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
            if (!response.ok) throw new Error("Failed to capture PayPal order");
            // const data = await response.json();
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
  }, [orderId, userId, planId, router]);

  return (
    <div className="container mx-auto p-4">
      <PageHeaders
        title="Payment"
        description="Complete your secure payment using our trusted payment methods."
      />

      <div className="flex flex-col md:flex-row justify-between gap-8">
        {/* Left column: summary */}
        <div className="w-full md:w-1/2">
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
              Safe & secure payment
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

        {/* Right column: PayPal renders here */}
        <div
          ref={paypalRef}
          className="w-full md:w-1/2"
          style={{ minHeight: 300 }}
        />
      </div>
    </div>
  );
}
