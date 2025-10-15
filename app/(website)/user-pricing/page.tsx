"use client"

import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal"
import { useSession } from "next-auth/react"

/* ----------------------------- Types ----------------------------- */

interface SubscriptionPlan {
  _id: string
  title: string
  description: string
  price: number
  features: string[]
  for: string
  valid: "monthly" | "yearly" | string
  createdAt: string
  updatedAt: string
  __v: number
}

interface ApiResponse {
  success: boolean
  message: string
  data: SubscriptionPlan[]
}

interface Feature {
  text: string
}

type LocalPlan = {
  name: string
  monthlyPriceLabel?: string
  annualPriceLabel?: string
  monthlyAmount?: number
  annualAmount?: number
  planId: string
  monthlyPlanId?: string
  annualPlanId?: string
  features: Feature[]
  buttonText: string
}

/* --------------------------- Utilities --------------------------- */

const normalizeTitle = (t: string) => (t || "").replace(/\s+/g, " ").trim()

/* --------------------------- Data Fetch -------------------------- */

const fetchCandidatePlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const data: ApiResponse = await response.json()
  return data.data.filter((plan: SubscriptionPlan) => plan.for === "candidate")
}

const groupCandidatePlans = (plans: SubscriptionPlan[]): LocalPlan[] => {
  const map = new Map<string, { monthly?: SubscriptionPlan; yearly?: SubscriptionPlan }>()

  for (const p of plans) {
    const key = normalizeTitle(p.title)
    const bucket = map.get(key) ?? {}
    const v = (p.valid || "").toLowerCase()

    if (v === "monthly") bucket.monthly = p
    else if (v === "yearly") bucket.yearly = p
    else {
      if (/per\s*month/i.test(p.description)) bucket.monthly = p
      else if (/per\s*ann?um/i.test(p.description) || /per\s*year/i.test(p.description)) bucket.yearly = p
      else bucket.monthly = p
    }
    map.set(key, bucket)
  }

  const out: LocalPlan[] = []
  for (const [title, g] of map.entries()) {
    const base = g.monthly ?? g.yearly!
    const monthlyAmount = g.monthly?.price
    const annualAmount = g.yearly?.price

    out.push({
      name: title,
      monthlyAmount,
      annualAmount,
      monthlyPriceLabel: monthlyAmount != null ? `$${monthlyAmount.toFixed(2)} per month` : undefined,
      annualPriceLabel: annualAmount != null ? `$${annualAmount.toFixed(2)} per annum` : undefined,
      features: base.features.map((text) => ({ text })),
      buttonText: `Subscribe to ${title.toLowerCase().split(" ")[0]}`,
      planId: base._id,
      monthlyPlanId: g.monthly?._id,
      annualPlanId: g.yearly?._id,
    })
  }

  return out
}

/* -------------------------- Static Free Plan --------------------- */

const freePlan: LocalPlan = {
  name: "Free of Charge",
  monthlyPriceLabel: "$0.00 per month",
  monthlyAmount: 0,
  planId: "free-plan-static",
  features: [
    { text: "Record or upload a 30-second Elevator Video Pitch" },
    { text: "Apply for jobs where criteria is met" },
    { text: "Receive recruiter update(s)" },
  ],
  buttonText: "Get Started",
}

/* -------------------------- Component ---------------------------- */

export default function PricingList() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null)
  const [selectedPlanIdForPayment, setSelectedPlanIdForPayment] = useState<string>("")
  const [showPlanOptions, setShowPlanOptions] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<LocalPlan | null>(null)

  const session = useSession()
  
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [currentPlanMeta, setCurrentPlanMeta] = useState<{
    titleNorm: string | null
    valid: "monthly" | "yearly" | null
  }>({ titleNorm: null, valid: null })

  const isSameTitle = (planName: string) =>
    currentPlanMeta.titleNorm && normalizeTitle(planName) === currentPlanMeta.titleNorm

  const {
    data: apiPlans,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["candidatePlans"],
    queryFn: fetchCandidatePlans,
  })

  const pricingPlans = useMemo(() => {
    const apiPricingPlans = apiPlans ? groupCandidatePlans(apiPlans) : []
    return [freePlan, ...apiPricingPlans] // Prepend the free plan
  }, [apiPlans])

  /* ----------------- Plan selection / payment flow ---------------- */

  const handlePlanSelect = (plan: LocalPlan) => {
    const sameTitle = isSameTitle(plan.name)
    const onlyMonthly = plan.monthlyAmount != null && plan.annualAmount == null
    const onlyYearly = plan.annualAmount != null && plan.monthlyAmount == null
    if (sameTitle && (onlyMonthly || onlyYearly)) return

    if (currentPlanId === plan.planId) return

    setSelectedPlan(plan)

    // Special handling for free plan
    if (plan.planId === freePlan.planId) {
      // For free plan, skip payment modal since no payment is required
      setSelectedPrice("0.00")
      setSelectedPlanIdForPayment(plan.planId)
      // Optionally, trigger a different action (e.g., API call to activate free plan)
      console.log("Selected Free Plan - No payment required")
      return
    }

    if (onlyMonthly) {
      setSelectedPrice(plan.monthlyAmount!.toFixed(2))
      setSelectedPlanIdForPayment(plan.monthlyPlanId || plan.planId)
      setIsModalOpen(true)
    } else if (onlyYearly) {
      setSelectedPrice(plan.annualAmount!.toFixed(2))
      setSelectedPlanIdForPayment(plan.annualPlanId || plan.planId)
      setIsModalOpen(true)
    } else {
      setShowPlanOptions(true)
    }
  }

  const handlePaymentOptionSelect = (isMonthly: boolean) => {
    if (!selectedPlan) return
    const priceValue = isMonthly ? selectedPlan.monthlyAmount : selectedPlan.annualAmount
    const variantId = isMonthly
      ? selectedPlan.monthlyPlanId || selectedPlan.planId
      : selectedPlan.annualPlanId || selectedPlan.planId
    setSelectedPrice((priceValue ?? 0).toFixed(2))
    setSelectedPlanIdForPayment(variantId)
    setIsModalOpen(true)
    setShowPlanOptions(false)
  }

  /* ------------------ Fetch current user & plan ------------------- */

  useEffect(() => {
    const fetchUserData = async () => {
      const token = (session as any)?.accessToken
      if (status !== "authenticated" || !token) return

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/user/single`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          if (response.status === 401) console.error("Unauthorized: invalid/expired token")
          throw new Error(`GET /user/single failed with ${response.status}`)
        }

        const result = await response.json()
        const apiPlan = result?.data?.plan
        const titleNorm = apiPlan?.title ? normalizeTitle(apiPlan.title) : null

        const vRaw = (apiPlan?.valid || "").toLowerCase().replace(/\s+/g, "")
        const valid = vRaw === "monthly" ? "monthly" : vRaw === "yearly" ? "yearly" : null

        setCurrentPlanId(apiPlan?._id ?? null)
        setCurrentPlanMeta({ titleNorm, valid })
      } catch (err) {
        console.error("Error fetching user data:", err)
        setCurrentPlanId(null)
        setCurrentPlanMeta({ titleNorm: null, valid: null })
      }
    }

    fetchUserData()
  }, [session, status])

  /* ----------------------------- UI ------------------------------ */

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Loading plans...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-500">Error loading plans</h1>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    )
  }

  if (!apiPlans || apiPlans.length === 0) {
    // Still show the free plan even if API plans are empty
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Price List</h1>
          <p className="text-xl text-gray-600">For Elevator Video Pitch©</p>
        </div>

        {/* Current Plan Banner */}
        {currentPlanMeta.titleNorm && (
          <div className="mx-auto mb-8 w-full max-w-7xl rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            You're currently on <strong>{currentPlanMeta.titleNorm}</strong> plan
            {currentPlanMeta.valid && ` (${currentPlanMeta.valid})`}.
          </div>
        )}

        {/* Pricing Cards */}
        <div className="flex items-center justify-center">
          <div className="grid w-full max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              className="flex flex-col justify-between shadow-lg border-none rounded-xl overflow-hidden"
            >
              <CardHeader className="p-6 pb-0">
                <CardTitle className="text-base font-medium text-[#2B7FD0]">
                  {freePlan.name}
                  {currentPlanId === freePlan.planId && (
                    <span className="ml-2 rounded-full bg-[#2B7FD0]/20 px-2 py-1 text-xs font-normal text-[#2B7FD0]">
                      Current
                    </span>
                  )}
                </CardTitle>
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-[18px]">
                    <p className="font-bold text-[#282828]">{freePlan.monthlyPriceLabel}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-4 flex-grow">
                <h3 className="font-medium text-base text-[#8593A3] mb-3">
                  What you will get
                </h3>
                <ul className="space-y-2">
                  {freePlan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#2B7FD0]">
                        <Check className="h-5 w-5 flex-shrink-0 text-white" />
                      </div>
                      <span className="text-base text-[#343434] font-medium">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button
                  className="h-[58px] w-full rounded-[80px] text-lg font-semibold border-2 border-[#2B7FD0] bg-transparent text-[#2B7FD0] hover:bg-[#2B7FD0] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  variant="outline"
                  onClick={() => handlePlanSelect(freePlan)}
                  disabled={currentPlanId === freePlan.planId}
                >
                  {currentPlanId === freePlan.planId ? "Current Plan" : freePlan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Price List</h1>
        <p className="text-xl text-gray-600">For Elevator Video Pitch©</p>
      </div>

      {currentPlanMeta.titleNorm && (
        <div className="mx-auto mb-8 w-full max-w-7xl rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          You're currently on <strong>{currentPlanMeta.titleNorm}</strong> plan
          {currentPlanMeta.valid && ` (${currentPlanMeta.valid})`}.
        </div>
      )}

      {showPlanOptions && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold">Select Payment Option for {selectedPlan.name}</h3>
            <div className="space-y-3">
              {selectedPlan.monthlyPriceLabel && (
                <Button
                  className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => handlePaymentOptionSelect(true)}
                  disabled={!!isSameTitle(selectedPlan.name) && currentPlanMeta.valid === "monthly"}
                >
                  <div className="flex w-full items-center justify-between">
                    <span>Monthly: {selectedPlan.monthlyPriceLabel}</span>
                    {isSameTitle(selectedPlan.name) && currentPlanMeta.valid === "monthly" && (
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-[2px] text-xs">Current</span>
                    )}
                  </div>
                </Button>
              )}

              {selectedPlan.annualPriceLabel && (
                <Button
                  className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => handlePaymentOptionSelect(false)}
                  disabled={!!isSameTitle(selectedPlan.name) && currentPlanMeta.valid === "yearly"}
                >
                  <div className="flex w-full items-center justify-between">
                    <span>Annual: {selectedPlan.annualPriceLabel}</span>
                    {isSameTitle(selectedPlan.name) && currentPlanMeta.valid === "yearly" && (
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-[2px] text-xs">Current</span>
                    )}
                  </div>
                </Button>
              )}

              <Button variant="ghost" className="w-full" onClick={() => setShowPlanOptions(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center">
        <div className="grid w-full max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricingPlans.map((plan, index) => {
            const cardIsCurrentByTitle = isSameTitle(plan.name)
            const isCurrent = currentPlanId === plan.planId || cardIsCurrentByTitle

            return (
              <Card
                key={index}
                className="flex flex-col justify-between shadow-lg border-none rounded-xl overflow-hidden"
              >
                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-base font-medium text-[#2B7FD0]">
                    {plan.name}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-[#2B7FD0]/20 px-2 py-1 text-xs font-normal text-[#2B7FD0]">
                        Current
                      </span>
                    )}
                  </CardTitle>

                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-[18px] flex-wrap">
                      {plan.monthlyPriceLabel && (
                        <p className="font-bold text-[#282828]">
                          {plan.monthlyPriceLabel}
                        </p>
                      )}

                      {plan.monthlyPriceLabel && plan.annualPriceLabel && (
                        <span
                          className="text-gray-400"
                          aria-label="choose monthly or annual billing"
                        >
                          <span className="hidden sm:inline">/</span>
                          <span className="inline sm:hidden">or</span>
                        </span>
                      )}

                      {plan.annualPriceLabel && (
                        <p className="font-bold text-[#282828]">
                          {plan.annualPriceLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-4 flex-grow">
                  <h3 className="font-medium text-base text-[#8593A3] mb-3">
                    What you will get
                  </h3>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#2B7FD0]">
                          <Check className="h-5 w-5 flex-shrink-0 text-white" />
                        </div>
                        <span className="text-base text-[#343434] font-medium">
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button
                    className="h-[58px] w-full rounded-[80px] text-lg font-semibold border-2 border-[#2B7FD0] bg-transparent text-[#2B7FD0] hover:bg-[#2B7FD0] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    variant="outline"
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "Current Plan" : plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        price={selectedPrice || "0.00"}
        planId={selectedPlanIdForPayment}
      />
    </div>
  )
}