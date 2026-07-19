"use client";

import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import JobCard from "@/components/shared/card/job-card";
import { Pagination } from "@/components/shared/pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchJobs } from "@/lib/search-api";
import JobSearchBar from "./job-search-bar";
import ActiveFilterChips from "./active-filter-chips";

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
  applicantCount?: number;
  counter?: number;
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
    exactMatches?: Job[];
    partialMatches?: Job[];
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

interface JobFitSummary {
  score: number;
  verdictCode: string;
  verdictMessage: string;
  aiSummary?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  jobSkills?: string[];
  profileSkills?: string[];
}

export default function JobsListing() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL is the single source of truth (`title` kept as legacy inbound alias)
  const querySearchTerm =
    searchParams.get("q") || searchParams.get("title") || "";
  const category = searchParams.get("category") || "";
  const locationType = searchParams.get("locationType") || "";
  const employmentType = searchParams.get("employmentType") || "";
  const location = searchParams.get("location") || "";
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);

  const hasActiveFilters = Boolean(
    querySearchTerm || category || locationType || employmentType || location
  );

  const { data: session, status } = useSession();
  const token = session?.accessToken;

  // Fetch all jobs
  const {
    data: jobsData,
    isLoading: isJobsLoading,
    isError: isJobsError,
    refetch: refetchJobs,
  } = useQuery<JobsResponse, Error>({
    queryKey: [
      "jobs",
      { q: querySearchTerm, category, locationType, employmentType, location, page: currentPage },
    ],
    queryFn: ({ signal }) =>
      fetchJobs(
        {
          q: querySearchTerm,
          category,
          locationType,
          employmentType,
          location,
          page: currentPage,
        },
        signal
      ) as Promise<JobsResponse>,
    placeholderData: keepPreviousData,
  });

  // Fetch recommended jobs
  const { data: recommendedData, isLoading: isRecommendedLoading } = useQuery<
    RecommendedJobsResponse,
    Error
  >({
    queryKey: ["recommendedJobs", token],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/jobs/recommend`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch recommended jobs");
      return response.json();
    },
    enabled: !!token,
  });

  const jobs = jobsData?.data.jobs || [];
  const meta = jobsData?.data.meta || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  const recommended =
    recommendedData?.data?.exactMatches && recommendedData.data.exactMatches.length > 0
      ? recommendedData.data.exactMatches
      : recommendedData?.data?.partialMatches || [];

  const recommendedJobs = useMemo(() => {
    if (!Array.isArray(recommended)) return [];
    return recommended
      .map((item: any) => (item?.job ? item.job : item))
      .filter((job: Job | undefined): job is Job => Boolean(job && job._id));
  }, [recommended]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading session...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {/* Search + Filters */}
      <div className="bg-primary/5 border border-primary/10 p-6 mb-8 w-full rounded-lg">
        <JobSearchBar />
        <ActiveFilterChips />
      </div>

      {!hasActiveFilters && recommendedJobs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Suggested jobs for you</h2>
          {isRecommendedLoading || !token ? (
            <div className="text-center text-gray-600">
              {!token ? (
                "Please log in to see suggested jobs."
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
              {recommendedJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  variant="list"
                  applicantCount={job.applicantCount ?? job.counter}
                />
              ))}
            </div>
          )}
        </div>
      )}


      {/* All Jobs */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          {hasActiveFilters ? "Search results" : "Recent jobs"}
        </h2>

        {isJobsError ? (
          <div className="text-center py-10">
            <p className="text-gray-600 mb-4">
              Something went wrong while loading jobs. Please try again.
            </p>
            <Button variant="outline" onClick={() => refetchJobs()}>
              Retry
            </Button>
          </div>
        ) : isJobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <JobCardSkeleton key={index} />
              ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-gray-600 py-10">
            {hasActiveFilters
              ? "No results found. Try a different search or remove some filters."
              : "No jobs available at the moment."}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                variant="list"
                applicantCount={job.applicantCount ?? job.counter}
              />
            ))}
          </div>
        )}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4">
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages}
              onPageChange={(page) => {
                const currentParams = new URLSearchParams(searchParams.toString());
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
