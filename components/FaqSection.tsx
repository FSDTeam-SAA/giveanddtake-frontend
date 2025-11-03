"use client"

import React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useQuery } from "@tanstack/react-query"

// Type definition for each FAQ item
export interface FaqItem {
  _id: string
  question: string
  answer: string
  category?: string
  order?: number
}

// Fetch function
const fetchFaqs = async (): Promise<FaqItem[]> => {
  const res = await fetch("http://localhost:5001/api/v1/faqs")
  if (!res.ok) throw new Error("Failed to fetch FAQs")
  const json = await res.json()
  return json.data
}

// Component
export function FaqSection() {
  const {
    data: faqs,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["faqs"],
    queryFn: fetchFaqs,
  })

  if (isLoading) {
    return <div className="container py-10 text-center">Loading FAQs…</div>
  }

  if (isError) {
    return (
      <div className="container py-10 text-center text-red-600">
        Error loading FAQs: {(error as Error).message}
      </div>
    )
  }

  if (!faqs || faqs.length === 0) {
    return (
      <div className="container py-10 text-center text-gray-500">
        No FAQs available.
      </div>
    )
  }

  return (
    <div className="container py-8 lg:py-12">
      <Accordion
        type="single"
        collapsible
        className="w-full space-y-2"
      >
        {faqs.map((item) => (
          <AccordionItem
            key={item._id}
            value={item._id}
            className="border-b-0 rounded-lg overflow-hidden shadow-[0px_11.22px_33.67px_0px_#0000000D] bg-[#F3F6FF]"
          >
            <AccordionTrigger className="px-6 py-4 text-left text-xl text-[#131313] font-semibold transition-colors duration-200">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-[18px] text-[#606267] leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
