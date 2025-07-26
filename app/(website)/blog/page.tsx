"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import PageHeaders from "@/components/shared/PageHeaders"

interface Blog {
  _id: string
  title: string
  description: string
  image: string
  userId: string
  createdAt: string
  updatedAt: string
  __v: number
  // Note: 'author' field is not in your provided API response,
  // but is present in the image. It will be hardcoded as "Alex Robert" for design consistency.
}

interface ApiResponse {
  success: boolean
  message: string
  data: Blog[]
}

const fetchBlogs = async (): Promise<ApiResponse> => {


  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/blogs/get-all`)

  if (!response.ok) {
    throw new Error(`Failed to fetch blogs: ${response.statusText}`)
  }
  return response.json()
}

export default function BlogListingPage() {
  const { data, isLoading, isError, error } = useQuery<ApiResponse, Error>({
    queryKey: ["blogs"],
    queryFn: fetchBlogs,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
      
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="w-full max-w-sm rounded-lg shadow-md overflow-hidden">
              <Skeleton className="w-full h-48 rounded-t-lg" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="p-4 pt-0">
                <Skeleton className="h-4 w-1/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 text-red-500">Error: {error?.message || "Failed to load blogs."}</div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <PageHeaders title="Blogs" description="Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development."/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.data.map((blog) => {
          const formattedDate = new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(blog.createdAt))

          const truncatedDescription =
            blog.description.length > 100 ? blog.description.substring(0, 97) + "..." : blog.description

          return (
            <Card
              key={blog._id}
              className="w-full max-w-sm rounded-lg border-none overflow-hidden transition-all "
            >
              <div className="relative w-[377px]  h-[277px]">
                <Image
                  src={ "assets/blog.jpg"}
                  alt={blog.title}
                   width={1000}
                  height={1000}
                   
                  className="rounded-lg w-full h-full "
                
                />
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="text-xs text-[#595959] flex gap-[20px] ">
                  {formattedDate} 
                  <span className="text-[#595959]">{"Alex Robert"} </span>
                </div>
                <h3 className="text-sm font-semibold text-[#272727]">{blog.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{truncatedDescription}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Link
                  href={`/blog-details/${blog._id}`}
                  className="inline-flex items-center text-sm font-medium text-[#9EC7DC] "
                >
                  Read More
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
