"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Users } from "lucide-react";
import Link from "next/link";

interface Job {
  _id: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
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
        <Link href={`/alljobs/${job._id}`}>
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={onSelect}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {getCompanyInitials(job.title)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <Badge variant="secondary" className="ml-4">
                        {job.shift}
                      </Badge>
                    </div>

                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.salaryRange}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {job.vacancy} positions
                      </div>
                      <div>{job.experience}+ years exp</div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2">
                      {job.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 ml-4">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Apply
                  </Button>
                  <span className="text-xs text-gray-400">
                    {formatDate(job.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/alljobs/${job._id}`}>
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={onSelect}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {getCompanyInitials(job.title)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <Badge variant="secondary" className="ml-4">
                      {job.shift}
                    </Badge>
                  </div>

                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {job.salaryRange}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {job.vacancy} positions
                    </div>
                    <div>{job.experience}+ years exp</div>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2">
                    {job.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 ml-4">
                <Button className="bg-blue-600 hover:bg-blue-700">Apply</Button>
                <span className="text-xs text-gray-400">
                  {formatDate(job.createdAt)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
