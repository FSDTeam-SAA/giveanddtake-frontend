"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  GraduationCap,
  Briefcase,
  AwardIcon,
  SquarePen,
} from "lucide-react";
import { Globe, Linkedin, Twitter, LinkIcon } from "lucide-react";
import { FaUpwork } from "react-icons/fa6";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/company/video-player";

interface ResumeResponse {
  success: boolean;
  message: string;
  data: {
    resume: Resume;
    website: string;
    experiences: Experience[];
    education: Education[];
    awardsAndHonors: ResumeAward[];
    elevatorPitch: any[];
  };
}

interface Resume {
  _id: string;
  aboutUs: string;
  userId: string;
  type: string;
  photo: string | null;
  banner: string | null;
  title: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  zipCode: string;
  email: string;
  phoneNumber: string;
  skills: string[];
  sLink: { label: string; url: string; _id: string }[];
  certifications: string[];
  languages: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Experience {
  _id: string;
  userId: string;
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  country?: string;
  city?: string;
  zip?: string;
  jobDescription?: string;
  jobCategory?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Education {
  _id: string;
  userId: string;
  instituteName: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  graduationDate?: string;
  city?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ResumeAward {
  _id: string;
  userId: string;
  title: string;
  programeDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface MyResumeProps {
  resume: ResumeResponse["data"];
  onEdit: () => void;
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

export default function MyResume({ resume, onEdit }: MyResumeProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const token = session?.accessToken;

  // useEffect(() => {
  //   const fetchPitchData = async () => {
  //     if (!session?.user?.id || !token) {
  //       setPitchLoading(false);
  //       return;
  //     }

  //     try {
  //       const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  //       const response = await fetch(
  //         `${baseUrl}/elevator-pitch/all/elevator-pitches?type=candidate`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to fetch pitch data");
  //       }

  //       const apiResponse: ApiResponse = await response.json();
  //       const userPitch = apiResponse.data.find(
  //         (pitch) => pitch.userId._id === session.user?.id
  //       );

  //       if (userPitch) {
  //         setPitchData(userPitch);
  //       } else {
  //         setPitchError("No pitch found for current user");
  //       }
  //     } catch (err) {
  //       setPitchError(err instanceof Error ? err.message : "An error occurred");
  //     } finally {
  //       setPitchLoading(false);
  //     }
  //   };

  //   fetchPitchData();
  // }, [session, token]);

  if (!resume || !resume.resume) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No resume data available</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Present";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const iconMap: Record<string, React.ElementType> = {
    github: LinkIcon,
    website: Globe,
    linkedin: Linkedin,
    twitter: Twitter,
    upwork: FaUpwork,
    other: LinkIcon,
  };

  return (
    <main className="min-h-screen">
      <div className="container">
        <div>
          {resume.resume.banner ? (
            <Image
              src={resume.resume.banner}
              alt="Resume Header Background"
              width={1200}
              height={300}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-t-lg" />
          )}
        </div>
        <Card className="border-0">
          <CardContent className="p-0">
            <div className="mb-2 lg:mb-0 flex items-center justify-center relative">
              <div className="absolute right-0 mt-[70px]">
                <Button
                  onClick={onEdit}
                  className="bg-[#3b82f6] hover:bg-[#3b82f6]"
                >
                  <SquarePen className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row border-b-2 mt-[-20px] pb-4 gap-6 sm:px-6">
              <div className="lg:w-1/3 w-full">
                <div className="mb-6 text-center lg:text-left">
                  <div className="w-[170px] h-[170px] mx-auto lg:mx-0 rounded-md bg-gray-300 mb-4 overflow-hidden">
                    {resume.resume.photo ? (
                      <Image
                        src={resume.resume.photo}
                        alt={`${resume.resume.firstName} ${resume.resume.lastName}`}
                        height={170}
                        width={170}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                        {resume.resume.firstName?.[0] || "U"}
                        {resume.resume.lastName?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {resume.resume.title ? `${resume.resume.title}. ` : ""}
                    {resume.resume.firstName} {resume.resume.lastName}
                  </h2>
                  <div className="flex gap-3 items-center mt-2">
                    {resume.resume.sLink?.map((linkObj) => {
                      const { label, url, _id } = linkObj;
                      const Icon =
                        iconMap[label.toLowerCase()] || iconMap.other;

                      if (!url) return null;

                      return (
                        <Link
                          key={_id}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 border border-[#9EC7DC] hover:border-blue-800 rounded p-2"
                        >
                          <Icon size={20} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:w-2/3 w-full space-y-6 mt-[50px]">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-3 text-2xl border-b-2 pb-2">
                    Contact Info
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-base">Location</p>
                      <p className="text-gray-600">
                        {resume.resume.city && `${resume.resume.city}, `}
                        {resume.resume.country}
                        {resume.resume.zipCode && `, ${resume.resume.zipCode}`}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-base">Phone</p>
                      <p className="text-gray-600">
                        {resume.resume.phoneNumber}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-base">Email</p>
                      <p className="text-gray-600">{resume.resume.email}</p>
                    </div>
                    {resume.resume.sLink?.length > 0 && (
                      <div>
                        <p className="font-semibold text-base">Links</p>
                        {resume.resume.sLink.map((link) => (
                          <p key={link._id} className="text-blue-600">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link.label}
                            </a>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Elevator Pitch */}
            <div className="lg:pb-12 pb-5">
              <h2 className="text-xl lg:text-4xl font-bold text-center mb-24">
                Elevator Pitch
              </h2>
              <div className="rounded-lg">
                {resume.elevatorPitch[0] ? (
                  <VideoPlayer
                    pitchId={resume.elevatorPitch[0]._id}
                    className="w-full mx-auto"
                  />
                ) : (
                  <div>No pitch available</div>
                )}
              </div>
            </div>

            <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                About
              </h3>
              <p
                className="text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: resume.resume.aboutUs || "No description provided",
                }}
              />
            </section>

            <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {resume.resume.skills?.map((skill, index) => (
                  <Badge
                    key={index}
                    className="text-white px-3 py-2 text-sm bg-[#2B7FD0] rounded-sm"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>

            <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                Certifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {resume.resume.certifications?.map((cert, index) => (
                  <Badge
                    key={index}
                    className="text-white px-3 py-2 text-sm bg-[#2B7FD0] rounded-sm"
                  >
                    {cert}
                  </Badge>
                ))}
              </div>
            </section>

            <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {resume.resume.languages?.map((lang, index) => (
                  <Badge
                    key={index}
                    className="text-white px-3 py-2 text-sm bg-[#2B7FD0] rounded-sm"
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </section>

            <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                Experience
              </h3>
              <div className="space-y-6">
                {resume.experiences.map((exp) => (
                  <div
                    key={exp._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#595959] text-lg capitalize">
                        {exp.position}
                      </h4>
                      <h3>{exp.company}</h3>
                      <p className="text-gray-500 text-sm">
                        {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                      </p>
                      {exp.jobDescription && (
                        <p className="text-gray-600 text-sm">
                          {exp.jobDescription}
                        </p>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {exp.city && `${exp.city}, `}
                        {exp.country}
                        {exp.zip && `, ${exp.zip}`}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                Education
              </h3>
              <div className="space-y-6">
                {resume.education?.map((edu) => (
                  <div
                    key={edu._id}
                    className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 capitalize text-lg">
                        {edu.degree}
                        {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                      </h4>
                      <p className="text-sm">{edu.instituteName}</p>
                      <p className="text-gray-500 text-sm">
                        {formatDate(edu.startDate)} -{" "}
                        {formatDate(edu.graduationDate)}
                      </p>
                    </div>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {edu.city && `${edu.city}, `}
                        {edu.country}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                Awards & Honours
              </h3>
              <div className="space-y-6">
                {resume.awardsAndHonors?.map((award) => (
                  <div
                    key={award._id}
                    className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AwardIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-lg">
                        {award.title}
                      </h4>
                      <p className="text-gray-500 text-sm">
                        {formatDate(award.programeDate)}
                      </p>
                      {award.description && (
                        <p className="text-gray-600 text-sm">
                          {award.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
