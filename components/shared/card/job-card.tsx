"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Sparkles } from "lucide-react";
import DOMPurify from "dompurify";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { useState, MouseEvent, KeyboardEvent } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

import { getMyResume } from "@/lib/api-service"; // <-- adjust path as needed

interface Recruiter {
  _id: string;
  firstName: string;
  sureName: string;
  slug?: string;
  photo?: string;
  userId: string;
}
interface CompanyId {
  _id?: string;
  cname?: string;
  slug?: string;
  clogo?: string;
  userId?: string;
}
interface Job {
  _id: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  location_Type?: string;
  shift: string;
  employement_Type?: string;
  companyId?: CompanyId;
  recruiterId?: Recruiter;
  vacancy: number;
  experience: number;
  compensation: string;
  createdAt: string;
  applicantCount?: number;
  counter?: number;
}

interface JobFitInsight {
  score: number;
  verdictCode: string;
  verdictMessage: string;
  aiSummary?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  jobSkills?: string[];
  profileSkills?: string[];
}
interface JobCardProps {
  job: Job;
  variant: "suggested" | "list";
  className?: string;
  applicantCount?: number;
}

const FIT_THEMES: Record<
  string,
  { bg: string; text: string; chip: string; accent: string }
> = {
  STRONG_MATCH: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    chip: "bg-white/70 text-emerald-700",
    accent: "text-emerald-500",
  },
  PARTIAL_MATCH: {
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    chip: "bg-white/70 text-cyan-700",
    accent: "text-cyan-500",
  },
  MISSING_SOME: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    chip: "bg-white/70 text-amber-700",
    accent: "text-amber-500",
  },
  MISSING_MOST: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    chip: "bg-white/70 text-rose-700",
    accent: "text-rose-500",
  },
};

export default function JobCard({
  job,
  variant,
  className,
  applicantCount,
}: JobCardProps) {
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [fitExpanded, setFitExpanded] = useState(false);
  const [jobFit, setJobFit] = useState<JobFitInsight | null>(null);
  const [jobFitLoading, setJobFitLoading] = useState(false);
  const [jobFitError, setJobFitError] = useState<string | null>(null);
  const router = useRouter();

  const role = (session?.user as any)?.role as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;
  const token = session?.accessToken as string | undefined;

  const isUnauthed = status === "unauthenticated";
  const isCandidate = role === "candidate";
  const isRecruiterOrCompany = role === "recruiter" || role === "company";
  const canSeeApply = isUnauthed || isCandidate;

  const applicationLink = `/job-application?id=${job._id}`;

  const derivedApplicantCount =
    typeof applicantCount === "number"
      ? applicantCount
      : job.applicantCount ?? (job as any)?.counter;

  const applicantLabel =
    typeof derivedApplicantCount === "number"
      ? `${derivedApplicantCount} ${
          derivedApplicantCount === 1 ? "applicant" : "applicants"
        }`
      : null;

  const fitTheme =
    FIT_THEMES[jobFit?.verdictCode ?? ""] ??
    FIT_THEMES.PARTIAL_MATCH ??
    FIT_THEMES.STRONG_MATCH;

  // ===== Resume query (only if role is candidate) =====
  // NOTE: We need elevatorPitch presence (array length > 0) to allow applying.
  const { data: myresume, isLoading: resumeLoading } = useQuery({
    queryKey: ["my-resume", userId],
    queryFn: getMyResume,
    select: (res) => res?.data, // expects { resume, experiences, education, awardsAndHonors, elevatorPitch }
    enabled: isCandidate && !!userId,
    staleTime: 60_000,
  });

  // ===== Card activation: clicks or keyboard (Enter / Space) navigate to job details =====
  const activateCard = (e?: MouseEvent | KeyboardEvent) => {
    if (e && "key" in e) {
      const key = (e as KeyboardEvent).key;
      if (key !== "Enter" && key !== " ") return;
      (e as KeyboardEvent).preventDefault();
      (e as KeyboardEvent).stopPropagation();
    }
    router.push(`/alljobs/${job._id}`);
  };

  const TOAST_DURATION_MS = 2200;
  const REDIRECT_DELAY_MS = 2000; // redirect after 2 sec

  // ===== Apply handlers =====
  const handleUnauthedApply = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isRedirecting) return;

    setIsRedirecting(true);

    toast("Please log in as a candidate to apply", {
      description: "You’ll now be redirected to sign in.",
      duration: TOAST_DURATION_MS,
    });

    setTimeout(() => {
      void signIn(undefined, { callbackUrl: applicationLink });
    }, 1800);
  };

  const handleCandidateApply = (e: MouseEvent) => {
    e.stopPropagation();
    if (resumeLoading || isRedirecting) return;

    // ——— EVP GATING LOGIC ———
    const hasEVP =
      Array.isArray(myresume?.elevatorPitch) &&
      myresume!.elevatorPitch.length > 0;

    if (!hasEVP) {
      // Block apply → tell user and redirect to EVP page
      setIsRedirecting(true);
      toast("Elevator Pitch Required", {
        description:
          "You need to have an Elevator Pitch video to apply for jobs. Redirecting you to set it up.",
        duration: TOAST_DURATION_MS,
      });

      setTimeout(() => {
        router.push("/elevator-video-pitch");
      }, REDIRECT_DELAY_MS);
      return;
    }

    // Has EVP → proceed to application
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

  // ===== postedBy data =====
  let postedByName = "Unknown";
  let postedByLogo = "/default-logo.png";
  let postedById = "#";
  let postedByType: "company" | "recruiter" = "company";

  if (job.recruiterId) {
    postedByName = `${job.recruiterId.firstName} ${job.recruiterId.sureName}`;
    postedByLogo = job.recruiterId.photo || "/default-logo.png";
    postedById = job.recruiterId.slug || "#";
    postedByType = "recruiter";
  } else if (job.companyId) {
    postedByName = job.companyId.cname || "Unknown Company";
    postedByLogo = job.companyId.clogo || "/default-logo.png";
    postedById = job.companyId.slug || "#";
    postedByType = "company";
  }

  const CompanyAvatar = () => (
    <div className="relative shrink-0">
      {postedByLogo !== "/default-logo.png" ? (
        <Image
          src={postedByLogo}
          alt={postedByType === "recruiter" ? "Recruiter Photo" : "Company Logo"}
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

  const navigateToProfile = (e: MouseEvent | KeyboardEvent) => {
    // Stop bubbling from card activation
    // @ts-ignore - TS narrows imperfectly across union
    e.stopPropagation?.();

    if ("key" in e) {
      const key = (e as KeyboardEvent).key;
      if (key !== "Enter" && key !== " ") return;
    }

    const profilePath =
      postedByType === "recruiter"
        ? `/rp/${postedById}`
        : `/cmp/${postedById}`;

    router.push(profilePath);
  };

  const handleFetchJobFit = async () => {
    if (jobFit || jobFitLoading) return;
    if (!isCandidate) {
      setJobFitError("Profile fit is available for candidates only.");
      setFitExpanded(true);
      return;
    }
    if (!token) {
      setJobFitError("Sign in to check your profile fit for this role.");
      setFitExpanded(true);
      return;
    }
    try {
      setJobFitLoading(true);
      setJobFitError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${job._id}/ai-fit`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Unable to fetch fit insight");
      }
      const payload = await response.json();
      if (payload?.data) {
        setJobFit(payload.data as JobFitInsight);
      } else {
        setJobFitError("No insight available for this position right now.");
      }
    } catch (error: any) {
      console.warn("[job-fit] fetch failed", error);
      setJobFitError(
        error?.message ?? "Something went wrong while checking profile fit."
      );
    } finally {
      setJobFitLoading(false);
    }
  };

  const handleFitBadgeClick = () => {
    if (!jobFit && !jobFitLoading) {
      void handleFetchJobFit();
    }
    setFitExpanded((prev) => !prev);
  };

  const renderFitBadge = () => {
    if (!isCandidate) return null;
    if (jobFitLoading) {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-500 animate-pulse">
          <Sparkles className="h-4 w-4 text-slate-400" />
          Calculating your profile fit...
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleFitBadgeClick();
        }}
        className={`flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium transition ${
          jobFit ? `${fitTheme.bg} ${fitTheme.text}` : "bg-slate-100 text-slate-700"
        } hover:opacity-90`}
      >
        <Sparkles className={`h-4 w-4 ${fitTheme.accent}`} />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wide text-gray-500">
            Profile fit
          </span>
          <span className="text-sm font-semibold">
            {jobFit
              ? jobFit.verdictMessage
              : jobFitError
              ? "Fit unavailable"
              : "Check your fit"}
          </span>
        </div>
        {jobFit && (
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${fitTheme.chip}`}
          >
            {Math.round(jobFit.score)}%
          </span>
        )}
        {!jobFit && !jobFitLoading && (
          <span className="ml-auto text-xs text-primary underline">
            View details
          </span>
        )}
      </button>
    );
  };

  const renderApplicantBadge = () => {
    if (typeof derivedApplicantCount !== "number") return null;
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700">
        <Users className="h-4 w-4 text-slate-500" />
        <span className="font-medium">{applicantLabel}</span>
      </div>
    );
  };

  const renderSkillPills = (title: string, items: string[], emptyText: string) => (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.slice(0, 12).map((skill) => (
            <span
              key={`${title}-${skill}`}
              className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-700"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );

  const renderFitDetailsPanel = () => {
    if (!isCandidate) return null;
    return (
      <AnimatePresence initial={false}>
        {fitExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white/70 p-4 shadow-inner"
          >
            {jobFitLoading && (
              <p className="text-sm text-muted-foreground">Checking fit...</p>
            )}
            {jobFitError && (
              <p className="text-sm text-rose-600">{jobFitError}</p>
            )}
            {jobFit && !jobFitLoading && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Verdict
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {jobFit.verdictMessage}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Score
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(jobFit.score)}%
                    </p>
                  </div>
                </div>
                {jobFit.aiSummary && (
                  <div className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-gray-700">
                    <strong className="block text-primary mb-1">
                      AI insight
                    </strong>
                    <p>{jobFit.aiSummary}</p>
                  </div>
                )}
                {renderSkillPills(
                  "Matched skills",
                  jobFit.matchedSkills ?? [],
                  "No overlapping skills detected yet."
                )}
                {renderSkillPills(
                  "Suggested skills to add",
                  jobFit.missingSkills ?? [],
                  "Great news! You already cover all highlighted requirements."
                )}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Ready to continue? You can apply right from here too.
                  </p>
                  <div className="flex gap-2 self-start sm:self-auto">
                    <Button
                      variant="outline"
                      className="text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFitBadgeClick();
                      }}
                    >
                      Hide details
                    </Button>
                    <ApplyButton />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const ApplyButton = () => {
    if (!canSeeApply || isRecruiterOrCompany) return null;

    // Unauthenticated users → sign in flow
    if (isUnauthed) {
      return (
        <Button
          type="button"
          variant="outline"
          onClick={handleUnauthedApply}
          disabled={isRedirecting}
          className="w-full sm:w-auto text-black text-sm md:text-base font-medium border border-[#707070] px-4 py-2 rounded-lg"
        >
          {isRedirecting ? "Redirecting…" : "Apply"}
        </Button>
      );
    }

    // Candidate (authenticated)
    return (
      <button
        type="button"
        onClick={handleCandidateApply}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            handleCandidateApply(e as unknown as MouseEvent);
          }
        }}
        disabled={resumeLoading || isRedirecting}
        className={clsx(
          "w-full sm:w-auto text-black text-sm md:text-base font-medium border border-[#707070] px-4 py-2 rounded-lg bg-transparent",
          (resumeLoading || isRedirecting) && "opacity-60 cursor-not-allowed"
        )}
      >
        <span className="sr-only">Apply to {job.title}</span>
        <span aria-hidden>
          {resumeLoading ? "Checking…" : isRedirecting ? "Redirecting…" : "Apply"}
        </span>
      </button>
    );
  };

  const EmploymentBadge = () => (
    <span className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary/90 px-3 py-1 text-xs sm:text-sm text-white shadow-sm ring-1 ring-primary/30">
      {job.employement_Type || "Not Specified"}
    </span>
  );

  // ===== SUGGESTED VARIANT =====
  if (variant === "suggested") {
    return (
      <>
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

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {renderFitBadge()}
              {renderApplicantBadge()}
            </div>
            {renderFitDetailsPanel()}

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
    </>
  );
}

  // ===== LIST VARIANT =====
  return (
    <>
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

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w/full sm:w-auto">
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

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {renderFitBadge()}
                {renderApplicantBadge()}
              </div>
              {renderFitDetailsPanel()}

              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm text-gray-700">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg">
                    <MapPin className="h-4 w-4 mr-1" aria-hidden />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg capitalize">
                    {job.employement_Type || "Not Specified"}
                  </div>

                  {job.location_Type && (
                    <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg">
                      <span className="truncate">
                        {job.location_Type
                          ? job.location_Type.charAt(0).toUpperCase() +
                            job.location_Type.slice(1)
                          : ""}
                      </span>
                    </div>
                  )}
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
    </>
  );
}
