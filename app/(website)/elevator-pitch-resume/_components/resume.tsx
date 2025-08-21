"use client";

import type React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  GraduationCap,
  Briefcase,
  AwardIcon,
  SquarePen,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import { Globe, Linkedin, Twitter, LinkIcon } from "lucide-react";
import Image from "next/image";
import type { StyledString } from "next/dist/build/swc/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { FaUpwork } from "react-icons/fa6";
import {
  deleteElevatorPitchVideo,
  updateElevatorPitchVideo,
  uploadElevatorPitch,
} from "@/lib/api-service";
import { FileUpload } from "@/components/company/file-upload";

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
  title: string;
  firstName: string;
  lastName: string;
  country: string;
  zipCode: string;
  email: string;
  phoneNumber: string;
  skills: string[];
  sLink: any[];
  createdAt: StyledString;
  __v: number;
}

interface Experience {
  _id: string;
  userId: string;
  employer?: string;
  jobTitle?: string;
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
  instituteName: string;
  graduationDate: string;
  userId: string;
  city?: string;
  state?: string;
  degree: string;
  fieldOfStudy?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ResumeAward {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface MyResumeProps {
  resume: ResumeResponse["data"];
  onEdit: () => void;
}

export default function MyResume({ resume, onEdit }: MyResumeProps) {
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [pitchVideo, setPitchVideo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const session = useSession();
  const userId = session?.data?.user?.id;

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

  const handlePitchUpload = async () => {
    if (!pitchVideo || !userId) {
      console.error("Missing video file or user ID");
      return;
    }

    setIsUploading(true);
    try {
      if (resume?.elevatorPitch?.[0]?.video) {
        // Updated to use direct function call instead of apiClient method
        await updateElevatorPitchVideo({
          videoFile: pitchVideo,
          userId,
        });
      } else {
        // Updated to use direct function call instead of apiClient method
        await uploadElevatorPitch({
          videoFile: pitchVideo,
          userId,
        });
      }
      setIsEditingPitch(false);
      setPitchVideo(null);
      window.location.reload();
    } catch (error) {
      console.error("Error uploading elevator pitch:", error);
      alert("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePitchDelete = async () => {
    if (!userId) {
      console.error("Missing user ID");
      return;
    }

    if (
      !confirm("Are you sure you want to delete your elevator pitch video?")
    ) {
      return;
    }

    try {
      // Updated to use direct function call instead of apiClient method
      await deleteElevatorPitchVideo(userId);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting elevator pitch:", error);
      alert("Failed to delete video. Please try again.");
    }
  };

  const handlePitchDownload = () => {
    if (resume?.elevatorPitch?.[0]?.video?.url) {
      const link = document.createElement("a");
      link.href = resume.elevatorPitch[0].video.url;
      link.download = "elevator-pitch-video.mp4";
      link.click();
    }
  };

  const iconMap: Record<string, React.ElementType> = {
    website: Globe,
    linkedin: Linkedin,
    twitter: Twitter,
    upwork: FaUpwork, // store component, not JSX
    other: LinkIcon,
  };

  return (
    <main className="min-h-screen">
      <div className="container">
        {/* Elevator Pitch Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Your Elevator Pitch
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Get a quick glimpse of my work and creative process through
                  this video portfolio.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingPitch(!isEditingPitch)}
                className="text-gray-600 hover:text-gray-800"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            {isEditingPitch ? (
              <div className="space-y-4">
                <FileUpload
                  accept="video/*"
                  maxSize={50 * 1024 * 1024} // 50MB
                  onFileSelect={(file) => setPitchVideo(file)}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingPitch(false);
                      setPitchVideo(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePitchUpload}
                    disabled={!pitchVideo || isUploading}
                    className="bg-primary hover:bg-blue-700"
                  >
                    {isUploading ? "Uploading..." : "Upload Video"}
                  </Button>
                </div>
              </div>
            ) : resume?.elevatorPitch?.[0]?.video ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-auto rounded-lg"
                    poster="/placeholder.svg?height=400&width=600"
                  >
                    <source
                      src={resume.elevatorPitch[0].video.url}
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePitchDownload}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePitchDelete}
                    className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    No Elevator Pitch Yet
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Upload a video to showcase your skills and personality to
                    potential employers.
                  </p>
                  <Button
                    onClick={() => setIsEditingPitch(true)}
                    className="bg-primary hover:bg-blue-700"
                  >
                    Upload Video
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Resume Section */}
        <Card className="border-0">
          <CardContent className="p-0">
            <div className="mb-2 lg:mb-0 flex items-center justify-center relative">
              <h1 className="text-xl text-center sm:text-4xl font-bold text-gray-800">
                My Resume
              </h1>
              <div className="absolute right-0">
                <Button
                  onClick={onEdit}
                  className="bg-[#3b82f6] hover:bg-[#3b82f6]"
                >
                  <SquarePen className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row border-b-2 lg:py-12 pb-4 gap-6 sm:px-6">
              {/* Left Sidebar - Contact Info */}
              <div className="lg:w-1/3 w-full">
                <div className="mb-6 text-center lg:text-left">
                  <div className="w-24 h-24 mx-auto lg:mx-0 rounded-md bg-gray-300 mb-4 overflow-hidden">
                    {resume.resume.photo ? (
                      <Image
                        src={resume.resume.photo || "/placeholder.svg"}
                        alt={`${resume.resume.firstName} ${resume.resume.lastName}`}
                        height={800}
                        width={800}
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
                    {resume.resume.firstName} {resume.resume.lastName}
                  </h2>
                  <div className="flex gap-3 items-center mt-2">
                    {resume?.resume?.sLink?.map((linkObj: any) => {
                      const { label, url, _id } = linkObj;
                      const Icon = iconMap[label?.toLowerCase()] || null;

                      if (!Icon || !url) return null; // skip if missing icon or url

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

              {/* Right Content */}
              <div className="lg:w-2/3 w-full space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-3 text-2xl border-b-2 pb-2">
                    Contact Info
                  </h3>
                  <div>
                    <p className="font-semibold text-base">Location</p>
                    <p className="text-gray-600 text-sm">
                      {resume.resume.country}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-base">Phone</p>
                      <span className="text-gray-600">
                        {resume.resume.phoneNumber}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-base">Email</p>
                      <p className="text-gray-600">{resume.resume.email}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-base">Website URL</p>
                      <span className="text-blue-600">
                        {resume.resume.sLink?.find(
                          (link: any) => link.label === "website"
                        )?.url || "www.example.com"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-800 text-sm">
                      Availability to Start
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Immediately Available</p>
                </div>
              </div>
            </div>

            {/* About Section */}
            <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                About
              </h3>
              <p
                className="text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: resume.resume.aboutUs || "Here is about yourself",
                }}
              />
            </section>

            {/* Skills Section */}
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

            {/* Experience Section */}
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
                        {exp.jobTitle}
                      </h4>
                      <h3>{exp.employer}</h3>
                      <p className="text-gray-500 text-sm">
                        {formatDate(exp.endDate)} - {formatDate(exp.startDate)}
                      </p>
                    </div>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {exp.city && `${exp.city}, `} {exp.country}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Education Section */}
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
                        {edu.degree}{" "}
                        {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                      </h4>
                      <p className="text-sm">
                        {formatDate(edu.graduationDate)}
                      </p>
                      <p className="text-sm">{edu.instituteName}</p>
                    </div>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {edu.city && `${edu.city}, `} {edu.state}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Awards & Honours Section */}
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
                        {formatDate(award.createdAt)}
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
