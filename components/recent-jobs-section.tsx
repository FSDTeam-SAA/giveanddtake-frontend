"use client"

import { Button } from "@/components/ui/button"
import JobCard from "./shared/card/job-card"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link";

interface Job {
  _id: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  vacancy: number;
  experience: number;
  compensation: string;
  createdAt: string;
}

interface JobsResponse {
  success: boolean
  message: string
  data: {
    meta: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
    jobs: Job[]
  }
}

export function RecentJobsSection() {
  // Fetch all jobs
  const {
    data: jobsData,
    isLoading: isJobsLoading,
    error: jobsError,
  } = useQuery<JobsResponse, Error>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/jobs`)
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error("Failed to fetch jobs")
      }
      return response.json()
    },
  })

  if (isJobsLoading) {
    return <div className="container px-4 md:px-6 text-center">Loading jobs...</div>
  }

  if (jobsError) {
    return <div className="container px-4 md:px-6 text-center">Error: {jobsError.message}</div>
  }

  const handleJobSelect = (jobId: string) => {
    // Handle job selection (e.g., navigate to job details)
    console.log("Selected job:", jobId)
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px]">Recent jobs</h2>
        <div className="w-[196px] h-[6px] bg-[#2B7FD0] rounded-[35px] mx-auto mt-4"></div>
        <div className="grid gap-6 md:grid-cols-2 mt-12">
          {jobsData?.data.jobs.slice(0, 8).map((job) => (
            <JobCard 
              key={job._id}
              job={job}
              onSelect={() => handleJobSelect(job._id)}
              variant="suggested" // or "list" depending on your design needs
            />
          ))}
        </div>
        <Link href="/alljobs">
          <Button className="mt-12 bg-[#2B7FD0] hover:bg-[#2B7FD0]/80 text-white px-8 py-3">View all</Button>
        </Link>
      </div>
    </section>
  )
}