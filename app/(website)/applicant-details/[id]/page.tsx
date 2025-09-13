"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Play,
  ExternalLink,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DOMPurify from "dompurify";

import { VideoPlayer } from "@/components/company/video-player";

interface Resume {
  _id: string;
  userId: string;
  photo?: string;
  aboutUs?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  email?: string;
  phoneNumber?: string;
  skills?: string[];
  sLink?: Array<{ label: string; url: string; _id: string }>;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

interface Education {
  _id: string;
  userId: string;
  degree?: string;
  fieldOfStudy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Award {
  _id: string;
  userId: string;
  title?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ElevatorPitch {
  _id: string;
  userId: string;
  videoUrl?: string;
  description?: string;
}

interface ApplicantData {
  resume?: Resume;
  experiences?: Experience[];
  education?: Education[];
  awardsAndHonors?: Award[];
  elevatorPitch?: ElevatorPitch[];
}

interface ResumeFile {
  filename: string;
  url: string;
  uploadedAt: string;
  _id: string;
}

interface ResumeData {
  _id: string;
  userId: string;
  file: ResumeFile[];
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ResumeApiResponse {
  success: boolean;
  message: string;
  data: ResumeData[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: ApplicantData;
}

const degreeLabels: Record<string, string> = {
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  phd: "PhD",
  associate: "Associate Degree",
  diploma: "Diploma",
  certificate: "Certificate",
};

const skillLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

// Helper function to validate URLs
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

// Helper function to normalize URLs by adding protocol if missing
const normalizeUrl = (url: unknown): string => {
  if (typeof url !== "string" || !url) {
    return "";
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

export default function ApplicantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const applicationId = params.id as string;
  const resumeId = searchParams.get("resumeId");

  const applicatUserJobId = searchParams.get("applicationId");

  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string>("pending");
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchResumeData = async () => {
    if (!resumeId || !token) return;

    try {
      setResumeLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/user/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch resume data");
      }

      const result: ResumeApiResponse = await response.json();

      if (result.success) {
        const matchingResume = result.data.find(
          (resume) => resume._id === resumeId
        );
        if (matchingResume) {
          setResumeData(matchingResume);
        }
      }
    } catch (error) {
      console.error("Error fetching resume data:", error);
    } finally {
      setResumeLoading(false);
    }
  };

  useEffect(() => {
    if (resumeId && token) {
      fetchResumeData();
    }
  }, [resumeId, token]);

  const handleResumeDownload = () => {
    if (resumeData && resumeData.file.length > 0) {
      const fileUrl = resumeData.file[0].url;
      console.log(fileUrl);
      const filename = resumeData.file[0].filename;

      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const fetchApplicantDetails = async (): Promise<ApplicantData> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/create-resume/get-resume/${applicationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch applicant details");
    }

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch applicant details");
    }

    const apiData = result.data;

    // Map social links to preserve the full object structure with normalized URLs
    const validLinks = (apiData.resume?.sLink || [])
      .filter(
        (link): link is { label: string; url: string; _id: string } =>
          !!link &&
          typeof link === "object" &&
          "url" in link &&
          "label" in link &&
          "_id" in link
      )
      .map((link) => ({
        ...link,
        url: normalizeUrl(link.url), // Normalize the URL while keeping other properties
      }))
      .filter((link) => isValidUrl(link.url));

    console.log("Social Links (filtered):", validLinks); // Debug log

    return {
      resume: apiData.resume
        ? {
            _id: apiData.resume._id,
            userId: apiData.resume.userId,
            photo: apiData.resume.photo || "/placeholder.svg",
            aboutUs: apiData.resume.aboutUs,
            title: apiData.resume.title,
            firstName: apiData.resume.firstName,
            lastName: apiData.resume.lastName,
            country: apiData.resume.country,
            city: apiData.resume.city,
            email: apiData.resume.email,
            phoneNumber: apiData.resume.phoneNumber,
            skills: apiData.resume.skills,
            sLink: validLinks, // Assign the correctly typed array
            createdAt: apiData.resume.createdAt,
            updatedAt: apiData.resume.updatedAt,
          }
        : undefined,
      experiences: apiData.experiences || [],
      education: apiData.education || [],
      awardsAndHonors: apiData.awardsAndHonors || [],
      elevatorPitch: apiData.elevatorPitch || [],
    };
  };

  const {
    data: applicantData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["applicant-details", applicationId],
    queryFn: fetchApplicantDetails,
    enabled: !!token && !!applicationId,
  });

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setStatusLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/applied-jobs/${applicatUserJobId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        const allowedStatuses = [
          "selected",
          "shortlisted",
          "rejected",
          "pending",
          "interviewed",
        ];
        if (allowedStatuses.includes(newStatus)) {
          setApplicationStatus(newStatus);
        } else {
          console.error(`Invalid status: ${newStatus}`);
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Present";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const getYearsOfExperience = (experiences: Experience[] = []) => {
    if (!experiences.length) return "0+ years";

    const totalMonths = experiences.reduce((total, exp) => {
      if (!exp.startDate) return total;
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return total + Math.max(0, months);
    }, 0);

    const years = Math.floor(totalMonths / 12);
    return `${years}+ years`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-48 mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !applicantData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-600 mb-4">
                  Error: {(error as Error)?.message || "No data found"}
                </p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const {
    resume = {} as Resume,
    experiences = [],
    education = [],
    awardsAndHonors = [],
    elevatorPitch = [],
  } = applicantData;

  const hasResumeData =
    resume.firstName || resume.lastName || resume.email || resume.phoneNumber;

  if (!hasResumeData && experiences.length === 0 && education.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Applicants
          </Button>
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  No detailed profile information is available for this
                  applicant.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Applicants
        </Button>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={resume?.photo || "/placeholder.svg"}
                  alt={`${resume.firstName || ""} ${resume.lastName || ""}`}
                />
                <AvatarFallback className="text-2xl">
                  {resume.firstName?.[0] || ""}
                  {resume.lastName?.[0] || ""}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {resume.firstName} {resume.lastName}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-600 mb-4">
                      {resume.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{resume.country}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{getYearsOfExperience(experiences)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="bg-primary hover:bg-blue-700"
                    onClick={handleResumeDownload}
                    disabled={!resumeData || resumeLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {resumeLoading ? "Loading..." : "Resume"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Current Role:</span>{" "}
                    {resume.title || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Years of Experience:</span>{" "}
                    {getYearsOfExperience(experiences)}
                  </div>
                  {/* {resume.email && (
                    <div>
                      <span className="font-medium">Email:</span> {resume.email}
                    </div>
                  )}
                  {resume.phoneNumber && (
                    <div>
                      <span className="font-medium">Contact:</span>{" "}
                      {resume.phoneNumber}
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {resume.aboutUs && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed"
                // Only sanitize when description exists
                dangerouslySetInnerHTML={{
                  __html: resume.aboutUs
                    ? DOMPurify.sanitize(resume.aboutUs)
                    : "",
                }}
              />
            </CardContent>
          </Card>
        )}

        {elevatorPitch && (
          <div className="rounded-lg py-6 bg-gray-50">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Elevator Pitch
            </h2>
            <VideoPlayer
              pitchId={elevatorPitch[0]._id}
              className="w-full mx-auto"
            />
          </div>
        )}

        {experiences.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {experiences.map((exp) => (
                  <div
                    key={exp._id}
                    className="border-l-2 pl-4 border-gray-200"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {exp.jobTitle || "Unknown Position"}
                        </h3>
                        <p className="text-gray-600">
                          {exp.employer || "Unknown Employer"}
                        </p>
                      </div>
                      <div className="text-gray-500 text-sm">
                        {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                      </div>
                    </div>
                    {exp.country && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {[exp.city, exp.country].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                    {exp.jobDescription && (
                      <p className="mt-2 text-gray-700">{exp.jobDescription}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {education.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {education.map((edu) => (
                  <div
                    key={edu._id}
                    className="border-l-2 pl-4 border-gray-200"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">
                        {degreeLabels[edu.degree?.toLowerCase() || ""] ||
                          "Degree not specified"}
                      </h3>
                      <p className="text-gray-600">
                        {edu.fieldOfStudy || "Field of study not specified"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {resume.skills && resume.skills.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {awardsAndHonors.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Awards & Honors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {awardsAndHonors.map((award) => (
                  <div key={award._id}>
                    <h3 className="font-semibold">{award.title}</h3>
                    {award.description && (
                      <p className="text-gray-700 mt-1">{award.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {resume.sLink && resume.sLink.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {resume.sLink.map((link, index) => {
                  const normalizedLink = normalizeUrl(link.url);
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() =>
                        normalizedLink && window.open(normalizedLink, "_blank")
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {isValidUrl(normalizedLink)
                        ? new URL(normalizedLink).hostname
                        : link.label || "Invalid Link"}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-center gap-4 mt-6">
          <div>
            <Link href={`/messages`}>
              <Button variant="outline" className="bg-[#2B7FD0] text-white">
                Message
              </Button>
            </Link>
          </div>
          <div>
            <Select
              value={applicationStatus}
              onValueChange={handleStatusUpdate}
              disabled={statusLoading}
            >
              <SelectTrigger className="w-40 border text-blue-600 border-blue-600">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                {["pending", "shortlisted", "rejected"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Link href="/recruiter-dashboard">
            <Button variant="outline" className="bg-[#2B7FD0] text-white">
              Return To Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
