"use client";

import Link from "next/link";
import {
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaUpwork,
  FaGlobe, // 🌐 for "Others"
} from "react-icons/fa6";
import { SiFiverr } from "react-icons/si"; // ✅ Official Fiverr icon

// Supported platforms + icons
const socialIcons = {
  LinkedIn: { icon: <FaLinkedin /> },
  Twitter: { icon: <FaTwitter /> },
  Upwork: { icon: <FaUpwork /> },
  Facebook: { icon: <FaFacebook /> },
  TikTok: { icon: <FaTiktok /> },
  Instagram: { icon: <FaInstagram /> },
  Fiverr: { icon: <SiFiverr /> },
  Others: { icon: <FaGlobe /> }, // 🌐 Fallback for unknowns
} as const;

type SocialLabel = keyof typeof socialIcons;

// Type guard to narrow arbitrary strings to supported labels
function isSocialLabel(label: string): label is SocialLabel {
  return label in socialIcons;
}

interface SocialLinksProps {
  sLink?: {
    label: string; // loose input from upstream
    url?: string;
    _id?: string;
  }[];
}

// Add https:// if missing, and quick validity check
function normalizeUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const withProto =
    /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    // Will throw if invalid
    new URL(withProto);
    return withProto;
  } catch {
    return null;
  }
}

export default function SocialLinks({ sLink = [] }: SocialLinksProps) {
  // Build a map only for supported labels; everything else goes into “Others”
  const linkMap = new Map<SocialLabel, string>();

  for (const item of sLink) {
    const url = normalizeUrl(item.url);
    if (!url) continue;

    if (isSocialLabel(item.label)) {
      linkMap.set(item.label, url);
    } else if (!linkMap.has("Others")) {
      // Anything unknown → treat as "Others" (keep the first)
      linkMap.set("Others", url);
    }
  }

  const baseClasses =
    "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border-[.52px] border-[#9EC7DC] rounded-md text-xl md:text-2xl transition-all duration-300 ease-in-out text-[#1877F2] hover:text-blue-600 hover:border-blue-600 hover:shadow-lg hover:scale-105";

  // Only render icons that have URLs
  const entriesWithUrls = Object.entries(socialIcons).filter(([label]) =>
    linkMap.has(label as SocialLabel)
  );

  if (entriesWithUrls.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {entriesWithUrls.map(([label, { icon }]) => {
        const typedLabel = label as SocialLabel;
        const url = linkMap.get(typedLabel)!;

        return (
          <Link
            key={typedLabel}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={baseClasses}
            title={typedLabel}
          >
            {icon}
          </Link>
        );
      })}
    </div>
  );
}
