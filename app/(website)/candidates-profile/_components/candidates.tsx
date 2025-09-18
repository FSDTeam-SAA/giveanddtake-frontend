"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  GraduationCap,
  Award as AwardIcon,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { SocialIcon } from "@/components/company/social-icon";
import CandidateShare from "./candidateShare";
import CandidateSharePopover from "./candidateShare";

// ---------- utils ----------
const toMonthYear = (date?: string) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime())
    ? "Invalid Date"
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

const titleCase = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const joinLocation = (...parts: (string | undefined)[]) =>
  parts.filter((p) => (typeof p === "string" ? p.trim() : false)).join(", ") ||
  "—";

// ---------- types ----------
interface ResumeResponse {
  success: boolean;
  message: string;
  data: {
    resume: {
      _id: string;
      userId: string;
      photo?: string;
      aboutUs?: string;
      title?: string;
      firstName: string;
      lastName: string;
      country?: string;
      banner?: string;
      city?: string;
      email?: string;
      phoneNumber?: string;
      sLink?: { label: string; url: string; _id: string }[];
      skills?: string[];
    };
    experiences?: {
      _id: string;
      company?: string;
      position?: string;
      jobDescription?: string;
      startDate?: string;
      endDate?: string;
      city?: string;
      country?: string;
    }[];
    education?: {
      _id: string;
      degree?: string;
      fieldOfStudy?: string;
      city?: string;
      state?: string;
      country?: string;
      startDate?: string;
      graduationDate?: string;
    }[];
    awardsAndHonors?: {
      _id: string;
      title?: string;
      description?: string;
      programeDate?: string; // from your payload
      createdAt?: string;
    }[];
  };
}

// ---------- skeleton ----------
const SkeletonLoader: React.FC = () => (
  <div className="py-24">
    <Card className="border-0">
      <CardContent className="p-0">
        {/* Profile Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 animate-pulse">
          <div className="col-span-4">
            <div className="w-[170px] h-[170px] rounded-md bg-gray-300"></div>
            <div className="mt-3">
              <div className="h-6 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mt-2"></div>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="w-10 h-10 bg-gray-300 rounded"></div>
              <div className="w-10 h-10 bg-gray-300 rounded"></div>
              <div className="w-10 h-10 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="col-span-6">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-5 bg-gray-300 rounded w-1/4 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-5 bg-gray-300 rounded w-1/4 mt-4 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div>
                <div className="h-5 bg-gray-300 rounded w-1/4 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-5 bg-gray-300 rounded w-1/4 mt-4 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <section className="border-b py-6 animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-3"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </section>

        {/* Skills */}
        <section className="border-b py-6 animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-3"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-gray-300 rounded w-20"></div>
            <div className="h-6 bg-gray-300 rounded w-20"></div>
            <div className="h-6 bg-gray-300 rounded w-20"></div>
          </div>
        </section>

        {/* Experience */}
        <section className="border-b py-6 animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-3"></div>
          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mt-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4 mt-2"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Education */}
        <section className="border-b py-6 animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-3"></div>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-16 h-16 bg-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4 mt-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3 mt-2"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Awards */}
        <section className="py-6 animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-3"></div>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-16 h-16 bg-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4 mt-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mt-2"></div>
              </div>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  </div>
);

// ---------- main ----------
const Candidates: React.FC<{ userId?: string }> = ({ userId }) => {
  const { data: session } = useSession(); // keep if you’ll need token later

  // --- data fetch (hook always called) ---
  const fetchResume = async (): Promise<ResumeResponse> => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/create-resume/get-resume/${userId}`
    );
    if (!res.ok) throw new Error("Failed to fetch resume");
    return res.json();
  };

  const {
    data: myresume,
    isLoading,
    isFetching,
  } = useQuery<ResumeResponse>({
    queryKey: ["my-resume", userId],
    queryFn: fetchResume,
    enabled: !!userId,
  });

  // --- safe bases (work during loading too) ---
  const resume = myresume?.data?.resume;
  const experiences = myresume?.data?.experiences ?? [];
  const education = myresume?.data?.education ?? [];
  const awardsAndHonors = myresume?.data?.awardsAndHonors ?? [];

  // --- ALWAYS call memos before any conditional return ---
  const sortedExperiences = React.useMemo(
    () =>
      [...experiences].sort(
        (a, b) =>
          new Date(b.startDate || 0).getTime() -
          new Date(a.startDate || 0).getTime()
      ),
    [experiences]
  );

  const sortedEducation = React.useMemo(
    () =>
      [...education].sort(
        (a, b) =>
          new Date(b.graduationDate || 0).getTime() -
          new Date(a.graduationDate || 0).getTime()
      ),
    [education]
  );

  const sortedAwards = React.useMemo(
    () =>
      [...awardsAndHonors].sort(
        (a, b) =>
          new Date(b.programeDate || b.createdAt || 0).getTime() -
          new Date(a.programeDate || a.createdAt || 0).getTime()
      ),
    [awardsAndHonors]
  );

  // --- conditional rendering happens AFTER hooks ---
  if (isLoading || isFetching) return <SkeletonLoader />;
  if (!resume) return <SkeletonLoader />;

  return (
    <div>
      {/* Banner */}
      <div className="w-full h-[300px]">
        {resume.banner ? (
          <Image
            src={resume.banner}
            alt={`${resume.firstName} banner`}
            width={1200}
            height={200}
            className="w-full h-[300px] object-cover object-center"
          />
        ) : (
          <div className="w-full h-[300px] bg-gray-200" />
        )}
      </div>

      {/* Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 px-6 mt-[-30px]">
        <div className="col-span-3">
          <div className="w-[170px] h-[170px] rounded-md bg-gray-200 overflow-hidden">
            {resume.photo ? (
              <Image
                src={resume.photo}
                alt={`${resume.firstName} ${resume.lastName}`}
                width={170}
                height={170}
                className="w-[170px] h-[170px] object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-2xl font-bold">
                {resume.firstName?.[0]}
                {resume.lastName?.[0]}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold mt-3">
            {resume.firstName} {resume.lastName}
          </h2>
          {resume.title && <p className="text-gray-600">{resume.title}</p>}

          <p className="text-gray-600 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {joinLocation(resume.country, resume.city)}
          </p>

          {/* Social Links */}
          <div className="flex gap-2 mt-3">
            {resume.sLink?.map((link) => (
              <SocialIcon key={link._id} url={link.url} />
            ))}
          </div>
        </div>

        {/* About */}
        <div className="col-span-7 lg:mt-[60px]">
          <div className="flex items-center justify-between border-b-2 pb-2">
            <h3 className="font-semibold text-gray-800 mb-3 text-2xl">About</h3>
            {userId ? (
              <CandidateSharePopover
                userId={userId}
                role="candidates-profile"
                title={`${resume.firstName} ${resume.lastName} — ${
                  resume.title ?? "Candidate"
                }`}
                summary={
                  resume.aboutUs
                    ? resume.aboutUs.replace(/<[^>]*>/g, "").slice(0, 180)
                    : ""
                }
              />
            ) : null}
          </div>

          <div>
            <p
              className="text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: resume.aboutUs || "No description provided",
              }}
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <section className="border-b py-12">
        <h3 className="text-2xl font-semibold mb-3">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {resume.skills?.length ? (
            resume.skills.map((skill, idx) => (
              <span
                key={idx}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No skills listed</p>
          )}
        </div>
      </section>

      {/* Experience (show all) */}
      <section className="border-b py-6">
        <h3 className="text-[40px] font-semibold mb-3 text-[#131313]">
          Experience
        </h3>

        {sortedExperiences.length > 0 ? (
          <div className="space-y-8">
            {sortedExperiences.map((exp) => {
              const when = `${toMonthYear(exp.startDate)} - ${
                exp.endDate ? toMonthYear(exp.endDate) : "Present"
              }`;
              const loc = joinLocation(exp.city, exp.country);
              return (
                <div key={exp._id} className="flex gap-4 items-start">
                  <div>
                    <Briefcase className="text-blue-600 w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <h4 className="font-bold text-[20px] text-[#595959]">
                        {exp.position || "N/A"}
                        {exp.company && (
                          <span className="font-normal text-gray-700">
                            {" "}
                            · {exp.company}
                          </span>
                        )}
                      </h4>
                      <span className="inline-flex items-center text-xs sm:text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {when}
                      </span>
                    </div>

                    {exp.jobDescription && (
                      <p className="text-gray-600 text-sm mt-1">
                        {exp.jobDescription}
                      </p>
                    )}

                    <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {loc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No experience listed</p>
        )}
      </section>

      {/* Education (show all) */}
      <section className="border-b py-6">
        <h3 className="text-[40px] font-semibold mb-3 text-[#131313]">
          Education
        </h3>

        <div className="space-y-4">
          {sortedEducation.length > 0 ? (
            <ul className="space-y-6">
              {sortedEducation.map((edu) => {
                const degree = titleCase(edu.degree) || "Degree";
                const field =
                  typeof edu.fieldOfStudy === "string" &&
                  edu.fieldOfStudy.trim().length
                    ? edu.fieldOfStudy.trim()
                    : "";
                const loc = joinLocation(edu.city, edu.state, edu.country);

                return (
                  <li
                    key={edu._id}
                    className="flex gap-4 items-start sm:items-center"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-blue-100 rounded-xl">
                      <GraduationCap className="text-blue-600 w-7 h-7 sm:w-8 sm:h-8" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <h4 className="font-semibold text-lg text-[#595959]">
                          {degree}
                          {field && (
                            <span className="font-normal"> in {field}</span>
                          )}
                        </h4>

                        <span className="inline-flex items-center text-xs sm:text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {toMonthYear(edu.startDate)} —{" "}
                          {toMonthYear(edu.graduationDate)}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mt-1">{loc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No education listed</p>
          )}
        </div>
      </section>

      {/* Awards (show all) */}
      <section className="py-6">
        <h3 className="text-[40px] font-semibold mb-3 text-[#131313]">
          Awards & Honours
        </h3>

        {sortedAwards.length > 0 ? (
          <div className="space-y-4">
            {sortedAwards.map((award) => (
              <div
                key={award._id}
                className="flex gap-4 items-start sm:items-center"
              >
                <div className="w-16 h-16 flex items-center justify-center bg-blue-100 rounded">
                  <AwardIcon className="text-blue-600 w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <h4 className="font-semibold text-lg">
                      {award.title || "N/A"}
                    </h4>
                    <span className="inline-flex items-center text-xs sm:text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {toMonthYear(award.programeDate || award.createdAt)}
                    </span>
                  </div>
                  {award.description && (
                    <p className="text-gray-600 text-sm mt-1">
                      {award.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No awards listed</p>
        )}
      </section>
    </div>
  );
};

export default Candidates;
