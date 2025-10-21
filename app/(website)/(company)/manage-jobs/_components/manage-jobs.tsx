"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

// Types based on your API response
interface Company {
  _id: string;
  userId: string;
  clogo: string;
  banner: string;
  aboutUs: string;
  cname: string;
  country: string;
  city: string;
  zipcode: string;
  cemail: string;
  sLink: Array<{
    label: string;
    url: string;
    _id: string;
  }>;
  industry: string;
  service: string[];
  employeesId: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApplicationRequirement {
  requirement: string;
  status: string;
  _id: string;
}

interface CustomQuestion {
  question: string;
  _id: string;
}

interface Job {
  _id: string;
  userId: string;
  companyId: Company;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  vacancy: number;
  applicantCount: number;
  experience: string;
  derivedStatus: string;
  deadline: string;
  status: string;
  jobCategoryId: string;
  name: string;
  role: string;
  compensation: string;
  arcrivedJob: boolean;
  applicationRequirement: ApplicationRequirement[];
  customQuestion: CustomQuestion[];
  jobApprove: string;
  adminApprove: boolean;
  publishDate: string;
  employement_Type: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Job[];
}

interface ManagePageProps {
  userId: string;
}

// Fetch function
const fetchJobs = async (userId: string): Promise<Job[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/all-jobs-for-company/company/${userId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }

  const data: ApiResponse = await response.json();
  return data.data;
};

// Skeleton loader component
const JobTableSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-32" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function ManagePage({ userId }: ManagePageProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const {
    data: jobs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["jobs", userId],
    queryFn: () => fetchJobs(userId),
    enabled: !!userId, // Only run query if userId exists
  });

  // Pagination calculations
  const totalPages = Math.ceil(jobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = jobs.slice(startIndex, startIndex + itemsPerPage);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading jobs: {(error as Error).message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Jobs</h1>
        <p className="text-muted-foreground">
          View and manage all your job postings
        </p>
      </div>

      {isLoading ? (
        <JobTableSkeleton />
      ) : (
        <div>
          <div className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-base text-[#2B7FD0] font-bold">
                      Applicants list
                    </TableHead>
                    <TableHead>Vacancy</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedJobs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No job postings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedJobs.map((job) => (
                      <TableRow key={job._id}>
                        <TableCell className="font-medium">
                          {job.title}
                        </TableCell>
                        <TableCell>{job.name}</TableCell>
                        <TableCell>{job.location}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {job.experience}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(job.deadline)}</TableCell>
                        <TableCell>{job.derivedStatus}</TableCell>
                        <TableCell>
                        <Link
                          href={`/candidate-list/${job._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View{" "}
                          <span className="text-gray-500">
                            ({job.applicantCount})
                          </span>
                        </Link>
                      </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{job.vacancy}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <Link
                              href={`/single-job/${job._id}`}
                              className="text-blue-600 hover:underline"
                            >
                              Job details
                            </Link>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, jobs.length)} of{" "}
                  {jobs.length} entries
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((prev) => Math.max(prev - 1, 1));
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          );
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagePage;
