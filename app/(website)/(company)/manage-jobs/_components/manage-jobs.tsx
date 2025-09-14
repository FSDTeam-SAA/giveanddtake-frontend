"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import * as React from "react";

interface JobRequest {
  id: string;
  name: string;
  role: string;
  company?: string;
  date: string;
  jobTitle: string;
  jobDescription: string;
  avatar?: { url: string };
  adminApprove: boolean; // from API
  jobApprove?: "approved" | "rejected" | "pending";
}

type AdminFilter = "all" | "approved" | "not-approved";

async function fetchJobRequests(token: string): Promise<JobRequest[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/pending/job/company`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch job requests");
  }

  const json = await response.json();

  return (json?.data ?? []).map((item: any) => ({
    id: item._id,
    name: item?.userId?.name ?? "Unknown",
    role: item?.userId?.role ?? "Unknown",
    company: item?.userId?.company || "N/A",
    date: item?.createdAt ?? item?.publishDate ?? new Date().toISOString(),
    jobTitle: item?.title ?? "Untitled",
    jobDescription: item?.description ?? "",
    avatar: item?.userId?.avatar,
    adminApprove: Boolean(item?.adminApprove),
    jobApprove: item?.jobApprove ?? "pending",
  }));
}

function JobRequestSkeletonRow() {
  return (
    <tr className="border-b">
      <td className="p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20 mt-1" />
          </div>
        </div>
      </td>
      <td className="p-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="p-3">
        <Skeleton className="h-4 w-56" />
      </td>
      <td className="p-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="p-3">
        <Skeleton className="h-6 w-24" />
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
        </div>
      </td>
    </tr>
  );
}

export default function ManagePage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken as string;
  const router = useRouter();

  // UI state for filtering & pagination
  const [adminFilter, setAdminFilter] = React.useState<AdminFilter>("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const {
    data: allJobRequests = [],
    isLoading,
    isError,
    error,
  } = useQuery<JobRequest[]>({
    queryKey: ["jobRequests", token],
    queryFn: () => fetchJobRequests(token),
    enabled: !!token && status === "authenticated",
  });

  // Filter by adminApprove
  const filtered = React.useMemo(() => {
    switch (adminFilter) {
      case "approved":
        return allJobRequests.filter((j) => j.adminApprove === true);
      case "not-approved":
        return allJobRequests.filter((j) => j.adminApprove === false);
      default:
        return allJobRequests;
    }
  }, [allJobRequests, adminFilter]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  React.useEffect(() => {
    setPage(1); // reset page on filter/pageSize changes
  }, [adminFilter, pageSize]);

  const handleJobDetails = (id: string) => {
    router.push(`/single-job/${id}`);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Manage Job Post Requests</h1>
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Recruiter</th>
                <th className="p-3">Role</th>
                <th className="p-3">Job Title & Description</th>
                <th className="p-3">Created</th>
                <th className="p-3">Admin Approved</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <JobRequestSkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Manage Job Post Requests</h1>
        <div className="text-center py-12 text-red-500">
          Error: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Manage Job Post Requests</h1>
        <div className="text-center py-12">
          Please sign in to view job requests.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-[40px] font-bold mb-6">Manage Job Post Requests</h1>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Admin filter:</span>
          <select
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value as AdminFilter)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="not-approved">Not approved</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 w-[25%]">Recruiter</th>
              <th className="p-3 w-[35%]">Job Title & Description</th>
              <th className="p-3 w-[15%]">Created</th>
              <th className="p-3 w-[15%]">Admin Approved</th>
              <th className="p-3 w-[10%]">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paged.map((request) => (
              <tr key={request.id} className="border-b align-top">
                {/* Recruiter */}
                <td className="p-3 w-[25%]">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {request.avatar?.url ? (
                        <AvatarImage
                          src={request.avatar.url}
                          alt={request.name}
                        />
                      ) : (
                        <AvatarFallback>
                          {request?.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium line-clamp-1">
                        {request.name}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Job Title & Description */}
                <td className="p-3 w-[35%]">
                  <div className="font-medium line-clamp-1">
                    {request.jobTitle}
                  </div>
                  <div
                    className="text-xs text-muted-foreground line-clamp-1"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(request.jobDescription),
                    }}
                  />
                </td>

                {/* Created */}
                <td className="p-3 w-[15%]">
                  {format(new Date(request.date), "MMM d, yyyy")}
                </td>

                {/* Admin Approved */}
                <td className="p-3 w-[15%]">
                  {request.adminApprove ? (
                    <span className="inline-flex items-center rounded-full border border-green-600/40 text-green-700 bg-green-50 px-2 py-1 text-[11px] font-medium">
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-amber-600/40 text-amber-700 bg-amber-50 px-2 py-1 text-[11px] font-medium">
                      Not approved
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="p-3 w-[10%]">
                  <Button
                    onClick={() => handleJobDetails(request.id)}
                    variant="outline"
                    className="border-blue-600 text-blue-700 hover:bg-blue-50"
                  >
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Pagination controls with numbered page buttons */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {total === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * pageSize, total)}
          </span>{" "}
          of <span className="font-medium">{total}</span> jobs
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </Button>

          {/* numbered buttons */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              variant={n === currentPage ? "default" : "outline"}
              onClick={() => setPage(n)}
              className={n === currentPage ? "" : "hover:bg-muted/60"}
            >
              {n}
            </Button>
          ))}

          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
