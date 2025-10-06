"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "@/components/company/video-player";
import { fetchCompanyDetails } from "@/lib/api-service";
import { MapPin, Users, Calendar, Building2 } from "lucide-react";
import Image from "next/image";
import JobCard from "@/components/shared/card/job-card";
import { useMemo, useState } from "react";
import JobDetails from "@/app/(website)/alljobs/_components/job-details";
import CandidateSharePopover from "@/app/(website)/candidates-profile/_components/candidateShare";
import SocialLinks from "@/app/(website)/elevator-pitch-resume/_components/SocialLinks";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Honor {
  id: string;
  _id?: string;
  title: string;
  issuer: string;
  programeDate: string;
  programeName: string;
  description: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

// ------- helpers -------
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const fetchCompanyJobs = async (companyId: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/all-jobs/company/${companyId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch company jobs");
  }

  return res.json(); // { success, message, data: Job[] }
};

// Response shape for /user/single
interface SingleUserFollowingItem {
  email: string;
  name: string;
  _id: string;
}
interface SingleUserResponse {
  data?: { following?: Array<SingleUserFollowingItem | null> };
}

export default function CompanyProfilePage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const myId = session?.user?.id as string | undefined;

  const queryClient = useQueryClient();

  // ---- single user (source of truth for "already following") ----
  const { data: singleUser } = useQuery<SingleUserResponse, Error>({
    queryKey: ["single-user"],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/user/single`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    enabled: !!token,
    retry: 1,
  });

  // NEW: pagination state (6 per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 6;

  const params = useParams();
  const userId = params.userId as string;

  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["company", userId],
    queryFn: () => fetchCompanyDetails(userId),
    enabled: !!userId,
  });

  const { data: jobs = { data: [] as any[] }, isLoading: isLoadingJobs } =
    useQuery({
      queryKey: ["company-jobs", companyData?.companies[0]?._id],
      queryFn: () => fetchCompanyJobs(companyData?.companies[0]?._id),
      enabled: !!companyData?.companies[0]?._id,
    });

  // ---- derive IDs for follow API ----
  // Assumption based on backend used in Recruiters.tsx:
  //   recruiterId = the profile owner's userId
  //   companyId    = the company object's _id (or its userId if your API expects that)
  const company = companyData?.companies?.[0];
  const targetRecruiterId = company?.userId as string | undefined; // owner user id (entity to follow)
  const targetCompanyId = company?._id as string | undefined; // company object id

  // ---- follow count/status (backup) ----
  const { data: followInfo, isLoading: followInfoLoading } = useQuery({
    queryKey: ["follow", "count", targetRecruiterId],
    queryFn: async () => {
      const raw = await fetchJSON<any>(
        `${BASE_URL}/following/count?recruiterId=${targetRecruiterId}`
      );
      const parsed = raw?.data && typeof raw.data === "object" ? raw.data : raw;
      const count =
        typeof parsed?.count === "number"
          ? parsed.count
          : typeof parsed === "number"
          ? parsed
          : 0;
      const isFollowing =
        typeof parsed?.isFollowing === "boolean"
          ? parsed.isFollowing
          : undefined;
      return { count, isFollowing } as { count: number; isFollowing?: boolean };
    },
    enabled: Boolean(targetRecruiterId),
    staleTime: 15_000,
  });

  // Determine following from singleUser list (source of truth)
  const followingIds = useMemo(
    () =>
      singleUser?.data?.following
        ?.filter(Boolean)
        .map((u) => (u as SingleUserFollowingItem)._id) ?? [],
    [singleUser?.data?.following]
  );
  const isFollowing = targetRecruiterId
    ? followingIds.includes(targetRecruiterId)
    : false;

  const canFollow = useMemo(() => {
    if (!myId || !targetRecruiterId) return false;
    return myId !== targetRecruiterId;
  }, [myId, targetRecruiterId]);

  // ---- Mutation: toggle follow ----
  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (!myId || !targetRecruiterId || !targetCompanyId) {
        throw new Error("Missing IDs for follow action");
      }
      const nextIsFollowing = !isFollowing; // true => /follow, false => /unfollow
      const url = `${BASE_URL}/following/${
        nextIsFollowing ? "follow" : "unfollow"
      }`;
      const method = nextIsFollowing ? "POST" : "DELETE";
      const payload = {
        userId: myId,
        recruiterId: targetRecruiterId,
        companyId: targetCompanyId,
      };
      return fetchJSON<any>(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["follow", "count", targetRecruiterId],
      });
      const prev = queryClient.getQueryData<{
        count: number;
        isFollowing?: boolean;
      }>(["follow", "count", targetRecruiterId]);
      const optimisticNext = !isFollowing;
      const nextCount =
        (prev?.count ?? followInfo?.count ?? 0) + (optimisticNext ? 1 : -1);
      queryClient.setQueryData(["follow", "count", targetRecruiterId], {
        count: Math.max(0, nextCount),
        isFollowing: optimisticNext,
      });
      return { prev } as const;
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(
          ["follow", "count", targetRecruiterId],
          ctx.prev
        );
      const msg =
        typeof err?.message === "string" ? err.message : "Follow action failed";
      if (/Already following/i.test(msg)) {
        queryClient.invalidateQueries({ queryKey: ["single-user"] });
        queryClient.invalidateQueries({
          queryKey: ["follow", "count", targetRecruiterId],
        });
        toast.info("You're already following.");
        return;
      }
      if (/Not following/i.test(msg) || /already unfollowed/i.test(msg)) {
        queryClient.invalidateQueries({ queryKey: ["single-user"] });
        queryClient.invalidateQueries({
          queryKey: ["follow", "count", targetRecruiterId],
        });
        toast.info("You were not following.");
        return;
      }
      toast.error(msg || "Something went wrong");
    },
    onSuccess: (_data, _vars, _ctx) => {
      toast.success(
        isFollowing ? "You've unfollowed." : "You're now following."
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["single-user"] });
      queryClient.invalidateQueries({
        queryKey: ["follow", "count", targetRecruiterId],
      });
    },
  });

  // ---------- jobs derivations ----------
  const approvedJobs = useMemo(() => {
    return (jobs?.data ?? []).filter((j: any) => j?.adminApprove === true);
  }, [jobs]);

  const totalPages = Math.max(1, Math.ceil(approvedJobs.length / PAGE_SIZE));
  const visibleJobs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return approvedJobs.slice(start, start + PAGE_SIZE);
  }, [approvedJobs, currentPage]);

  if (currentPage > totalPages) {
    setTimeout(() => setCurrentPage(1), 0);
  }

  // ---------- loading/empty ----------
  if (isLoadingCompany) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!companyData?.companies?.[0]) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Company not found
      </div>
    );
  }

  const honors = companyData.honors || [];

  const parseLinks = (linkString?: string): string[] => {
    if (!linkString) return [];
    try {
      const parsed = JSON.parse(linkString);
      return Array.isArray(parsed) ? parsed : [linkString];
    } catch (error) {
      return [linkString];
    }
  };

  const parseServices = (serviceString?: string): string[] => {
    if (!serviceString) return [];
    try {
      const parsed = JSON.parse(serviceString);
      return Array.isArray(parsed) ? parsed : [serviceString];
    } catch (error) {
      return [serviceString];
    }
  };

  const links = parseLinks(company.links?.[0]);
  const services = parseServices(company.service?.[0]);

  if (selectedJobId) {
    return <JobDetails jobId={selectedJobId} />;
  }

  console.log(followInfo?.count, "followInfo");
  const followersCount = followInfo?.count ?? 0;
  const followBusy = toggleFollowMutation.isPending;
  const disabled =
    !myId ||
    !targetRecruiterId ||
    !targetCompanyId ||
    followBusy ||
    followInfoLoading ||
    !canFollow;

  return (
    <div className="lg:container lg:mx-auto lg:px-6">
      {/* Banner */}
      <div className="w-full h-[150px] md:h-[300px] rounded-b-lg">
        {company.banner ? (
          <Image
            src={company.banner}
            alt={`${company.cname} banner`}
            width={1200}
            height={200}
            className=" w-full h-[150px] md:h-[300px] object-cover object-center"
          />
        ) : (
          <div className=" w-full h-[150px] md:h-[300px] bg-gray-200" />
        )}
      </div>

      <div className="container mx-auto">
        {/* Header Section */}
        <div className="md:px-6 lg:pl-10 mt-[-30px]">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
            <div className="col-span-3">
              <div className="w-[120px] h-[120px] md:h-[170px] md:w-[170px] flex-shrink-0">
                <Image
                  src={
                    company.clogo && company.clogo.trim() !== ""
                      ? company.clogo
                      : "/placeholder.svg"
                  }
                  alt={company.cname}
                  width={170}
                  height={170}
                  className="w-[120px] h-[120px] md:h-[170px] md:w-[170px] object-cover rounded"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2 text-gray-900">
                  {company.cname}
                </h1>
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {company.city}, {company.country}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {company.employeesId?.length || 0} employees
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  {company.industry}
                </div>
                <div className="flex gap-4">
                  <div>
                    <SocialLinks sLink={company.sLink} />
                  </div>
                </div>
                <div className="mt-4">
                  {/* Follow / Unfollow with count */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => toggleFollowMutation.mutate()}
                      disabled={disabled}
                      className={`${
                        isFollowing
                          ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                          : "bg-blue-600 hover:bg-blue-700"
                      } transition-colors`}
                      aria-label={isFollowing ? "Unfollow" : "Follow"}
                      title={!myId ? "Sign in to follow" : undefined}
                    >
                      {followBusy
                        ? "Please wait…"
                        : isFollowing
                        ? "Unfollow"
                        : "Follow"}
                    </Button>

                    {(followInfo?.count ?? 0) > 0 && (
                      <span className="text-sm text-gray-600">
                        {followersCount} follower
                        {followersCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-7 lg:mt-[60px]">
              <div className="flex items-center justify-between border-b-2 pb-2">
                <h3 className="font-semibold text-gray-800 mb-3 text-2xl">
                  About
                </h3>
                {userId ? (
                  <CandidateSharePopover
                    userId={userId}
                    role="companies-profile"
                    title={`${company.firstName} ${company.lastName} — ${
                      company.title ?? "Candidate"
                    }`}
                    summary={
                      company.aboutUs
                        ? company.aboutUs.replace(/<[^>]*>/g, "").slice(0, 180)
                        : ""
                    }
                  />
                ) : null}
              </div>

              <div>
                <p
                  className="text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: company.aboutUs || "No description provided",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Jobs */}
        <div className="my-12">
          {approvedJobs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-6 text-gray-900">
                Company Jobs
              </h2>

              {isLoadingJobs ? (
                <div className="text-center py-10">Loading jobs...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {visibleJobs.map((job: any) => (
                      <JobCard key={job._id} job={job} variant="list" />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Prev
                      </Button>

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        const isActive = pageNum === currentPage;
                        return (
                          <Button
                            key={pageNum}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Elevator Pitch */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">
            Elevator Pitch
          </h2>
          <div className="rounded-lg md:p-6 bg-gray-50">
            <VideoPlayer
              pitchId={companyData?.companies[0]?.elevatorPitch?._id}
              className="w-full mx-auto"
            />
          </div>
        </div>

        {/* About Us */}
        <div className="space-y-12 pb-24 pt-8  mx-auto">
          {/* Awards and Honors */}
          {honors.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Awards and Honors
              </h2>
              <div className="space-y-4">
                {honors.map((honor: Honor) => (
                  <Card key={honor._id}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900">
                        {honor.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {honor.programeName || honor.issuer}
                      </p>
                      <p className="text-sm text-gray-500 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        {new Date(honor.programeDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700">
                        {honor.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
