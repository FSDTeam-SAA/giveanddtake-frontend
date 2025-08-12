"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight} from "lucide-react";
import Link from "next/link";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface resumeId {
  _id: string;
}

interface Application {
  _id: string;
  jobId: string;
  resumeId: resumeId;
  userId: User;
  status: "pending" | "shortlisted" | "interviewed" | "selected" | "rejected";
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Application[];
  meta?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const statusConfig = {
  pending: { label: "Applicant Details", color: "bg-blue-500" },
  shortlisted: { label: "Under Consideration", color: "bg-green-500" },
  interviewed: { label: "With Hiring Manager ", color: "bg-yellow-500" },
  selected: { label: "Get Selected", color: "bg-emerald-500" },
  rejected: { label: "Not Selected", color: "bg-red-500" },
};

export default function JobApplicantsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = params.id as string;
  const currentPage = Number.parseInt(searchParams.get("page") || "1");

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  useEffect(() => {
    fetchApplications();
  }, [jobId, currentPage]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/applied-jobs/job/${jobId}?page=${currentPage}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const result: ApiResponse = await response.json();

      if (result.success) {
        setApplications(result.data);
        if (result.meta) {
          setMeta(result.meta);
        }
      } else {
        throw new Error(result.message || "Failed to fetch applications");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button onClick={fetchApplications}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Applicant List</h1>
        <p className="text-gray-600 mt-2">
          Please view the job applications journey for our members by updating
          each candidate correctly at every stage of the recruitment process. To
          update applicants, click on the relevant button on each applicant row.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Applications ({meta.totalItems})</span>
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500">
                Page {meta.currentPage} of {meta.totalPages}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Name
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Experience
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Applied
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-6 w-28" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : applications.length > 0 ? (
                  applications.map((application) => (
                    <TableRow
                      key={application._id}
                      className="text-base text-[#000000] font-medium"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-gray-200 text-gray-700">
                              {getInitials(application.userId.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {application.userId.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {application.userId.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>5 Years</TableCell>
                      <TableCell>{formatDate(application.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Link href={`/applicant-details/${application.userId._id}?resumeId=${application.resumeId?._id || ""}`}>
                            <Badge
                              className={`${statusConfig.pending.color} text-white hover:${statusConfig.pending.color}/80`}
                            >
                              {statusConfig.pending.label}
                            </Badge>
                          </Link>
                          <Badge
                            className={`${statusConfig.shortlisted.color} text-white hover:${statusConfig.shortlisted.color}/80`}
                          >
                            {statusConfig.shortlisted.label}
                          </Badge>
                          <Badge
                            className={`${statusConfig.interviewed.color} text-white hover:${statusConfig.interviewed.color}/80`}
                          >
                            {statusConfig.interviewed.label}
                          </Badge>
                          <Badge
                            className={`${
                              application.status === "selected"
                                ? statusConfig.selected.color
                                : statusConfig.rejected.color
                            } text-white hover:opacity-80`}
                          >
                            {application.status === "selected"
                              ? statusConfig.selected.label
                              : statusConfig.rejected.label}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="text-gray-500">
                        <p className="text-lg font-medium">
                          No applications found
                        </p>
                        <p className="text-sm">
                          This job hasn't received any applications yet.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {(meta.currentPage - 1) * meta.itemsPerPage + 1} to{" "}
                {Math.min(
                  meta.currentPage * meta.itemsPerPage,
                  meta.totalItems
                )}{" "}
                of {meta.totalItems} results
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.currentPage - 1)}
                  disabled={meta.currentPage <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {Array.from(
                    { length: Math.min(5, meta.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === meta.currentPage ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.currentPage + 1)}
                  disabled={meta.currentPage >= meta.totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white">
              Export Candidates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
