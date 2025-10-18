"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import DOMPurify from "dompurify";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

interface Recruiter {
  _id: string;
  firstName: string;
  sureName: string;
  photo?: string;
  userId: string;
}
interface CompanyId {
  _id?: string;
  cname?: string;
  clogo?: string;
  userId?: string;
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
  recruiterId?: Recruiter;
  vacancy: number;
  experience: number;
  compensation: string;
  createdAt: string;
}
interface JobCardProps {
  job: Job;
  variant: "suggested" | "list";
  className?: string;
}

export default function JobCard({ job, variant, className }: JobCardProps) {
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  const role = session?.user.role as string | undefined;
  const isUnauthed = status === "unauthenticated";
  const isCandidate = role === "candidate";
  const isRecruiterOrCompany = role === "recruiter" || role === "company";
  const canSeeApply = isUnauthed || isCandidate;

  const applicationLink = `/job-application?id=${job._id}`;

  // Card activation: clicks or keyboard (Enter / Space) navigate to job details
  const activateCard = (e?: React.MouseEvent | React.KeyboardEvent) => {
    // Keyboard handler should only activate on Enter or Space
    if (e && "key" in (e as any)) {
      const key = (e as any).key;
      if (key !== "Enter" && key !== " ") return;
      (e as React.KeyboardEvent).preventDefault();
      (e as React.KeyboardEvent).stopPropagation();
    }
    router.push(`/alljobs/${job._id}`);
  };

  const TOAST_DURATION_MS = 2200;
  const REDIRECT_DELAY_MS = 1800;

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

  const handleProgrammaticApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(applicationLink);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // postedBy data
  let postedByName = "Unknown";
  let postedByLogo = "/default-logo.png";
  let postedById = "#";
  let postedByType = "company";

  if (job.recruiterId) {
    postedByName = `${job.recruiterId.firstName} ${job.recruiterId.sureName}`;
    postedByLogo = job.recruiterId.photo || "/default-logo.png";
    postedById = job.recruiterId.userId || "#";
    postedByType = "recruiter";
  } else if (job.companyId) {
    postedByName = job.companyId.cname || "Unknown Company";
    postedByLogo = job.companyId.clogo || "/default-logo.png";
    postedById = job.companyId.userId || "#";
    postedByType = "company";
  }

  const CompanyAvatar = () => (
    <div className="relative shrink-0">
      {postedByLogo !== "/default-logo.png" ? (
        <Image
          src={postedByLogo}
          alt={
            postedByType === "recruiter" ? "Recruiter Photo" : "Company Logo"
          }
          width={56}
          height={56}
          className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-cover"
          sizes="(max-width: 768px) 40px, 48px"
        />
      ) : (
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-blue-100 text-gray-700 grid place-items-center font-semibold">
          {getInitials(postedByName)}
        </div>
      )}
    </div>
  );

  const navigateToProfile = (e: React.MouseEvent | React.KeyboardEvent) => {
    if ("stopPropagation" in e) {
      // MouseEvent or KeyboardEvent
      // @ts-ignore
      e.stopPropagation?.();
    }
    if ("key" in (e as any)) {
      const key = (e as any).key;
      if (key !== "Enter" && key !== " ") return;
    }

    const profilePath =
      postedByType === "recruiter"
        ? `/recruiters-profile/${postedById}`
        : `/companies-profile/${postedById}`;

    router.push(profilePath);
  };

  const ApplyButton = () => {
    if (!canSeeApply || isRecruiterOrCompany) return null;

    if (isUnauthed) {
      return (
        <Button
          type="button"
          variant="outline"
          onClick={handleUnauthedApply}
          className="w-full sm:w-auto text-black text-sm md:text-base font-medium border border-[#707070] px-4 py-2 rounded-lg"
        >
          Apply
        </Button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleProgrammaticApply}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            handleProgrammaticApply(e as any);
          }
        }}
        className="w-full sm:w-auto text-black text-sm md:text-base font-medium border border-[#707070] px-4 py-2 rounded-lg bg-transparent"
      >
        <span className="sr-only">Apply to {job.title}</span>
        <span aria-hidden>Apply</span>
      </button>
    );
  };

  const EmploymentBadge = () => (
    <span className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary/90 px-3 py-1 text-xs sm:text-sm text-white shadow-sm ring-1 ring-primary/30">
      {job.employement_Type || "Not Specified"}
    </span>
  );

  // SUGGESTED VARIANT
  if (variant === "suggested") {
    return (
      <Card
        role="link"
        aria-label={`${job.title} — ${postedByName}`}
        tabIndex={0}
        className={clsx(
          "hover:shadow-md transition-shadow cursor-pointer",
          "[&_*:focus-visible]:outline-none [&_*:focus-visible]:ring-2 [&_*:focus-visible]:ring-primary/60",
          className
        )}
        onClick={(e) => activateCard(e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            activateCard(e);
          }
        }}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <CompanyAvatar />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <h3 className="font-semibold text-base sm:text-lg md:text-xl text-gray-900 truncate">
                    {job.title}
                  </h3>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <EmploymentBadge />
                  </div>
                </div>
                <div className="mt-0.5">
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={(e) => navigateToProfile(e)}
                    onKeyDown={(e) => navigateToProfile(e)}
                    className="text-primary text-sm hover:underline cursor-pointer"
                  >
                    {postedByName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
              <ApplyButton />
              <div className="sm:hidden">
                <EmploymentBadge />
              </div>
            </div>

            <div
              className="prose prose-sm max-w-none text-gray-700 line-clamp-3 sm:line-clamp-2 list-item list-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(job.description),
              }}
            />

            <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-gray-700">
              <div className="bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg">
                <span
                  role="link"
                  tabIndex={0}
                  onClick={(e) => navigateToProfile(e)}
                  onKeyDown={(e) => navigateToProfile(e)}
                  className="text-[#707070] cursor-pointer"
                >
                  {postedByName}
                </span>
              </div>
              <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg">
                <span className="truncate">{job.salaryRange}</span>
              </div>
              <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg">
                <MapPin className="h-4 w-4 mr-1" aria-hidden />
                <span className="truncate">{job.location}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // LIST VARIANT
  return (
    <Card
      role="link"
      aria-label={`${job.title} — ${postedByName}`}
      tabIndex={0}
      className={clsx(
        "hover:shadow-md transition-shadow cursor-pointer",
        "[&_*:focus-visible]:outline-none [&_*:focus-visible]:ring-2 [&_*:focus-visible]:ring-primary/60",
        className
      )}
      onClick={(e) => activateCard(e)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          activateCard(e);
        }
      }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <CompanyAvatar />

            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg md:text-xl text-gray-900 truncate">
                    {job.title}
                  </h3>
                  <div>
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={(e) => navigateToProfile(e)}
                      onKeyDown={(e) => navigateToProfile(e)}
                      className="text-primary text-sm hover:underline cursor-pointer"
                    >
                      {postedByName}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full sm:w-auto">
                  <ApplyButton />
                </div>
              </div>

              <div className="mt-2 sm:mt-3">
                <div
                  className="text-gray-700 text-sm sm:text-[15px] leading-relaxed line-clamp-3 sm:line-clamp-2 prose prose-sm max-w-none text-start list-item list-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(job.description),
                  }}
                />
              </div>

              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm text-gray-700">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg">
                    <span className="truncate">{job.salaryRange}</span>
                  </div>
                  <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg">
                    <MapPin className="h-4 w-4 mr-1" aria-hidden />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg capitalize">
                    {job.employement_Type || "Not Specified"}
                  </div>
                </div>

                <div className="text-[#059c05] font-semibold">
                  {formatDate(job.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
