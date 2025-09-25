"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, DollarSign } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";

interface Recruiter {
  _id: string;
  userId: string;
  firstName: string;
  sureName: string;
  photo?: string;
  emailAddress?: string;
}

interface CompanyData {
  _id: string;
  userId: string;
  clogo?: string;
  cname?: string;
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
  recruiterId?: Recruiter;
  benefits: string[];
  vacancy: number;
  employement_Type?: string;
  experience: string;
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
  _id?: string;
  userId?: string;
  jobId: string | { _id: string; [key: string]: any };
  bookmarked: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  const token = (session as any)?.accessToken as string | undefined;
  const queryClient = useQueryClient();

  const role = session?.user.role as string | undefined;
  const isUnauthed = sessionStatus === "unauthenticated";
  const isCandidate = role === "candidate";
  const isRecruiterOrCompany = role === "recruiter" || role === "company";
  const canSeeApply = isUnauthed || isCandidate;

  const TOAST_DURATION_MS = 2200;
  const REDIRECT_DELAY_MS = 1800;
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const {
    data: jobData,
    isLoading,
    error,
  } = useQuery<JobDetailsResponse>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      if (!jobId || jobId === "undefined") throw new Error("Invalid job ID");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${jobId}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch job details");
      return data as JobDetailsResponse;
    },
    enabled: Boolean(jobId && jobId !== "undefined"),
  });

  const { data: bookmarkData, isLoading: isBookmarkLoading } =
    useQuery<BookmarkResponse>({
      queryKey: ["bookmark", jobId, userId],
      queryFn: async () => {
        if (!userId || !token) {
          return {
            success: false,
            message: "User not authenticated",
            data: { bookmarks: [], meta: {} },
          } as BookmarkResponse;
        }
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/bookmarks/user/${userId}` as string,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch bookmark status"
          );
        }
        return (await response.json()) as BookmarkResponse;
      },
      enabled: Boolean(userId && token && jobId && jobId !== "undefined"),
    });

  const bookmarked = bookmarkData?.data?.bookmarks?.[0]?.bookmarked ?? false;

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
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ jobId, userId, bookmarked: !bookmarked }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to ${bookmarked ? "unsave" : "save"} job`
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(`Job ${bookmarked ? "unsaved" : "saved"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["bookmark", jobId, userId] });
      queryClient.invalidateQueries({ queryKey: ["saved-jobs", userId] });
    },
    onError: (e) => toast.error((e as Error).message),
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
    if (!jobData?.data?._id) return;
    toggleBookmarkMutation.mutate({
      jobId: jobData.data._id,
      userId,
      bookmarked: bookmarked ?? false,
    });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8" aria-busy>
        <div className="animate-pulse">
          <div className="mb-6">
            <div className="h-10 w-32 bg-gray-200 rounded mb-4" />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-gray-200 rounded" />
                <div className="h-10 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-6 lg:gap-8">
            <div className="lg:col-span-6 space-y-6 lg:space-y-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
                <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                <div className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
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
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div className="text-center max-w-md">
          <div className="text-base sm:text-lg text-red-600 mb-4">
            {error instanceof Error
              ? error.message
              : "Error loading job details"}
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!jobData?.data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div className="text-base sm:text-lg text-gray-600">
          No job data found
        </div>
      </div>
    );
  }

  const job = jobData.data;
  const applicationLink = `/job-application?id=${job._id}`;

  // Determine postedBy data
  let postedByName = "Unknown";
  let postedByLogo = "/default-logo.png";
  let postedById = "#";
  let postedByType = "company";
  let postedByData = null;

  if (job.recruiterId) {
    postedByName = `${job.recruiterId.firstName} ${job.recruiterId.sureName}`;
    postedByLogo = job.recruiterId.photo || "/default-logo.png";
    postedById = job.recruiterId.userId || "#";
    postedByType = "recruiter";
    postedByData = { recruiterId: job.recruiterId };
  } else if (job.companyId) {
    postedByName = job.companyId.cname || "Unknown Company";
    postedByLogo = job.companyId.clogo || "/default-logo.png";
    postedById = job.companyId.userId || "#";
    postedByType = "company";
    postedByData = { companyId: job.companyId };
  }

  // Log the appropriate data
  console.log(postedByData);

  const handleUnauthedApply = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isRedirecting) return;
    setIsRedirecting(true);

    toast("Please log in as a candidate to apply", {
      description: "You’ll now be redirected to sign in.",
      duration: TOAST_DURATION_MS,
    });

    setTimeout(() => {
      void signIn(undefined, { callbackUrl: applicationLink });
    }, REDIRECT_DELAY_MS);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top actions */}
      <div className="mb-4 sm:mb-6">
        <Button asChild variant="ghost" className="mb-2 sm:mb-0">
          <Link
            href="/alljobs"
            onClick={onBack}
            className="inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to jobs
          </Link>
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-9 gap-6 lg:gap-8">
        {/* Left / Main column */}
        <div className="lg:col-span-6">
          <section className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4">
              <div className="flex items-center gap-4 sm:gap-6">
                <Link
                  href={`/${postedByType === "recruiter" ? "recruiters-profile" : "companies-profile"}/${postedById}`}
                  aria-label={postedByType === "recruiter" ? "Recruiter profile" : "Company profile"}
                >
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden ring-1 ring-gray-200">
                    <Image
                      src={postedByLogo}
                      alt={postedByType === "recruiter" ? "Recruiter Photo" : "Company Logo"}
                      fill
                      sizes="(max-width: 640px) 56px, 64px"
                      className="object-cover"
                      priority
                    />
                  </div>
                </Link>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight line-clamp-2 break-words">
                    {job.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:text-base">
                    <Link
                      href={`/${postedByType === "recruiter" ? "recruiters-profile" : "companies-profile"}/${postedById}`}
                      className="font-medium truncate max-w-[16rem] sm:max-w-none"
                    >
                      {postedByName}
                    </Link>
                    <span className="flex items-center text-[#707070]">
                      <MapPin className="h-4 w-4 mr-1 text-[#2042E3]" />{" "}
                      {job.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2">
                <div className="flex items-center text-[#707070] text-sm sm:text-base font-medium">
                  {job.salaryRange}
                </div>
                <div className="inline-flex items-center bg-[#E9ECFC] px-3 py-1 rounded-lg capitalize text-sm">
                  {job.employement_Type || "Not specified"}
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: job.description
                      ? DOMPurify.sanitize(job.description)
                      : "",
                  }}
                />
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Right / Side column */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <Card className="sticky top-2 sm:top-4 z-10">
            <div className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={handleToggleBookmark}
                  disabled={
                    toggleBookmarkMutation.isPending ||
                    sessionStatus === "loading" ||
                    isBookmarkLoading ||
                    !userId
                  }
                  className="w-full bg-transparent"
                >
                  {toggleBookmarkMutation.isPending
                    ? bookmarked
                      ? "Unsaving..."
                      : "Saving..."
                    : bookmarked
                    ? "Unsave Job"
                    : "Save Job"}
                </Button>

                {canSeeApply && !isRecruiterOrCompany ? (
                  isUnauthed ? (
                    <Button
                      className="w-full bg-primary hover:bg-blue-700"
                      onClick={handleUnauthedApply}
                      disabled={isRedirecting}
                    >
                      {isRedirecting ? "Redirecting..." : "Apply Now"}
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-primary hover:bg-blue-700"
                    >
                      <Link href={`/job-application?id=${job._id}`}>
                        Apply Now
                      </Link>
                    </Button>
                  )
                ) : null}
              </div>
            </div>
          </Card>

          <div className="space-y-4 sm:space-y-6">
            {!!job.responsibilities?.length && (
              <Card>
                <CardHeader>
                  <CardTitle>Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.responsibilities.map((responsibility, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        <span className="text-gray-700">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {!!job.educationExperience?.length && (
              <Card>
                <CardHeader>
                  <CardTitle>Education &amp; Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.educationExperience.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-green-600" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {!!job.benefits?.length && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-purple-600" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Job Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm sm:text-base">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-medium">{job.experience.charAt(0).toUpperCase() + job.experience.slice(1)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm sm:text-base">
                  <span className="text-gray-600">Positions</span>
                  <span className="font-medium">{job.vacancy}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm sm:text-base">
                  <span className="text-gray-600">Compensation</span>
                  <span className="font-medium">{job.compensation}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm sm:text-base">
                  <span className="text-gray-600">Application Deadline</span>
                  <span className="font-medium">
                    {formatDate(job.deadline)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm sm:text-base">
                  <span className="text-gray-600">Status</span>
                  <Badge
                    variant={job.status === "active" ? "default" : "secondary"}
                  >
                    {job.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {!!job.applicationRequirement?.length && (
              <Card>
                <CardHeader>
                  <CardTitle>Application Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.applicationRequirement.map((req) => (
                      <li key={req._id} className="flex items-start">
                        <span className="mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-red-600" />
                        <span className="text-gray-700">{req.requirement}</span>
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