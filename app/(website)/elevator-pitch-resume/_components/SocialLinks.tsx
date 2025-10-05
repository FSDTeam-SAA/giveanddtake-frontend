"use client";

import Link from "next/link";
import {
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaUpwork,
} from "react-icons/fa6";

// Supported platforms + icons
const socialIcons = {
  LinkedIn: { icon: <FaLinkedin /> },
  Twitter: { icon: <FaTwitter /> },
  Upwork: { icon: <FaUpwork /> },
  Facebook: { icon: <FaFacebook /> },
  TikTok: { icon: <FaTiktok /> },
  Instagram: { icon: <FaInstagram /> },
} as const;

type SocialLabel = keyof typeof socialIcons;

// Type guard to narrow arbitrary strings to our supported labels
function isSocialLabel(label: string): label is SocialLabel {
  return label in socialIcons;
}

interface SocialLinksProps {
  // Accept the loose upstream shape (don't reuse the upstream SLinkItem name)
  sLink?: {
    label: string;   // note: loose
    url?: string;
    _id?: string;
  }[];
}

export default function SocialLinks({ sLink = [] }: SocialLinksProps) {
  // Build a map only for supported labels, ignoring unknown ones safely
  const linkMap = new Map<SocialLabel, string>();
  for (const item of sLink) {
    if (isSocialLabel(item.label)) {
      linkMap.set(item.label, item.url ?? "");
    }
  }

  const baseClasses =
    "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border-[.52px] border-[#9EC7DC] rounded-md text-xl md:text-2xl transition-all duration-300 ease-in-out";

  return (
    <div className="flex gap-3 mt-4">
      {Object.entries(socialIcons).map(([label, { icon }]) => {
        const typedLabel = label as SocialLabel;
        const url = linkMap.get(typedLabel);

        return url ? (
          <Link
            key={typedLabel}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseClasses} text-[#1877F2] hover:text-blue-600 hover:border-blue-600 hover:shadow-lg hover:scale-105`}
          >
            {icon}
          </Link>
        ) : (
          <span
            key={typedLabel}
            className={`${baseClasses} text-gray-400 border-gray-300 opacity-50 cursor-not-allowed`}
            aria-disabled="true"
            title={`${typedLabel} link not provided`}
          >
            {icon}
          </span>
        );
      })}
    </div>
  );
}
