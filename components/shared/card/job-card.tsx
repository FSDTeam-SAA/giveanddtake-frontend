"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import DOMPurify from "dompurify";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner"; // ✅ correct Sonner import
import { useState } from "react";

interface CompanyId {
  _id?: string;
  cname?: string;
  clogo?: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  employement_Type?: string;
  companyId?: CompanyId;
  vacancy: number;
  experience: number;
  compensation: string;
  createdAt: string;
}

interface JobCardProps {
  job: Job;
  onSelect: () => void;
  variant: "suggested" | "list";
}

export default function JobCard({ job, onSelect, variant }: JobCardProps) {
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const role = session?.user.role as string | undefined;
  const isUnauthed = status === "unauthenticated";
  const isCandidate = role === "candidate";
  const isRecruiterOrCompany = role === "recruiter" || role === "company";

  // Show Apply for: unauthenticated OR candidate
  // Hide Apply for: recruiter/company (and any other authenticated non-candidate roles)
  const canSeeApply = isUnauthed || isCandidate;

  const applicationLink = `/job-application?id=${job._id}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

const TOAST_DURATION_MS = 2200;   // how long the toast stays
const REDIRECT_DELAY_MS = 1800; 

const handleUnauthedApply = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
  if (isRedirecting) return;

  setIsRedirecting(true);

  toast("Please log in as a candidate to apply", {
    description: "You’ll be redirected to sign in.",
    duration: TOAST_DURATION_MS,
  });

  // let the toast sit for a moment before redirecting
  setTimeout(() => {
    // default provider & callback back to the application page
    void signIn(undefined, { callbackUrl: applicationLink });
  }, REDIRECT_DELAY_MS);
};

  const getCompanyInitials = (title: string) => {
    return title
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays === 1) return `1 day ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    if (diffDays < 30)
      return `${Math.ceil(diffDays / 7)} week${
        Math.ceil(diffDays / 7) === 1 ? "" : "s"
      } ago`;
    return `${Math.ceil(diffDays / 30)} month${
      Math.ceil(diffDays / 30) === 1 ? "" : "s"
    } ago`;
  };

  const ApplyButton = () => {
    if (!canSeeApply || isRecruiterOrCompany) return null;

    // Unauthenticated: show button -> toast + redirect
    if (isUnauthed) {
      return (
        <Button
          variant="outline"
          onClick={handleUnauthedApply}
          className="text-black text-sm md:text-base font-normal border border-[#707070] px-4 py-[2px] md:py-2 rounded-lg"
        >
          Apply
        </Button>
      );
    }

    // Candidate: normal link to application page
    return (
      <Link href={applicationLink}>
        <Button
          variant="outline"
          className="text-black text-sm md:text-base font-normal border border-[#707070] px-4 py-[2px] md:py-2 rounded-lg"
        >
          Apply
        </Button>
      </Link>
    );
  };

  if (variant === "suggested") {
    return (
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="grid grid-cols-8">
            <div className="col-span-1 hidden md:block">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-[50px] h-[50px] flex items-center justify-center">
                  {job.companyId ? (
                    <Image
                      src={job.companyId.clogo || "/default-logo.png"}
                      alt={job.companyId.cname || "Company Logo"}
                      width={50}
                      height={50}
                      className="w-[50px] h-[50px] object-cover"
                    />
                  ) : (
                    <div className="text-xl font-bold text-gray-600">
                      {getCompanyInitials(job.title)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-8 md:col-span-7">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    {job.title}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <ApplyButton />
                  <Button className="bg-primary hover:bg-blue-700 text-white text-sm px-4 md:py-2 rounded-lg">
                    {job.employement_Type || "Not Specified"}
                  </Button>
                </div>
              </div>
              <div className="my-2">
                <div
                  className="text-gray-600 text-sm line-clamp-2 prose prose-sm max-w-none text-start"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(job.description),
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="bg-[#E9ECFC] p-2 rounded-lg">
                  {job.companyId ? (
                    <Link
                      href={`/companies-profile/${job.companyId._id || "#"}`}
                      className="text-[#707070] text-[16px] font-normal"
                    >
                      {job.companyId.cname || "Unknown Company"}
                    </Link>
                  ) : (
                    <span className="text-[#707070] text-[16px] font-normal">
                      Unknown Company
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-[#E9ECFC] p-2 rounded-lg">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {job.salaryRange}
                </div>
                <div className="flex items-center bg-[#E9ECFC] p-2 rounded-lg">
                  <MapPin className="h-4 w-4 mr-1" />
                  {job.location}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="grid grid-cols-8">
          <div className="col-span-1">
            <div className="w-[50px] h-[50px] flex items-center justify-center">
              {job.companyId ? (
                <Image
                  src={job.companyId.clogo || "/default-logo.png"}
                  alt={job.companyId.cname || "Company Logo"}
                  width={50}
                  height={50}
                  className="w-[50px] h-[50px] object-cover"
                />
              ) : (
                <div className="text-xl font-bold text-gray-600">
                  {getCompanyInitials(job.title)}
                </div>
              )}
            </div>
          </div>
          <div className="col-span-7">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  {job.title}
                </h3>
                <div>
                  {job.companyId ? (
                    <Link
                      href={`/companies-profile/${job.companyId._id || "#"}`}
                      className="text-primary text-[14px] font-normal hover:underline"
                    >
                      {job.companyId.cname || "Unknown Company"}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-[16px] font-normal">
                      Unknown Company
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <ApplyButton />
              </div>
            </div>
            <div className="py-4">
              <div
                className="text-gray-600 text-sm line-clamp-2 prose prose-sm max-w-none text-start"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(job.description),
                }}
              />
            </div>
            <div className="flex flex-wrap justify-between items-center gap-6 text-sm text-gray-600">
              <div className="flex flex-wrap justify-between gap-6">
                <div className="flex items-center bg-[#E9ECFC] p-2 rounded-lg">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {job.salaryRange}
                </div>
                <div className="flex items-center bg-[#E9ECFC] p-2 rounded-lg">
                  <MapPin className="h-4 w-4 mr-1" />
                  {job.location}
                </div>
                <div className="flex items-center bg-[#E9ECFC] p-2 rounded-lg capitalize">
                  {job.employement_Type || "Not Specified"}
                </div>
              </div>
              <div className="text-[#059c05] text-sm text-bold">
                {formatDate(job.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
