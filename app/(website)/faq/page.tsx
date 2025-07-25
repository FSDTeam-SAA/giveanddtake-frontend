
import { FaqSection } from "@/components/FaqSection";
import PageHeaders from "@/components/shared/PageHeaders";
import { faqData } from "@/lib/faq-data";


export default function FaqPage() {
  return (
    <div className=" bg-gray-50 flex flex-col items-center py-12">
      <main className="flex-1 w-full">
        <PageHeaders title="Frequently Asked Questions" description="Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development."/>
        <FaqSection data={faqData} />
      </main>
    </div>
  )
}
