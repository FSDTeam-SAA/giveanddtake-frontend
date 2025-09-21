"use client";

import {
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaUpwork,
} from "react-icons/fa6";
import Link from "next/link";

const socialIcons: Record<string, { icon: JSX.Element }> = {
  LinkedIn: { icon: <FaLinkedin /> },
  Twitter: { icon: <FaTwitter /> },
  Upwork: { icon: <FaUpwork /> },
  Facebook: { icon: <FaFacebook /> },
  TikTok: { icon: <FaTiktok /> },
  Instagram: { icon: <FaInstagram /> },
};

interface SocialLinksProps {
  sLink?: {
    label: string;
    url?: string; // ✅ fixed
    _id: string;
  }[];
}

export default function SocialLinks({ sLink = [] }: SocialLinksProps) {
  const linkMap = new Map(sLink.map((link) => [link.label, link.url ?? ""]));

  return (
    <div className="flex gap-3 mt-4">
      {Object.entries(socialIcons).map(([label, { icon }]) => {
        const url = linkMap.get(label);

        const baseClasses =
          "w-10 h-10 flex items-center justify-center border-[.52px] border-[#9EC7DC] rounded-md text-2xl transition-all duration-300 ease-in-out";

        return url ? (
          <Link
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseClasses} text-[#1877F2] hover:text-blue-600 hover:border-blue-600 hover:shadow-lg hover:scale-105`}
          >
            {icon}
          </Link>
        ) : (
          <span
            key={label}
            className={`${baseClasses} text-gray-400 border-gray-300 opacity-50 cursor-not-allowed`}
          >
            {icon}
          </span>
        );
      })}
    </div>
  );
}
