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
    <Card className="flex items-start p-6 shadow-sm hover:shadow-md transition-shadow rounded-xl">
      <Image
        src={companyLogo || "/placeholder.svg?height=48&width=48&query=blue swirl logo"}
        alt="Company Logo"
        width={48}
        height={48}
        className="rounded-full mr-4 mt-1"
      />
      <div className="flex-1 grid gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{jobTitle}</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-v0-blue-500 text-v0-blue-500 hover:bg-v0-blue-50 bg-transparent"
            >
              Apply
            </Button>
            <Badge className="bg-v0-blue-500 text-white hover:bg-v0-blue-600 px-3 py-1 text-xs">Full Time</Badge>
          </div>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
          <Link href="#" className="text-v0-blue-500 hover:underline">
            {companyWebsite}
          </Link>
          <Badge className="bg-gray-100 text-gray-700 px-3 py-1 text-xs">{salaryRange}</Badge>
          <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-xs">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
