import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeaders from "@/components/shared/PageHeaders";

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL;
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://evpitch.com"
).replace(/\/+$/, "");

interface ContentDoc {
  _id?: string;
  type: string;
  title: string;
  description: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Server-side fetch with ISR so bots always get fully-rendered HTML. */
async function getContent(slug: string): Promise<ContentDoc | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/content/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as ContentDoc) ?? null;
  } catch {
    return null;
  }
}

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildDescription = (html: string, fallback: string) => {
  const text = stripHtml(html || "");
  if (!text) return fallback;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContent(slug);

  if (!content || content.published === false) {
    return {
      title: "Page not found",
      robots: { index: false, follow: false },
    };
  }

  const url = `${SITE_URL}/pages/${slug}`;
  const description = buildDescription(
    content.description,
    `${content.title} — Elevator Video Pitch©`
  );

  return {
    title: content.title,
    description,
    keywords: [
      content.title,
      "Elevator Video Pitch",
      "EVP",
      "video pitch",
      "hiring",
      "recruitment",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: content.title,
      description,
      url,
      siteName: "Elevator Video Pitch©",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description,
    },
  };
}

export default async function DynamicContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getContent(slug);

  // Missing, or an admin-unpublished draft — 404 for users and search engines.
  if (!content || content.published === false) {
    notFound();
  }

  const url = `${SITE_URL}/pages/${slug}`;
  const description = buildDescription(
    content.description,
    `${content.title} — Elevator Video Pitch©`
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.title,
    description,
    url,
    mainEntityOfPage: url,
    datePublished: content.createdAt,
    dateModified: content.updatedAt || content.createdAt,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: "Elevator Video Pitch©",
      url: SITE_URL,
    },
  };

  return (
    <div className="w-full px-4 py-8 md:px-6 md:py-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="container space-y-8">
        <PageHeaders title={content.title} />
        <div
          className="prose max-w-none list-item list-none"
          dangerouslySetInnerHTML={{ __html: content.description || "" }}
        />
      </article>
    </div>
  );
}
