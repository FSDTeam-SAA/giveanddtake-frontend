// app/checkout/paypal/page.tsx
"use client";

import { useState, Suspense } from "react";
import Script from "next/script";
import PayPalCheckoutClient from "./_components/paypal.client";

export default function Page() {
  const [sdkReady, setSdkReady] = useState(false);

  return (
    <>
      {/* Load the PayPal JS SDK on the page */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={(e) => console.error("Failed to load PayPal SDK", e)}
      />

      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <svg className="h-12 w-12 animate-spin" viewBox="0 0 24 24" />
          </div>
        }
      >
        <PayPalCheckoutClient sdkReady={sdkReady} />
      </Suspense>
    </>
  );
}
