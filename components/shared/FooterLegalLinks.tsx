"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface PublishedPage {
  _id: string;
  type: string;
  title: string;
  showInFooter?: boolean;
  isSystem?: boolean;
}

/** Built-in pages have their own dedicated routes; everything else lives under /pages/:slug. */
const BUILT_IN_ROUTES: Record<string, string> = {
  about: "/about-us",
  privacy: "/privacy-policy",
  terms: "/terms-condition",
};

const hrefFor = (page: PublishedPage) =>
  BUILT_IN_ROUTES[page.type] ?? `/pages/${page.type}`;

const fetchFooterPages = async (): Promise<PublishedPage[]> => {
  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_BASE_URL}/content/published`
  );
  return data?.data ?? [];
};

export function FooterLegalLinks() {
  const { data } = useQuery({
    queryKey: ["content", "footer-links"],
    queryFn: fetchFooterPages,
    staleTime: 5 * 60 * 1000,
  });

  const links = (data ?? []).filter((p) => p.showInFooter);

  if (links.length === 0) return null;

  return (
    <nav className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
      {links.map((page) => (
        <Link
          key={page._id}
          href={hrefFor(page)}
          className="text-white/70 hover:text-white hover:underline"
        >
          {page.title}
        </Link>
      ))}
    </nav>
  );
}
