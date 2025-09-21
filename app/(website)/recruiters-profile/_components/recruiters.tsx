"use client";

import type React from "react";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { Globe, Linkedin, Twitter, LinkIcon, MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VideoPlayer } from "@/components/company/video-player";
import CandidateSharePopover from "../../candidates-profile/_components/candidateShare";
import SocialLinks from "../../elevator-pitch-resume/_components/SocialLinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface SocialLink {
  label: string;
  _id: string;
  url?: string;
}

interface RecruiterCompany {
  _id: string;
  cname: string;
}

interface RecruiterData {
  _id: string;
  userId: string;
  bio: string;
  photo?: string;
  banner?: string;
  title: string;
  firstName: string;
  lastName: string;
  sureName: string;
  country: string;
  city: string;
  zipCode: string;
  emailAddress: string;
  phoneNumber: string;
  sLink: SocialLink[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  companyId: RecruiterCompany;
}

interface PitchData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  video: {
    hlsUrl: string;
    encryptionKeyUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiListResponse<T> {
  success: boolean;
  total?: number;
  data: T[];
  message?: string;
}

interface ApiObjectResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface FollowCountResponse {
  count: number;
  isFollowing?: boolean;
}

interface MydataProps {
  userId: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

// --- shared fetch helper (no token) ---
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function Recruiters({ userId }: MydataProps) {
  const { data: session } = useSession();
  const myId = session?.user?.id as string | undefined;

  const queryClient = useQueryClient();

  // ---- Queries ----

  // Recruiter profile
  const {
    data: recruiterData,
    isLoading: recruiterLoading,
    isError: recruiterIsError,
    error: recruiterError,
  } = useQuery({
    queryKey: ["recruiter", userId],
    queryFn: async () => {
      const json = await fetchJSON<ApiObjectResponse<RecruiterData>>(
        `${BASE_URL}/recruiter/recruiter-account/${userId}`
      );
      return json.data;
    },
    enabled: Boolean(userId),
  });

  const reqruterId = recruiterData?._id;
  const companyId = recruiterData?.companyId?._id;

  // Elevator pitch for current (logged-in) user, type=recruiter
  const {
    data: pitchData,
    isLoading: pitchLoading,
    isError: pitchIsError,
    error: pitchError,
  } = useQuery({
    queryKey: ["pitch", "recruiter", myId],
    queryFn: async () => {
      const json = await fetchJSON<ApiListResponse<PitchData>>(
        `${BASE_URL}/elevator-pitch/all/elevator-pitches?type=recruiter`,
        { headers: { "Content-Type": "application/json" } }
      );
      // Find the pitch for the logged-in user
      return json.data.find((p) => p.userId._id === myId) ?? null;
    },
    enabled: Boolean(myId),
  });

  // Follow count + (optional) follow status for this recruiter
  const { data: followInfo, isLoading: followInfoLoading } = useQuery({
    queryKey: ["follow", "count", reqruterId],
    queryFn: async () => {
      // shape-agnostic parsing of /following/count response
      const raw = await fetchJSON<any>(
        `${BASE_URL}/following/count?recruiterId=${reqruterId}`
      );
      const data: FollowCountResponse =
        raw?.data && typeof raw.data === "object"
          ? {
              count:
                typeof raw.data.count === "number"
                  ? raw.data.count
                  : typeof raw.count === "number"
                  ? raw.count
                  : typeof raw.data === "number"
                  ? raw.data
                  : 0,
              isFollowing:
                typeof raw.data.isFollowing === "boolean"
                  ? raw.data.isFollowing
                  : typeof raw.isFollowing === "boolean"
                  ? raw.isFollowing
                  : undefined,
            }
          : {
              count:
                typeof raw.count === "number"
                  ? raw.count
                  : typeof raw.data === "number"
                  ? raw.data
                  : 0,
              isFollowing:
                typeof raw.isFollowing === "boolean" ? raw.isFollowing : undefined,
            };

      return {
        count: data.count ?? 0,
        // if API doesn't give status, default to false
        isFollowing: data.isFollowing ?? false,
      };
    },
    enabled: Boolean(reqruterId),
    staleTime: 15_000,
  });

  const canFollow = useMemo(() => {
    if (!myId || !recruiterData?.userId) return false;
    return myId !== recruiterData.userId;
  }, [myId, recruiterData?.userId]);

  // ---- Mutation (toggle follow) with optimistic update, no token ----
  const toggleFollowMutation = useMutation({
    mutationFn: async (nextIsFollowing: boolean) => {
      if (!myId || !reqruterId || !companyId) {
        throw new Error("Missing IDs for follow action");
      }
      const url = `${BASE_URL}/following/${nextIsFollowing ? "follow" : "unfollow"}`;
      const method = nextIsFollowing ? "POST" : "DELETE";
      const payload = {
        userId: myId,
        recruiterId: reqruterId,
        companyId,
      };
      return fetchJSON<any>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onMutate: async (nextIsFollowing) => {
      await queryClient.cancelQueries({ queryKey: ["follow", "count", reqruterId] });

      const prev = queryClient.getQueryData<{ count: number; isFollowing: boolean }>([
        "follow",
        "count",
        reqruterId,
      ]);

      if (prev) {
        queryClient.setQueryData(["follow", "count", reqruterId], {
          count: Math.max(0, prev.count + (nextIsFollowing ? 1 : -1)),
          isFollowing: nextIsFollowing,
        });
      } else {
        queryClient.setQueryData(["follow", "count", reqruterId], {
          count: nextIsFollowing ? 1 : 0,
          isFollowing: nextIsFollowing,
        });
      }

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["follow", "count", reqruterId], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["follow", "count", reqruterId] });
    },
  });

  // ---- Render states ----
  if (recruiterLoading) {
    return (
      <div className="container mx-auto p-6 animate-pulse">
        <div className="w-full h-48 bg-gray-200 rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mt-6">
          <div className="col-span-4 space-y-4">
            <div className="w-[170px] h-[170px] bg-gray-200 rounded-md"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="col-span-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (recruiterIsError) {
    return (
      <div className="container mx-auto p-6 text-red-500">
        Error: {(recruiterError as Error)?.message ?? "Failed to load profile"}
      </div>
    );
  }

  if (!recruiterData) {
    return <div className="container mx-auto p-6">No recruiter data found.</div>;
  }

  const iconMap: Record<string, React.ElementType> = {
    website: Globe,
    linkedin: Linkedin,
    twitter: Twitter,
    other: LinkIcon,
    upwork: LinkIcon,
  };

  const isFollowing = followInfo?.isFollowing ?? false;
  const followersCount = followInfo?.count ?? 0;
  const followBusy = toggleFollowMutation.isPending;
  const followErr =
    (toggleFollowMutation.error as Error | undefined)?.message ?? null;

  return (
    <div className="container mx-auto px-6">
      {/* Banner */}
      <div
        className={`relative w-full h-[300px] ${
          recruiterData.banner ? "" : "bg-gray-200"
        }`}
      >
        {recruiterData.banner && (
          <Image
            src={recruiterData.banner}
            alt={`${recruiterData.firstName} ${recruiterData.lastName} Banner`}
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mt-[-60px] px-6">
        {/* Profile Section */}
        <div className="col-span-1 md:col-span-4 space-y-4">
          <div className="relative w-[170px] h-[170px]">
            {recruiterData.photo ? (
              <Image
                src={recruiterData.photo}
                alt={`${recruiterData.firstName} ${recruiterData.lastName}`}
                fill
                className="rounded-md object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-500">No Photo</span>
              </div>
            )}
          </div>
          <div>
            <div className="py-2">
              <h1 className="text-2xl font-bold">
                {recruiterData.firstName} {recruiterData.sureName}{" "}
                {recruiterData.lastName}
              </h1>
              <p className="text-lg text-gray-600">{recruiterData.title}</p>
              <p className="text-gray-700 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {recruiterData.country}, {recruiterData.city},
              </p>
            </div>
            <div className="flex space-x-2 mt-2">
              <div>
                <SocialLinks sLink={recruiterData.sLink} />
              </div>
            </div>
          </div>

          {/* Follow / Unfollow with count (TanStack Query, no token) */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => toggleFollowMutation.mutate(!isFollowing)}
              disabled={
                !canFollow ||
                followBusy ||
                followInfoLoading ||
                !reqruterId ||
                !companyId ||
                !myId
              }
              className={`${
                isFollowing
                  ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition-colors`}
              aria-label={
                isFollowing
                  ? `Unfollow ${recruiterData.firstName} ${recruiterData.lastName}`
                  : `Follow ${recruiterData.firstName} ${recruiterData.lastName}`
              }
            >
              {followBusy
                ? "Please wait…"
                : isFollowing
                ? "Following"
                : "Follow"}
            </Button>

            <span className="text-sm text-gray-600">
              {followersCount} follower{followersCount === 1 ? "" : "s"}
            </span>
          </div>
          {followErr ? (
            <p className="text-sm text-red-500">{followErr}</p>
          ) : null}
        </div>

        {/* About */}
        <div className="ccol-span-1 md:col-span-6 pt-4 md:pt-24">
          <div className="flex items-center justify-between border-b-2 pb-2">
            <h3 className="font-semibold text-gray-800 mb-3 text-2xl">About</h3>
            {userId ? (
              <CandidateSharePopover
                userId={userId}
                role="recruiters-profile"
                title={`${recruiterData.firstName} ${
                  recruiterData.lastName
                } — ${recruiterData.title ?? "Candidate"}`}
                summary={
                  recruiterData.bio
                    ? recruiterData.bio.replace(/<[^>]*>/g, "").slice(0, 180)
                    : ""
                }
              />
            ) : null}
          </div>

          <div>
            <p
              className="text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: recruiterData.bio || "No description provided",
              }}
            />
          </div>
        </div>
      </div>

      {/* Elevator Pitch */}
      <div className="lg:py-12 pb-5">
        <h2 className="text-xl lg:text-4xl font-bold text-center mb-24">
          Elevator Pitch
        </h2>
        <div className="rounded-lg">
          {pitchLoading ? (
            <div>Loading pitch...</div>
          ) : pitchIsError ? (
            <div className="text-red-500">
              Error: {(pitchError as Error)?.message ?? "Failed to load pitch"}
            </div>
          ) : pitchData ? (
            <VideoPlayer pitchId={pitchData._id} className="w-full mx-auto" />
          ) : (
            <div>No pitch available</div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-300 mt-6" />

      {/* Skills */}
      <section className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">Skills</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {["UX/UI Design", "Prototyping", "User Testing", "Design Systems"].map(
            (skill) => (
              <span
                key={skill}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            )
          )}
        </div>
      </section>

      {/* Experience */}
      <section className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">Experience</h2>
        <div className="mt-2">
          <p className="text-gray-700 font-medium">Product Designer</p>
          <p className="text-gray-600">Various Startups, Remote</p>
          <p className="text-gray-600">Jan 2015 - Present | 10+ years</p>
        </div>
      </section>

      {/* Education */}
      <section className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">Education</h2>
        <div className="mt-2">
          <p className="text-gray-700 font-medium">Bachelor in Design</p>
          <p className="text-gray-600">University of Yerevan</p>
          <p className="text-gray-600">Sep 2009 - Jun 2013 | 4 years</p>
        </div>
      </section>

      {/* Awards & Honours */}
      <section className="mt-6 bg-white p-6 rounded-lg shadow mb-24">
        <h2 className="text-xl font-semibold">Awards & Honours</h2>
        <div className="mt-2">
          <p className="text-gray-700 font-medium">Best UX Design Award</p>
          <p className="text-gray-600">For outstanding user-centric design, 2023</p>
        </div>
      </section>
    </div>
  );
}
