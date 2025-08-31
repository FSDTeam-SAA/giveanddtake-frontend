"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, DollarSign } from "lucide-react";
import JobMap from "./job-map";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import Link from "next/link";
import Image from "next/image";

interface CompanyData {
  clogo?: string;
  cname?: string;
  userId: string;
}

interface JobDetailsData {
  _id: string;
  userId: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  responsibilities: string[];
  educationExperience: string[];
  companyId?: CompanyData;
  benefits: string[];
  vacancy: number;
  employement_Type?: string;
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

interface JobDetailsResponse {
  success: boolean;
  message: string;
  data: JobDetailsData;
}

interface Bookmark {
  jobId: string;
  bookmarked: boolean;
}

interface BookmarkResponse {
  success: boolean;
  message: string;
  data: {
    bookmarks: Bookmark[];
    meta: Record<string, any>;
  };
}

interface JobDetailsProps {
  jobId: string;
  onBack?: () => void;
}

export default function JobDetails({ jobId, onBack }: JobDetailsProps) {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  // Fetch job details
  const {
    data: jobData,
    isLoading,
    error,
  } = useQuery<JobDetailsResponse>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      if (!jobId || jobId === "undefined") {
        throw new Error("Invalid job ID");
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${jobId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch job details");
      }
      return data;
    },
    enabled: !!jobId && jobId !== "undefined",
  });

  // Fetch bookmark status
  const { data: bookmarkData, isLoading: isBookmarkLoading } = useQuery<BookmarkResponse>({
    queryKey: ["bookmark", jobId, userId],
    queryFn: async () => {
      if (!userId || !token) {
        return { success: false, message: "User not authenticated", data: { bookmarks: [], meta: {} } };
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/bookmarks/user/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch bookmark status");
      }
      return response.json();
    },
    enabled: !!userId && !!token && !!jobId && jobId !== "undefined",
  });

  // Determine if the current job is bookmarked
  const bookmarked = bookmarkData?.data?.bookmarks?.some(
    (bookmark: Bookmark) => bookmark.jobId === jobId && bookmark.bookmarked
  ) ?? false;

  console.log("Bookmark status for job", jobId, ":", { bookmarked });

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async ({
      jobId,
      userId,
      bookmarked,
    }: {
      jobId: string;
      userId: string;
      bookmarked: boolean;
    }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/bookmarks/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId, userId, bookmarked: !bookmarked }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${bookmarked ? "unsave" : "save"} job`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(`Job ${bookmarked ? "unsaved" : "saved"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["bookmark", jobId, userId] });
      queryClient.invalidateQueries({ queryKey: ["saved-jobs", userId] });
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });

  const handleToggleBookmark = () => {
    if (sessionStatus === "loading") {
      toast.loading("Checking authentication...");
      return;
    }
    if (!userId) {
      toast.error("Please log in to save this job.");
      return;
    }
    toggleBookmarkMutation.mutate({
      jobId: jobData?.data._id!,
      userId,
      bookmarked,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4">
        <div className="animate-pulse">
          <div className="mb-6">
            <div className="h-10 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="flex items-start justify-between">
              <div>
                <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-gray-200 rounded"></div>
                <div className="h-10 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">
            {error instanceof Error
              ? error.message
              : "Error loading job details"}
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!jobData?.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">No job data found</div>
      </div>
    );
  }

  const job = jobData.data;

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <Link href="/alljobs">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to jobs
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-9 gap-8">
        <div className="col-span-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <div>
                  <Link href={`/companies-profile/${job.companyId?.userId}`}>
                    {job.companyId ? (
                      <Image
                        src={job.companyId.clogo || "/default-logo.png"}
                        alt={job.companyId.cname || "Company Logo"}
                        width={100}
                        height={100}
                        className="w-16 h-16 object-cover rounded-full"
                      />
                    ) : (
                      <Image
                        src="/default-logo.png"
                        alt="Company Logo"
                        width={100}
                        height={100}
                        className="w-16 h-16 object-cover rounded-full"
                      />
                    )}
                  </Link>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                  <div className="flex items-center gap-4 mb-4">
                    {job.companyId ? (
                      <Link
                        href={`/companies-profile/${job.companyId.userId}`}
                        className="text-[16px] font-medium"
                      >
                        {job.companyId.cname || "Unknown Company"}
                      </Link>
                    ) : (
                      <span className="text-[16px] font-medium">
                        Unknown Company
                      </span>
                    )}
                    <div className="flex items-center text-[#707070] text-[16px] font-medium">
                      <MapPin className="h-4 w-4 mr-1 text-[#2042E3]" />
                      {job.location}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-[#707070] text-[16px] font-medium">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {job.salaryRange}
                </div>
                <div className="flex items-center bg-[#E9ECFC] p-2 rounded-lg capitalize">
                  {job.employement_Type || "Not Specified"}
                </div>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(job.description),
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="col-span-3">
          <Card className="mb-4">
            <div className="flex gap-3 p-4">
              <Button
                variant="outline"
                onClick={handleToggleBookmark}
                disabled={
                  toggleBookmarkMutation.isPending ||
                  sessionStatus === "loading" ||
                  isBookmarkLoading ||
                  !userId
                }
              >
                {toggleBookmarkMutation.isPending
                  ? bookmarked
                    ? "Unsaving..."
                    : "Saving..."
                  : bookmarked
                  ? "Unsave Job"
                  : "Save Job"}
              </Button>
              <Link href={`/job-application?id=${job._id}`}>
                <Button className="bg-primary hover:bg-blue-700">
                  Apply Now
                </Button>
              </Link>
            </div>
          </Card>
          <div className="lg:col-span-2 space-y-8">
            {job.responsibilities && job.responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {job.educationExperience && job.educationExperience.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Education & Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.educationExperience.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {job.benefits && job.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-medium">{job.experience}+ years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Positions</span>
                  <span className="font-medium">{job.vacancy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Compensation</span>
                  <span className="font-medium">{job.compensation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Application Deadline</span>
                  <span className="font-medium">
                    {formatDate(job.deadline)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge
                    variant={job.status === "active" ? "default" : "secondary"}
                  >
                    {job.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            {/* <Card>
              <CardHeader>
                <CardTitle>Job Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="font-medium">{job.location}</span>
                  </div>
                </div>
                <JobMap location={job.location} />
              </CardContent>
            </Card> */}
            {job.applicationRequirement &&
              job.applicationRequirement.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Application Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {job.applicationRequirement.map((req) => (
                        <li key={req._id} className="flex items-start">
                          <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700">
                            {req.requirement}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}