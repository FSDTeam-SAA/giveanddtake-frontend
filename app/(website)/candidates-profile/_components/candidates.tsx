"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SquarePen,
  Clock,
  Briefcase,
  GraduationCap,
  Award as AwardIcon,
  MapPin,
  GlobeIcon,
  LinkedinIcon,
  LinkIcon,
  TwitterIcon,
  Badge,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

// ✅ icon mapping for social links
const iconMap: { [key: string]: React.FC<{ size?: number }> } = {
  website: (props) => <GlobeIcon {...props} />,
  linkedin: (props) => <LinkedinIcon {...props} />,
  twitter: (props) => <TwitterIcon {...props} />,
  other: (props) => <LinkIcon {...props} />,
};

// ✅ Format date safely
const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "Invalid Date"
    : date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

// ✅ Type definition for API response
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
      city?: string;
      email?: string;
      phoneNumber?: string;
      sLink?: { label: string; url: string; _id: string }[];
      skills?: string[];
    };
    experiences?: {
      _id: string;
      jobDescription?: string;
      jobCategory?: string;
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
      graduationDate?: string;
    }[];
    awardsAndHonors?: {
      _id: string;
      title?: string;
      description?: string;
      createdAt?: string;
    }[];
  };
}

const Candidates: React.FC<{ userId?: string }> = ({ userId }) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  // ✅ Fetch resume API
  const fetchResume = async (): Promise<ResumeResponse> => {
    const res = await fetch(
      "http://localhost:5000/api/v1/create-resume/get-resume",
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error("Failed to fetch resume");
    return res.json();
  };

  // ✅ Query with React Query
  const {
    data: myresume,
    isLoading,
    isFetching,
  } = useQuery<ResumeResponse>({
    queryKey: ["my-resume"],
    queryFn: fetchResume,
    enabled: !!session?.user,
  });

  if (isLoading || isFetching) return <div>Loading...</div>;
  if (!myresume?.data?.resume) return <div>No resume data available</div>;

  const { resume, experiences, education, awardsAndHonors } = myresume.data;



  return (
    <div className="py-24">
      <Card className="border-0">
        <CardContent className="p-0">

          {/* Profile Section */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
            <div className="col-span-4">
              <div className="w-24 h-24 rounded-md bg-gray-200 overflow-hidden">
                {resume.photo ? (
                  <Image
                    src={resume.photo}
                    alt={`${resume.firstName} ${resume.lastName}`}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
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
              <p className="text-gray-500">{resume.email}</p>
              <p className="text-gray-500">{resume.phoneNumber}</p>

              {/* Social Links */}
              <div className="flex gap-2 mt-3">
                {resume.sLink?.map((link) => {
                  const Icon =
                    iconMap[link.label.toLowerCase()] || iconMap["other"];
                  return (
                    <Link
                      key={link._id}
                      href={link.url}
                      target="_blank"
                      className="p-2 border rounded text-blue-600 hover:text-blue-800"
                    >
                      <Icon size={20} />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Contact Info */}
            <div className="col-span-6">
              <div>
                <h3 className="font-semibold text-lg">Location</h3>
                <p className="text-gray-600">
                  {resume.city && `${resume.city}, `} {resume.country || "N/A"}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Website</h3>
                <p className="text-blue-600">
                  {resume.sLink?.find((s) => s.label === "website")?.url ||
                    "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* About */}
          <section className="border-b py-6">
            <h3 className="text-2xl font-semibold mb-3">About</h3>
            <p
              className="text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: resume.aboutUs || "No description provided",
              }}
            />
          </section>

          {/* Skills */}
          <section className="border-b py-6">
            <h3 className="text-2xl font-semibold mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {resume.skills?.length ? (
                resume.skills.map((skill, idx) => (
                  <Badge
                    key={idx}
                    className="bg-blue-600 text-white px-3 py-1 text-sm"
                  >
                    {skill}
                  </Badge>
                ))
              ) : (
                <p>No skills listed</p>
              )}
            </div>
          </section>

          {/* Experience */}
          <section className="border-b py-6">
            <h3 className="text-2xl font-semibold mb-3">Experience</h3>
            <div className="space-y-4">
              {experiences?.length ? (
                experiences.map((exp) => (
                  <div
                    key={exp._id}
                    className="flex gap-4 items-start sm:items-center"
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-blue-100 rounded">
                      <Briefcase className="text-blue-600 w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold capitalize">
                        {exp.jobCategory || "N/A"}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {exp.jobDescription || "No description"}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                      </p>
                      <p className="text-gray-600 text-sm flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {exp.city && `${exp.city}, `} {exp.country || "N/A"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No experience listed</p>
              )}
            </div>
          </section>

          {/* Education */}
          <section className="border-b py-6">
            <h3 className="text-2xl font-semibold mb-3">Education</h3>
            <div className="space-y-4">
              {education?.length ? (
                education.map((edu) => (
                  <div
                    key={edu._id}
                    className="flex gap-4 items-start sm:items-center"
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-blue-100 rounded">
                      <GraduationCap className="text-blue-600 w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {edu.degree}{" "}
                        {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {formatDate(edu.graduationDate)}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {edu.city && `${edu.city}, `}
                        {edu.state || ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No education listed</p>
              )}
            </div>
          </section>

          {/* Awards */}
          <section className="py-6">
            <h3 className="text-2xl font-semibold mb-3">Awards & Honours</h3>
            <div className="space-y-4">
              {awardsAndHonors?.length ? (
                awardsAndHonors.map((award) => (
                  <div
                    key={award._id}
                    className="flex gap-4 items-start sm:items-center"
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-blue-100 rounded">
                      <AwardIcon className="text-blue-600 w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {award.title || "N/A"}
                      </h4>
                      <p className="text-gray-500 text-sm">
                        {formatDate(award.createdAt)}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {award.description || ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No awards listed</p>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default Candidates;
