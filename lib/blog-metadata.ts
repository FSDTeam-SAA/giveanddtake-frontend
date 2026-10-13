import type { Metadata } from "next";
import { createPageMetadata, metadataExcerpt, metadataText } from "@/lib/seo";

interface BlogPreview {
  slug?: string;
  title?: string;
  description?: string;
  image?: string;
}

export async function getBlogMetadata(
  identifier: string,
  apiBase = process.env.NEXT_PUBLIC_BASE_URL,
): Promise<Metadata> {
  const path = `/blogs/${encodeURIComponent(identifier)}`;
  const fallback = createPageMetadata(path, "Blog", "Read career advice, recruitment insights and account guides from Elevator Video Pitch.");
  if (!apiBase || !identifier) return fallback;

  try {
    // Read the existing public API only. The visible article keeps its current client renderer.
    const response = await fetch(`${apiBase.replace(/\/+$/, "")}/blogs/${encodeURIComponent(identifier)}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) {
      return { ...fallback, robots: { index: false, follow: true, googleBot: { index: false, follow: true } } };
    }
    // A timeout/API outage must not mark a valid article as deleted or prevent rendering.
    if (!response.ok) return fallback;
    const payload = await response.json();
    const blog = payload?.data as BlogPreview | undefined;
    if (payload?.success !== true || !blog || typeof blog !== "object") return fallback;
    const title = metadataExcerpt(blog.title, "Blog", 200);
    const description = metadataExcerpt(blog.description, `Read ${title} on Elevator Video Pitch.`);
    const slug = typeof blog.slug === "string" && blog.slug.trim() ? blog.slug : identifier;
    const metadata = createPageMetadata(`/blogs/${encodeURIComponent(slug)}`, title, description);

    // Only publish a valid absolute image URL. An absent cover needs no placeholder image.
    let image: string | undefined;
    if (typeof blog.image === "string") {
      try {
        const candidate = new URL(blog.image);
        if (["https:", "http:"].includes(candidate.protocol)) image = candidate.href;
      } catch { /* No sharing image for an invalid cover URL. */ }
    }
    return {
      ...metadata,
      openGraph: {
        ...metadata.openGraph,
        type: "article",
        ...(image ? { images: [{ url: image, alt: metadataText(blog.title) || "Blog cover" }] } : {}),
      },
      twitter: {
        ...metadata.twitter,
        card: image ? "summary_large_image" : "summary",
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return fallback;
  }
}
