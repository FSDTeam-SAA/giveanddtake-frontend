import { JobCard } from "./job-card"
import { Button } from "@/components/ui/button"

export function RecentJobsSection() {
  const jobs = [
    {
      companyLogo: "/placeholder.svg?height=48&width=48",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
    {
      companyLogo: "/placeholder.svg?height=48&width=48",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
    {
      companyLogo: "/placeholder.svg?height=48&width=48",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
    {
      companyLogo: "/placeholder.svg?height=48&width=48",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
    {
      companyLogo: "/placeholder.svg?height=48&width=48",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
    {
      companyLogo: "/placeholder.svg?height=48&width=48",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Recent jobs</h2>
        <div className="grid gap-6 md:grid-cols-2 mt-12">
          {jobs.map((job, index) => (
            <JobCard key={index} {...job} />
          ))}
        </div>
        <Button className="mt-12 bg-v0-blue-500 hover:bg-v0-blue-600 text-white px-8 py-3">View all</Button>
      </div>
    </section>
  )
}
