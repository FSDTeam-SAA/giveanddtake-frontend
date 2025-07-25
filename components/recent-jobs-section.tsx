import { JobCard } from "./job-card"
import { Button } from "@/components/ui/button"

export function RecentJobsSection() {
  const jobs = [
    {
      companyLogo: "/assets/Layer_2_1_.png",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
    {
         companyLogo: "/assets/Layer_2_1_.png",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
    {
         companyLogo: "/assets/Layer_2_1_.png",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
    {
         companyLogo: "/assets/Layer_2_1_.png",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
    {
         companyLogo: "/assets/Layer_2_1_.png",
      jobTitle: "Software Engineer",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus laoreet vel maecenas in. Aliquet aliquet a diam mi luctus quis m",
      companyWebsite: "Winbrans.com",
      salaryRange: "$20k - $25k",
      location: "New Work",
    },
    {
         companyLogo: "/assets/Layer_2_1_.png",
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
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px]">Recent jobs</h2>
         <div className="w-[196px] h-[6px] bg-[#2B7FD0] rounded-[35px] mx-auto mt-4"></div>
        <div className="grid gap-6 md:grid-cols-2 mt-12">
          {jobs.map((job, index) => (
            <JobCard key={index} {...job} />
          ))}
        </div>
        <Button className="mt-12 bg-[#2B7FD0] hover:bg-[#2B7FD0]/80 text-white px-8 py-3">View all</Button>
      </div>
    </section>
  )
}
