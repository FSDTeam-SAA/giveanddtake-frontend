"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import PageHeaders from "../../../../../components/shared/PageHeaders";
import DOMPurify from "dompurify";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BlogApiResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    title: string;
    description: string;
    image: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

const fetchBlog = async (id: string): Promise<BlogApiResponse> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/blogs/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch blog post");
  }
  return res.json();
};

export function BlogDetailsClient({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery<BlogApiResponse, Error>({
    queryKey: ["blog", id],
    queryFn: () => fetchBlog(id),
  });

  console.log(data);
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12 text-center">
        <p>Loading blog post...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12 text-center text-red-500">
        <p>Error: {error?.message || "Failed to load blog post."}</p>
      </div>
    );
  }

  const blogPost = data?.data;

  console.log(blogPost);

  if (!blogPost) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12 text-center">
        <p>Blog post not found.</p>
      </div>
    );
  }

  const paragraphs = blogPost.description
    .split("\n\n")
    .filter((p) => p.trim() !== "");

  const formattedDate = new Date(blogPost.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="container mx-auto">
      <div className="pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="">
                Back to Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="" />
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="">
                Blogs
              </BreadcrumbLink>
              <BreadcrumbSeparator className="" />
              <BreadcrumbPage className="">Blog Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="py-24">
        <PageHeaders
          title={blogPost.title} // Use dynamic title
        />
        <article>
          {blogPost.image && (
            <div className="mb-8">
              <Image
                src={blogPost.image || "/assets/blog2.png"} // Use API image
                alt={blogPost.title}
                width={1200}
                height={675}
                className="w-full h-auto object-cover rounded-lg shadow-md"
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>
          )}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-[24px] text-[#1B1B1B] font-semibold mb-6">
              {blogPost.title}
            </h1>
            <p className="text-sm text-gray-500 mb-4">{formattedDate}</p>
            <div
              className=""
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(blogPost.description),
              }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}
