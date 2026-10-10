import type { Metadata } from "next";
import { getJobAvailability, type JobAvailabilityInput } from "@/lib/job-availability";
import { jobShareUrl } from "@/lib/job-sharing";

interface PreviewJob extends JobAvailabilityInput {
  title?: string;
  description?: string;
  location?: string;
  companyId?: { cname?: string } | string | null;
}

// Metadata must be plain text, even when the job description is rich HTML.
function plainText(value: unknown): string {
  if (typeof value !== "string") return "";
  const entities: Record<string, string> = {
    amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
  };
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, code: string) => {
      if (!code.startsWith("#")) return entities[code.toLowerCase()] || entity;
      const point = code[1].toLowerCase() === "x"
        ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
        ? String.fromCodePoint(point) : " ";
    })
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit - 3).trimEnd()}...` : text;
}

export async function getJobMetadata(
  jobId: string,
  apiBase = process.env.NEXT_PUBLIC_BASE_URL,
): Promise<Metadata> {
  const url = jobShareUrl(jobId);
  let job: PreviewJob | null = null;
  if (apiBase && /^[a-f\d]{24}$/i.test(jobId)) {
    try {
      // Read the current approval/title without a session or a stale server cache.
      const response = await fetch(`${apiBase.replace(/\/+$/, "")}/jobs/${jobId}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const result = await response.json();
        if (result?.success && result.data && typeof result.data === "object") {
          job = result.data as PreviewJob;
        }
      }
    } catch {
      // A preview lookup failure must not prevent the job page from rendering.
    }
  }

  const approved = job && job.adminApprove !== false &&
    (!job.jobApprove || job.jobApprove === "approved");
  const jobTitle = approved && job ? plainText(job.title) : "";
  const title = shorten(jobTitle || "Job unavailable", 200);
  let description = "This job is currently unavailable. Browse more opportunities on EVPitch.";
  if (jobTitle && job) {
    const company = typeof job.companyId === "object" && job.companyId
      ? plainText(job.companyId.cname) : "";
    const context = [company, plainText(job.location)].filter(Boolean).join(" - ");
    const availability = getJobAvailability(job);
    description = shorten([
      !availability.canApply ? availability.message : null,
      context,
      plainText(job.description) || `View ${title} on EVPitch.`,
    ].filter(Boolean).join(" "), 200);
  }

  const image = {
    url: "https://evpitch.com/assets/evp-logo.jpg",
    width: 1106,
    height: 426,
    alt: "Elevator Video Pitch",
  };
  return {
    title: { absolute: `${title} | EVPitch` },
    description,
    alternates: { canonical: url },
    ...(!jobTitle ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: "Elevator Video Pitch",
      type: "website",
      locale: "en_GB",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}
