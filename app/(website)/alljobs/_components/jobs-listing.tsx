"use client";

import { useState, useEffect } from "react"; // Import useEffect
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import JobDetails from "./job-details";
import JobCard from "@/components/shared/card/job-card";
import { Pagination } from "@/components/shared/pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

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
  applicationRequirement: Array<{ requirement: string; _id: string }>;
  customQuestion: Array<{ question: string; _id: string }>;
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

interface RecommendedJobsResponse {
  success: boolean;
  message: string;
  data: {
    jobs?: Job[];
    fallbackJobs?: Job[];
  };
}

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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local states for filter inputs
  const [localSearchTerm, setLocalSearchTerm] = useState(
    searchParams.get("title") || ""
  );
  const [localLocationFilter, setLocalLocationFilter] = useState(
    searchParams.get("location") || ""
  );

  // Actual query parameters derived from URL
  const querySearchTerm = searchParams.get("title") || "";
  const queryLocationFilter = searchParams.get("location") || "";
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);

  // Effect to update local state when URL search params change (e.g., from HeroSection redirect)
  useEffect(() => {
    setLocalSearchTerm(searchParams.get("title") || "");
    setLocalLocationFilter(searchParams.get("location") || "");
  }, [searchParams]);

  const { data: session, status } = useSession();
  const token = session?.accessToken;

  // Fetch all jobs
  const {
    data: jobsData,
    isLoading: isJobsLoading,
    error: jobsError,
  } = useQuery<JobsResponse, Error>({
    queryKey: ["jobs", currentPage, querySearchTerm, queryLocationFilter], // Use query params for fetching
    queryFn: async () => {
      const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/jobs`);
      url.searchParams.append("page", currentPage.toString());
      if (querySearchTerm) {
        url.searchParams.append("title", querySearchTerm);
      }
      if (queryLocationFilter) {
        url.searchParams.append("location", queryLocationFilter);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return response.json();
    },
  });

  // Fetch recommended jobs
  const {
    data: recommendedData,
    isLoading: isRecommendedLoading,
    error: recommendedError,
  } = useQuery<RecommendedJobsResponse, Error>({
    queryKey: ["recommendedJobs", token],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/recommend`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response);
      if (!response.ok) {
        throw new Error("Failed to fetch recommended jobs");
      }
      return response.json();
    },
    enabled: !!token,
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading session...
      </div>
    );
  }

  if (selectedJobId) {
    return <JobDetails jobId={selectedJobId} />;
  }

  const jobs = jobsData?.data.jobs || [];
  const meta = jobsData?.data.meta || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  const recommended = recommendedData?.data.fallbackJobs || [];

  // Function to handle filter button click
  const handleFilter = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (localSearchTerm) {
      newParams.set("title", localSearchTerm);
    } else {
      newParams.delete("title");
    }
    if (localLocationFilter) {
      newParams.set("location", localLocationFilter);
    } else {
      newParams.delete("location");
    }
    newParams.set("page", "1"); // Reset to page 1 on new filter
    router.push(`?${newParams.toString()}`);
  };

  return (
    <div className="container mx-auto px-4">
      {/* Filters */}
      <div className="bg-[#E9ECFC] p-6 mb-12 w-full rounded-md">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
          <div className="flex gap-4 w-full">
            {/* Keywords input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Keywords; Title, Skill, Location, Category"
                className="pl-10 p-2 border rounded w-full"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)} // Make editable
              />
            </div>

            {/* Location input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Location"
                className="pl-10 p-2 border rounded w-full"
                value={localLocationFilter}
                onChange={(e) => setLocalLocationFilter(e.target.value)} // Make editable
              />
            </div>
          </div>

          <button
            onClick={handleFilter} // Re-added onClick handler
            className="bg-primary hover:bg-blue-700 text-white p-2 rounded w-full md:w-auto"
          >
            Filter
          </button>
        </div>
      </div>
      {recommended.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Suggested jobs for you</h2>
          {isRecommendedLoading || !token ? (
            <div className="text-center text-gray-600">
              {!token ? (
                "Please log in to see suggested jobs"
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {Array(4)
                    .fill(0)
                    .map((_, index) => (
                      <JobCardSkeleton key={index} />
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommended.map((job) => (
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
      )}
      {/* All Jobs */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent jobs</h2>
        {isJobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <JobCardSkeleton key={index} />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
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
              onPageChange={(page) => {
                const currentParams = new URLSearchParams(
                  searchParams.toString()
                );
                currentParams.set("page", page.toString());
                router.push(`?${currentParams.toString()}`);
              }}
              isLoading={isJobsLoading}
              totalItems={meta.totalItems}
              itemsPerPage={meta.itemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
