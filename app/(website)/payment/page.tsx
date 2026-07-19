import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CheckoutClient from "./_components/checkout-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
          <Loader2 className="h-10 w-10 animate-spin text-[#2B7FD0]" />
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
