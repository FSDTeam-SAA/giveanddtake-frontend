// app/checkout/paypal/page.tsx
"use client";

import { useState } from "react";
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
        onLoad={() => {
          // SDK fully loaded
          setSdkReady(true);
        }}
        onError={(e) => {
          console.error("Failed to load PayPal SDK", e);
        }}
      />

      {/* Pass sdkReady down so buttons only render when SDK is loaded */}
      <PayPalCheckoutClient sdkReady={sdkReady} />
    </>
  );
}
