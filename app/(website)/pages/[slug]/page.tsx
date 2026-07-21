"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import PageHeaders from "@/components/shared/PageHeaders";

const fetchContent = async (slug: string) => {
  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_BASE_URL}/content/${slug}`
  );
  return data;
};

const DynamicContentPage = () => {
  const params = useParams();
  const slug = String(params?.slug ?? "");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content", slug],
    queryFn: () => fetchContent(slug),
    enabled: Boolean(slug),
  });

  if (isLoading) return <p className="text-center py-16">Loading…</p>;

  const content = data?.data;

  // Missing, or an admin-unpublished draft — treat as not found.
  if (isError || !content || content.published === false) {
    return (
      <div className="w-full px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-gray-500">
          The page you are looking for does not exist or is not available.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 md:px-6 md:py-12 lg:py-16">
      <div className="container space-y-8">
        <Suspense fallback={null}>
          <PageHeaders title={content?.title || ""} />
        </Suspense>

        <div
          className="prose max-w-none list-item list-none"
          dangerouslySetInnerHTML={{ __html: content?.description || "" }}
        />
      </div>
    </div>
  );
};

export default DynamicContentPage;
