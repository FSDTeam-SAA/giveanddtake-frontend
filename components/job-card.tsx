import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"

interface JobCardProps {
  companyLogo: string
  jobTitle: string
  description: string
  companyWebsite: string
  salaryRange: string
  location: string
}

export function JobCard({ companyLogo, jobTitle, description, companyWebsite, salaryRange, location }: JobCardProps) {
  return (
    <Card className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow rounded-xl !border-none w-full">
      <Image
        src={companyLogo || "/placeholder.svg?height=48&width=48&query=blue swirl logo"}
        alt="Company Logo"
        width={100}
        height={100}
        className="rounded-full mr-0 sm:mr-4 mb-4 sm:mb-0 w-12 h-12 sm:w-[50px] sm:h-[50px]"
      />
      <div className="flex-1 grid gap-2 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-base sm:text-lg md:text-[18px] font-semibold text-[#595959]">{jobTitle}</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-v0-blue-500 text-v0-blue-500 hover:bg-v0-blue-50 bg-transparent h-8 sm:h-[35px] text-sm sm:text-base"
            >
              Apply
            </Button>
            <Badge className="bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/80 h-8 sm:h-[35px] text-sm sm:text-base px-3 sm:px-4 rounded-[8px]">
              Full Time
            </Badge>
          </div>
        </div>
        <p className="text-[#707070] text-xs sm:text-sm font-normal line-clamp-2 text-left">{description}</p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm mt-4 sm:mt-6">
          <Badge className="bg-[#E9ECFC] h-8 sm:h-[35px] text-[#707070] text-xs sm:text-base rounded-[8px] px-3 sm:px-4 hover:bg-[#E9ECFC] cursor-pointer">
            {companyWebsite}
          </Badge>
          <Badge className="bg-[#E9ECFC] h-8 sm:h-[35px] text-[#84A6B7] text-xs sm:text-base rounded-[8px] px-3 sm:px-4 hover:bg-[#E9ECFC] cursor-pointer">
            {salaryRange}
          </Badge>
          <div className="flex items-center gap-1 bg-[#E9ECFC] h-8 sm:h-[35px] text-[#84A6B7] text-xs sm:text-base rounded-[8px] px-3 sm:px-4 cursor-pointer">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}