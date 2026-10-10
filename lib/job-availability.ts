export interface JobAvailabilityInput {
  deadline?: string | null;
  expiryDate?: string | null;
  publishDate?: string | null;
  status?: string;
  displayStatus?: string;
  canApply?: boolean;
  applicationClosedReason?: string | null;
  arcrivedJob?: boolean;
  adminApprove?: boolean;
  jobApprove?: string;
}

export function getJobAvailability(job: JobAvailabilityInput | undefined, now = Date.now()) {
  if (!job) return { canApply: false, status: "loading", label: "Checking...", message: "Checking job availability..." };
  const deadline = job.deadline ?? job.expiryDate;
  const expiry = deadline ? Date.parse(deadline) : undefined;
  let status = job.displayStatus || "published";
  if (job.arcrivedJob) status = "archived";
  else if (expiry !== undefined && expiry <= now) status = "expired";
  else if (job.jobApprove === "denied") status = "denied";
  else if (job.adminApprove === false || (job.jobApprove && job.jobApprove !== "approved")) status = "pending";
  else if (job.publishDate && Date.parse(job.publishDate) > now) status = "scheduled";
  const canApply = status === "published" && job.status !== "deactivate" &&
    job.canApply !== false && (expiry === undefined || Number.isFinite(expiry));
  if (status === "published" && !canApply) status = "closed";
  const label = status === "pending" ? "Pending approval" : status.charAt(0).toUpperCase() + status.slice(1);
  const message = canApply ? null : status === "expired"
    ? "This job has expired and is no longer accepting applications."
    : job.applicationClosedReason || (status === "scheduled"
      ? "Applications for this job are not open yet."
      : "This job is not currently accepting applications.");
  return { canApply, status, label, message };
}
