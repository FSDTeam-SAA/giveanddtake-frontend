"use client";

import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import DOMPurify from "dompurify";

interface JobRequest {
  id: string;
  name: string;
  role: string;
  company?: string;
  date: string;
  jobTitle: string;
  jobDescription: string;
  avatar?: { url: string }; // avatar is an object
}

async function fetchJobRequests(token: string): Promise<JobRequest[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/pending/job/company`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch job requests");
  }

  const data = await response.json();
  return data.data.map((item: any) => ({
    id: item._id,
    name: item.userId.name,
    role: item.userId.role,
    company: item.userId.company || "N/A",
    date: item.createdAt,
    jobTitle: item.title,
    jobDescription: item.description,
    avatar: item.userId.avatar,
  }));
}

async function approveJobRequest(token: string, id: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobApprove: "approved", // 👈 sending in body
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to approve job request");
  }

  return response.json();
}

async function rejectJobRequest(token: string, id: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobApprove: "rejected", // 👈 send status in body
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to reject job request");
  }

  return response.json();
}


export default function ManagePage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken as string;
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: jobRequests = [],
    isLoading,
    isError,
    error,
  } = useQuery<JobRequest[]>({
    queryKey: ["jobRequests", token],
    queryFn: () => fetchJobRequests(token),
    enabled: !!token && status === "authenticated",
  });

  const handleApprove = async (id: string) => {
    try {
      await approveJobRequest(token, id);
      queryClient.invalidateQueries({ queryKey: ["jobRequests", token] });
    } catch (err) {
      console.error("Failed to approve job request:", err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectJobRequest(token, id);
      queryClient.invalidateQueries({ queryKey: ["jobRequests", token] });
    } catch (err) {
      console.error("Failed to reject job request:", err);
    }
  };

  const handleJobDetails = (id: string) => {
    router.push(`/single-job/${id}`);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Manage Job Post Requests</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <JobRequestSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Manage Job Post Requests</h1>
        <div className="text-center py-12 text-red-500">
          Error: {error.message}
          <Button
            onClick={() =>
              queryClient.refetchQueries({ queryKey: ["jobRequests", token] })
            }
            className="mt-4"
          >
            Retry
          </Button>
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
      <h1 className="text-[40px] font-bold mb-8">Manage Job Post Requests</h1>

      <div className="space-y-4">
        {jobRequests.map((request) => (
          <Card key={request.id} className="p-4 animate-fade-in">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                <div className="md:col-span-2">
                  <div className="flex gap-4 items-start">
                    <Avatar className="h-[70px] w-[70px]">
                      {request.avatar ? (
                        <AvatarImage
                          src={request.avatar.url}
                          alt={request.name}
                        />
                      ) : (
                        <AvatarFallback>
                          {request?.name?.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div>
                      <h3 className="font-semibold text-lg">{request.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {request.role}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.date), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <div className="flex flex-col gap-4">
                    <div className="mt-3">
                      <p className="text-sm">
                        <span className="font-medium">Job Title:</span>{" "}
                        {request.jobTitle}
                      </p>
                      <p
                        className="text-sm line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(request.jobDescription),
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 h-full items-start sm:items-center">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleJobDetails(request.id)}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {jobRequests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No job requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function JobRequestSkeleton() {
  return (
    <Card className="p-4 animate-fade-in">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
          <div className="md:col-span-2">
            <div className="flex gap-4 items-start">
              <Skeleton className="h-[89px] w-[89px] rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
                <Skeleton className="h-3 w-[100px]" />
                <Skeleton className="h-3 w-[70px]" />
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="space-y-2 mt-3">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="flex gap-2 h-full items-center">
              <Skeleton className="h-10 w-[80px]" />
              <Skeleton className="h-10 w-[80px]" />
              <Skeleton className="h-10 w-[80px]" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
