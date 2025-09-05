"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: { url: string };
}

interface resumeId {
  _id: string;
}

interface Application {
  _id: string;
  jobId: string;
  resumeId?: resumeId;
  userId: User;
  status: "pending" | "shortlisted" | "interviewed" | "selected" | "rejected";
  createdAt: string;
  updatedAt: string;
  experience?: string; // Added for dynamic experience
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
  const [statusLoading, setStatusLoading] = useState<string[]>([]); // Track loading state for status updates
  const [selectedApplicationId, setSelectedApplicationId] = useState(
    "689b0fc1167718bb391da85d"
  ); // Updated to use specific _id instead of generic jobId

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

  const handleStatusUpdate = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/applied-jobs/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        const allowedStatuses: Application["status"][] = [
          "selected",
          "shortlisted",
          "rejected",
          "pending",
          "interviewed",
        ];
        if (allowedStatuses.includes(newStatus as Application["status"])) {
          setApplications(
            applications.map((app) =>
              app._id === applicationId
                ? { ...app, status: newStatus as Application["status"] }
                : app
            )
          );
        } else {
          console.error(`Invalid status: ${newStatus}`);
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
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
          Please help all applicants by updating each candidate at every stage
          of the recruitment process. To update applicants, click on the correct
          button, which will trigger a response to the applicant.
        </p>
      </div>

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
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : applications.length > 0 ? (
              applications.map((application) => (
                <TableRow
                  key={application._id}
                  className={`text-base text-[#000000] font-medium ${
                    application._id === selectedApplicationId
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                  onClick={() => setSelectedApplicationId(application._id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={application.userId.avatar.url} />
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
                  <TableCell>
                    {application.experience || "N/A"} {/* Dynamic experience */}
                  </TableCell>
                  <TableCell>{formatDate(application.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-4 flex-wrap items-center">
                      <Link
                        href={`/applicant-details/${
                          application.userId._id
                        }?resumeId=${
                          application.resumeId?._id || ""
                        }&applicationId=${application._id}`}
                        className="text-sm bg-[#2B7FD0] text-white py-2 px-4 rounded-lg font-medium"
                      >
                        Applicant Details
                      </Link>

                      <Select
                        value={application.status}
                        onValueChange={(value: string) =>
                          handleStatusUpdate(application._id, value)
                        }
                        disabled={statusLoading.includes(application._id)}
                      >
                        <SelectTrigger className="w-40 border text-blue-600 border-blue-600">
                          <SelectValue placeholder="Change Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Application Received",
                            "shortlisted",
                            "unsuccessful",
                          ].map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium">No applications found</p>
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
            {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)} of{" "}
            {meta.totalItems} results
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
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
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
              })}
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
        <Link href="/recruiter-dashboard">
          <Button className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white">
            Return To Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
