"use client";

import type React from "react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Globe, Linkedin, Twitter, LinkIcon, MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VideoPlayer } from "@/components/company/video-player";
import { SocialIcon } from "@/components/company/social-icon";
import CandidateSharePopover from "../../candidates-profile/_components/candidateShare";
import SocialLinks from "../../elevator-pitch-resume/_components/SocialLinks";

interface SocialLink {
  label: string;
  _id: string;
  url?: string;
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

interface ApiResponse {
  success: boolean;
  total: number;
  data: PitchData[];
}

interface MydataProps {
  userId: string;
}

export default function Recruiters({ userId }: MydataProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [recruiterData, setRecruiterData] = useState<RecruiterData | null>(
    null
  );
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pitchLoading, setPitchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pitchError, setPitchError] = useState<string | null>(null);

  const iconMap: Record<string, React.ElementType> = {
    website: Globe,
    linkedin: Linkedin,
    twitter: Twitter,
    other: LinkIcon,
    upwork: LinkIcon,
  };

  useEffect(() => {
    const fetchRecruiterData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/recruiter/recruiter-account/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recruiter data");
        }

        const result = await response.json();
        if (result.success) {
          setRecruiterData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    const fetchPitchData = async () => {
      if (!session?.user?.id || !token) {
        setPitchLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}/elevator-pitch/all/elevator-pitches?type=recruiter`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pitch data");
        }

        const apiResponse: ApiResponse = await response.json();

        // Find the pitch that matches the current user's ID
        const userPitch = apiResponse.data.find(
          (pitch) => pitch.userId._id === session.user?.id
        );

        if (userPitch) {
          setPitchData(userPitch);
        } else {
          setPitchError("No pitch found for current user");
        }
      } catch (err) {
        setPitchError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setPitchLoading(false);
      }
    };

    fetchRecruiterData();
    fetchPitchData();
  }, [token, userId, session]);

  if (loading) {
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

  if (error) {
    return (
      <div className="container mx-auto p-6 text-red-500">Error: {error}</div>
    );
  }

  if (!recruiterData) {
    return (
      <div className="container mx-auto p-6">No recruiter data found.</div>
    );
  }

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
          <div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 transition-colors"
              aria-label={`Follow ${recruiterData.firstName} ${recruiterData.lastName}`}
            >
              Follow
            </Button>
          </div>
        </div>

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
          {pitchData ? (
            <VideoPlayer pitchId={pitchData._id} className="w-full mx-auto" />
          ) : pitchLoading ? (
            <div>Loading pitch...</div>
          ) : pitchError ? (
            <div className="text-red-500">Error: {pitchError}</div>
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
          {[
            "UX/UI Design",
            "Prototyping",
            "User Testing",
            "Design Systems",
          ].map((skill) => (
            <span
              key={skill}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
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
          <p className="text-gray-600">
            For outstanding user-centric design, 2023
          </p>
        </div>
      </section>
    </div>
  );
}
