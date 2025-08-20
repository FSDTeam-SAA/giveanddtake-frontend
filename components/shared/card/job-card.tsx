"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import DOMPurify from "dompurify";
import Image from "next/image";

interface CompanyId {
  _id: string;
  cname: string;
  clogo: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  employement_Type?: string; // <-- optional
  companyId?: CompanyId;
  vacancy: number;
  experience: number;
  compensation: string;
  createdAt: string;
}

interface JobCardProps {
  job: Job;
  onSelect: () => void;
  variant: "suggested" | "list";
}

export default function JobCard({ job, onSelect, variant }: JobCardProps) {
  const getCompanyInitials = (title: string) => {
    return title
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  if (variant === "suggested") {
    return (
      <div>
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={onSelect}
        >
          <CardContent className="p-4">
            <div className="grid grid-cols-8">
              {/* Icon Section */}
              <div className="col-span-1 hidden md:block">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-[50px] h-[50px] flex items-center justify-center">
                    {job.companyId && (
                      <Image
                        src={job.companyId.clogo}
                        alt={job.companyId.cname}
                        width={500}
                        height={500}
                        className="w-[50px] h-[50px]"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Job Details Section */}
              <div className="col-span-8 md:col-span-7">
                {/* Title & Apply Button */}
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {job.title}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/job-application?id=${job._id}`}>
                      <button className="text-black text-sm font-normal border border-[#707070] px-4 py-[2px] md:py-2 rounded-lg">
                        Apply
                      </button>
                    </Link>
                    <button className="bg-primary hover:bg-blue-700 text-white text-sm px-4 md:py-2 rounded-lg">
                      {job.employement_Type}
                    </button>
                  </div>
                </div>

                <div className="my-2">
                  {/* Description - safely render HTML with line clamp */}
                  <div
                    className="text-gray-600 text-sm line-clamp-2 prose prose-sm max-w-none text-start"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(job.description),
                    }}
                  />
                </div>

                {/* Salary, Vacancy, Experience */}
                <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                  <div className="bg-[#E9ECFC] p-2 rounded-lg">
                    <Link
                      href="#"
                      className="text-[#707070] text-[16px] font-normal"
                    >
                      Winbrans.com
                    </Link>
                  </div>
                  <div className="flex items-center bg-[#E9ECFC] p-2 rounded-lg">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {job.salaryRange}
                  </div>
                  {/* Location */}
                  <div className="flex items-center bg-[#E9ECFC] p-2 rounded-lg">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/alljobs/${job._id}`} className="block">
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={onSelect}
        >
          <CardContent className="p-4">
            <div className="grid grid-cols-8">
              {/* Icon Section */}
              <div className="col-span-1">
                <div className="w-[50px] h-[50px] flex items-center justify-center">
                  {job.companyId && (
                    <Image
                      src={job.companyId.clogo}
                      alt={job.companyId.cname}
                      width={500}
                      height={500}
                      className="w-[50px] h-[50px]"
                    />
                  )}
                </div>
              </div>

              {/* Job Details Section */}
              <div className="col-span-7">
                {/* Title & Apply Button */}
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {job.title}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/job-application?id=${job._id}`}>
                      <button className="text-black text-base font-normal border border-[#707070] px-4 py-2 rounded-lg">
                        Apply
                      </button>
                    </Link>
                    <Button className="bg-primary hover:bg-blue-700 text-white text-sm">
                      {job.employement_Type}
                    </Button>
                  </div>
                </div>

                <div className="py-4">
                  {/* Description */}
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {job.description}
                  </p>
                </div>

                {/* Salary, Vacancy, Experience */}
                <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                  <div className="bg-[#E9ECFC] p-2 rounded-lg">
                    <Link
                      href="#"
                      className="text-[#707070] text-[16px] font-normal"
                    >
                      Winbrans.com
                    </Link>
                  </div>
                  <div className="flex items-center bg-[#E9ECFC] p-2 rounded-lg">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {job.salaryRange}
                  </div>
                  {/* Location */}
                  <div className="flex items-center bg-[#E9ECFC] p-2 rounded-lg">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
