import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://evpitch.com"
).replace(/\/+$/, "");
export const SITE_NAME = "Elevator Video Pitch©";

export const PUBLIC_PAGE_SEO = {
  "/": {
    title: "Get Hired With a 30-Second Video Pitch",
    description: "Connect with candidates, recruiters and companies through Elevator Video Pitch. Showcase your skills, discover opportunities and find talent.",
  },
  "/about-us": {
    title: "About Us",
    description: "Learn how Elevator Video Pitch connects candidates, recruiters and companies through video pitches and new career opportunities.",
  },
  "/contact-us": {
    title: "Contact Us",
    description: "Contact the Elevator Video Pitch team for help with your account, recruitment, job postings and video pitches.",
  },
  "/alljobs": {
    title: "All Jobs",
    description: "Browse curated job openings across industries and locations. Use smart filters to find roles that match your skills, experience, and career goals.",
  },
  "/blogs": {
    title: "Blogs",
    description: "Explore Elevator Video Pitch guides, career advice and recruitment insights, including tips for creating your video pitch and using your account.",
  },
  "/faq": {
    title: "Frequently Asked Questions",
    description: "Find answers to common questions about Elevator Video Pitch, including accounts, video pitches, job applications and recruitment.",
  },
  "/user-pricing": {
    title: "Candidate Pricing",
    description: "Explore Elevator Video Pitch candidate plans and account options to support your job search and showcase your skills.",
  },
  "/recruiter-pricing": {
    title: "Recruiter Pricing",
    description: "Explore Elevator Video Pitch job posting packages for recruiters and find the right option for your hiring needs.",
  },
  "/company-pricing": {
    title: "Company Pricing",
    description: "Explore Elevator Video Pitch job posting packages for companies and connect your opportunities with suitable candidates.",
  },
  "/privacy-policy": {
    title: "Privacy Policy",
    description: "Read the Elevator Video Pitch privacy policy to understand how your personal information is collected, used and protected.",
  },
  "/terms-condition": {
    title: "Terms & Conditions",
    description: "Read the terms and conditions for using Elevator Video Pitch, including its website, accounts and recruitment services.",
  },
} as const;

export type PublicPagePath = keyof typeof PUBLIC_PAGE_SEO;

export function createPageMetadata(path: string, title: string, description: string): Metadata {
  const url = `${SITE_URL}${path}`;
  const brandedTitle = path === "/"
    ? `${SITE_NAME} | ${title}`
    : `${title} | ${SITE_NAME}`;
  return {
    title: { absolute: brandedTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: brandedTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
    },
  };
}

export function getPublicPageMetadata(path: PublicPagePath): Metadata {
  const page = PUBLIC_PAGE_SEO[path];
  return createPageMetadata(path, page.title, page.description);
}

export const INTERNAL_PAGE_TITLES = {
  "/account": "Account",
  "/add-job": "Post a Job",
  "/all-users": "Search People",
  "/all": "Search",
  "/applicant-details": "Applicant Details",
  "/applicants": "Applicants",
  "/applied-jobs": "Applied Jobs",
  "/archived-jobs": "Archived Jobs",
  "/bookmarks": "Bookmarks",
  "/candidate-list": "Candidate List",
  "/create-company": "Create Company",
  "/elevator-video-pitch": "My Profile",
  "/forgot-password": "Forgot Password",
  "/internal-recruiter-list": "Internal Recruiter List",
  "/job-application": "Job Application",
  "/jobs-success": "Job Posting Confirmation",
  "/manage-jobs": "Manage Jobs",
  "/messages": "Messages",
  "/notifications": "Notifications",
  "/payment": "Payment",
  "/recruiter-dashboard": "Recruiter Dashboard",
  "/security-questions": "Security Questions",
  "/single-job": "Manage Job",
  "/success": "Payment Confirmation",
  "/test": "Test",
  "/verify": "Verify Account",
} as const;

export function getInternalPageMetadata(title: string): Metadata {
  return {
    title: { absolute: `${title} | ${SITE_NAME}` },
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  };
}

/** Keep browser navigation from replacing server-generated SEO titles. */
export function hasServerPageTitle(pathname: string): boolean {
  return pathname in PUBLIC_PAGE_SEO ||
    ["/blogs/", "/blog-details/", "/pages/", "/alljobs/"].some((prefix) => pathname.startsWith(prefix)) ||
    Object.keys(INTERNAL_PAGE_TITLES).some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Plain text for metadata; never place article HTML into title/description tags. */
export function metadataText(value: unknown): string {
  if (typeof value !== "string") return "";
  const entities: Record<string, string> = {
    amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", copy: "©",
  };
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp|copy);/gi, (entity, code: string) => {
      if (!code.startsWith("#")) return entities[code.toLowerCase()] || entity;
      const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
        ? String.fromCodePoint(point) : " ";
    })
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function metadataExcerpt(value: unknown, fallback: string, limit = 160): string {
  const text = metadataText(value) || fallback;
  return text.length > limit ? `${text.slice(0, limit - 3).trimEnd()}...` : text;
}
