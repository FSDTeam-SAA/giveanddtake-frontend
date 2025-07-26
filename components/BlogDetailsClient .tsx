"use client"

import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import PageHeaders from "./shared/PageHeaders"

// Define the type for the API response data
interface BlogApiResponse {
  success: boolean
  message: string
  data: {
    _id: string
    title: string
    description: string
    image: string
    userId: string
    createdAt: string
    updatedAt: string
    __v: number
  }
}

// Function to fetch blog data
const fetchBlog = async (id: string): Promise<BlogApiResponse> => {
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/blogs/${id}`) 
  if (!res.ok) {
    throw new Error("Failed to fetch blog post")
  }
  return res.json()
}

export function BlogDetailsClient({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery<BlogApiResponse, Error>({
    queryKey: ["blog", id],
    queryFn: () => fetchBlog(id),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12 text-center">
        <p>Loading blog post...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12 text-center text-red-500">
        <p>Error: {error?.message || "Failed to load blog post."}</p>
      </div>
    )
  }

  const blogPost = data?.data

  if (!blogPost) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12 text-center">
        <p>Blog post not found.</p>
      </div>
    )
  }

  // Split the description into paragraphs based on double newlines
  const paragraphs = blogPost.description.split("\n\n").filter((p) => p.trim() !== "")

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12">
        <PageHeaders title="Blog Details" description="Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development."/>
      <article className="">
        {blogPost.image && (
          <div className="mb-8">
            <Image
              src={"/assets/blog2.png"} // Use API image or fallback to provided image
              alt={blogPost.title}
              width={1200}
              height={675}
              className="w-full h-auto object-cover rounded-lg shadow-md"
              priority
            />
          </div>
        )}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-[24px] text-[#1B1B1B] fontsemibold  mb-6  ">{blogPost.title}</h1>
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </div>
  )
}
