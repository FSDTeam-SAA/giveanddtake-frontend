"use client"

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeaders from "@/components/shared/PageHeaders";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface PayPalCheckoutProps {
  planId: string;
}

declare global {
  interface Window {
    paypal: {
      Buttons: (options: {
        style: {
          layout: string;
          color: string;
          shape: string;
          label: string;
        };
        createOrder: (data: unknown, actions: unknown) => string;
        onApprove: (data: unknown) => Promise<void>;
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

const PayPalCheckoutContent = () => {
  const paypalRef = useRef<HTMLDivElement | null>(null);
  const isRendered = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get('orderId') || '';
  const userId = searchParams.get('userId') || '';
  const amount = searchParams.get('amount') || '0.00';
  const planId = searchParams.get('planId') || '';

  useEffect(() => {
    if (!window.paypal || !paypalRef.current || isRendered.current || !orderId) return;
    isRendered.current = true;

    window.paypal
      .Buttons({
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
              planId
            };

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL}/payments/paypal/capture-order`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
              }
            );

            if (!response.ok) {
              throw new Error("Failed to capture PayPal order");
            }

            await response.json();
            router.push("/success");
          } catch (error) {
            console.error("PayPal Capture Error:", error);
            // Handle error appropriately
          }
        },
        onError: (err: unknown) => {
          console.error("PayPal Checkout Error:", err);
          // Handle error appropriately
        },
      })
      .render(paypalRef.current);
  }, [orderId, userId, planId, router]);

  return (
    <div className="container mx-auto p-4">
      <PageHeaders title="Payment" description="Complete your secure payment using our trusted payment methods." />
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">Summary</h2>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Payment Details:</h3>
            <ul className="list-disc list-inside text-gray-600">
              <li>Plan ID: {planId}</li>
              <li>Charges include Applicable VAT/GST and/or Sales Taxes</li>
            </ul>
          </div>
          <div className="border-t border-gray-300 pt-4 mb-6 flex justify-between items-center">
            <span className="text-xl font-bold">Total Amount:</span>
            <span className="text-xl font-bold text-blue-600">${amount}</span>
          </div>
          <div className="border-t border-gray-300 pt-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">Safe & secure payment</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your payment information is processed securely. We do not store your credit card details.
            </p>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative ">
              <Image src="/assets/visa.png" alt="Visa card" width={80} height={40} className="" />
            </div>
            <div className="relative ">
              <Image src="/assets/paypal.png" alt="PayPal logo" width={100} height={100} className="" />
            </div>
            <div className="relative ">
              <Image src="/assets/master.png" alt="Mastercard" width={80} height={40} className="" />
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2" ref={paypalRef} style={{ height: '600px', overflowY: 'auto' }} />
      </div>
    </div>
  );
};

const PayPalCheckout = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin" />
    </div>}>
      <PayPalCheckoutContent />
    </Suspense>
  );
};

export default PayPalCheckout;