"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import JobDetails from "./job-details";
import JobCard from "@/components/shared/card/job-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/pagination";

interface Job {
  _id: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  vacancy: number;
  experience: number;
  deadline: string;
  status: string;
  compensation: string;
  applicationRequirement: Array<{
    requirement: string;
    _id: string;
  }>;
  customQuestion: Array<{
    question: string;
    _id: string;
  }>;
  createdAt: string;
}

interface JobsResponse {
  success: boolean;
  message: string;
  data: {
    meta: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    jobs: Job[];
  };
}

const fetchJobs = async (page: number = 1): Promise<JobsResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/jobs?page=${page}`);
  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }
  return response.json();
};

// Skeleton Loader Component
const JobCardSkeleton = () => (
  <div className="border rounded-lg p-4">
    <Skeleton className="h-6 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export default function JobsListing() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: jobsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["jobs", currentPage],
    queryFn: () => fetchJobs(currentPage),
  });

  if (selectedJobId) {
    return <JobDetails jobId={selectedJobId} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error loading jobs</div>
      </div>
    );
  }

  const jobs = jobsData?.data.jobs || [];
  const meta = jobsData?.data.meta || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  };
  const suggestedJobs = jobs.slice(0, 4);
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation =
      locationFilter === "" ||
      job.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="container mx-auto px-4">
      {/* Search Section */}
      <div className="bg-[#E9ECFC] p-6 mb-12 w-full">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
          <div className="flex gap-4 w-full">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Keywords; Title, Skill, Location, Category"
                className="pl-10 p-2 border rounded w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Location"
                className="pl-10 p-2 border rounded w-full"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded w-full md:w-auto">
            Filter
          </button>
        </div>
      </div>

      {/* Suggested Jobs */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Suggested jobs for you</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <JobCardSkeleton key={index} />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {suggestedJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onSelect={() => setSelectedJobId(job._id)}
                variant="suggested"
              />
            ))}
          </div>
        )}
      </div>

      {/* All Jobs */}
      <div>
        <h2 className="text-2xl font-bold mb-6">All jobs</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <JobCardSkeleton key={index} />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onSelect={() => setSelectedJobId(job._id)}
                variant="list"
              />
            ))}
          </div>
        )}

        {meta.totalPages > 0 && (
          <div className="px-6 py-4">
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
              totalItems={meta.totalItems}
              itemsPerPage={meta.itemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}