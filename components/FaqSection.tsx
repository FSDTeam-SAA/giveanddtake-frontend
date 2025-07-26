import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FaqItem } from "@/lib/faq-data"



interface FaqSectionProps {
  data: FaqItem[]
}

export function FaqSection({ data }: FaqSectionProps) {
  return (
    <div className="container  py-8 lg:py-12">
      <Accordion type="single" collapsible className="w-full">
        {data.map((item, index) => (
          <AccordionItem
            key={`faq-${index}`}
            value={`item-${index}`}
            className="mb-2 border-b-0 last:mb-0 rounded-lg overflow-hidden shadow-[0px 11.22px 33.67px 0px #0000000D] bg-[#F3F6FF]"
          >
            <AccordionTrigger className="px-6 py-4 text-left text-xl text-[#131313] font-semibold  transition-colors duration-200">
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
