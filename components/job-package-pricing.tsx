"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal";
import { Button } from "@/components/ui/button";

type Package = { _id: string; title: string; price: number; for: string; valid: string; jobPostCredits: number | null };
const money = (amount: number) => amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
const tiers = ["Basic", "Bronze", "Silver", "Gold", "Platinum"];
const rank = (title: string) => tiers.findIndex(tier => title.includes(tier)) * 2 + (title.startsWith("Premium") ? 1 : 0);

export default function JobPackagePricing({ audience }: { audience: "company" | "recruiter" }) {
  const [selected, setSelected] = useState<Package | null>(null);
  const { status } = useSession();
  const router = useRouter();
  const { data = [], isPending, error, refetch } = useQuery<Package[]>({
    queryKey: ["job-packages", audience],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`);
      if (!response.ok) throw new Error("Unable to load job packages.");
      const result = await response.json();
      return result.data.filter((plan: Package) => plan.for === audience && plan.valid === "credits")
        .sort((a: Package, b: Package) => rank(a.title) - rank(b.title));
    },
  });

  return <main className="container mx-auto px-4 py-12 md:py-20">
    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg">
      <div className="bg-[#2B7FD0] px-6 py-8 text-white md:px-10">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider">For companies and recruiters</p>
        <h1 className="text-3xl font-bold md:text-4xl">Job post packages</h1>
        <p className="mt-3 text-blue-50">Buy once and post whenever you need. Your job post credits never expire.</p>
      </div>
      <div className="p-4 md:p-8">
        {isPending ? <p role="status">Loading packages…</p> : error ? <div role="alert"><p>{error.message}</p><Button onClick={() => refetch()}>Try again</Button></div> : data.length === 0 ? <p>Job packages are currently unavailable.</p> :
          <div className="overflow-x-auto"><table className="w-full text-left">
            <caption className="sr-only">One-time job post package prices for companies and recruiters</caption>
            <thead><tr className="border-b text-sm text-gray-500"><th className="py-3">Package</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Job posts</th><th><span className="sr-only">Purchase</span></th></tr></thead>
            <tbody>{data.map(plan => <tr key={plan._id} className="border-b last:border-0">
              <th scope="row" className="py-4 pr-3 font-medium">{plan.title}</th>
              <td className="whitespace-nowrap px-3 py-4">{money(plan.price)}</td>
              <td className="px-3 py-4">{plan.jobPostCredits === null ? "Unlimited" : plan.jobPostCredits}</td>
              <td className="py-4 text-right"><Button disabled={status === "loading"} aria-label={`Buy ${plan.title}`} onClick={() => {
                if (status !== "authenticated") { router.push(`/login?callbackUrl=/${audience}-pricing`); return; }
                setSelected(plan);
              }}>Buy</Button></td>
            </tr>)}</tbody>
          </table></div>}
        <div className="mt-6 rounded-xl bg-sky-50 p-5 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-slate-900">No expiry. No monthly or yearly posting limits.</p>
          <p className="mt-2">Refunds are available within 30 days of payment. Each job posted from the purchase is charged at $99.99. A 10% administration fee is then deducted from the remaining balance. No refund is available after 30 days or when no refundable balance remains.</p>
        </div>
      </div>
    </div>
    {selected && <PaymentMethodModal isOpen onClose={() => setSelected(null)} price={selected.price.toFixed(2)} planId={selected._id} />}
  </main>;
}
