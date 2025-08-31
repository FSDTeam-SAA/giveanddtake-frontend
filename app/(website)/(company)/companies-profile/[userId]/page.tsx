"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SocialIcon } from "@/components/company/social-icon";
import { VideoPlayer } from "@/components/company/video-player";
import { fetchCompanyDetails } from "@/lib/api-service";
import { MapPin, Users, Calendar } from "lucide-react";
import Image from "next/image";
import JobCard from "@/components/shared/card/job-card";
import { useState } from "react";
import JobDetails from "@/app/(website)/alljobs/_components/job-details";

interface Honor {
  id: string;
  _id?: string;
  title: string;
  issuer: string;
  programeDate: string;
  programeName: string;
  description: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

const fetchCompanyJobs = async (companyId: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/all-jobs/company/${companyId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch company jobs");
  }

  return res.json();
};

export default function CompanyProfilePage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const params = useParams();
  const userId = params.userId as string;

  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["company", userId],
    queryFn: () => fetchCompanyDetails(userId),
    enabled: !!userId,
  });

  // console.log(companyData?.companies[0]._id);

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ["company-jobs", companyData?.companies[0]._id],
    queryFn: () => fetchCompanyJobs(companyData?.companies[0]._id),
    enabled: !!companyData?.companies[0]._id, // ensures query runs only when companyId exists
  });

  if (isLoadingCompany) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!companyData?.companies?.[0]) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Company not found
      </div>
    );
  }

  const company = companyData.companies[0];
  const honors = companyData.honors || [];

  const parseLinks = (linkString?: string): string[] => {
    if (!linkString) return [];
    try {
      const parsed = JSON.parse(linkString);
      return Array.isArray(parsed) ? parsed : [linkString];
    } catch (error) {
      return [linkString];
    }
  };

  const parseServices = (serviceString?: string): string[] => {
    if (!serviceString) return [];
    try {
      const parsed = JSON.parse(serviceString);
      return Array.isArray(parsed) ? parsed : [serviceString];
    } catch (error) {
      return [serviceString];
    }
  };

  const links = parseLinks(company.links?.[0]);
  const services = parseServices(company.service?.[0]);

  if (selectedJobId) {
    return <JobDetails jobId={selectedJobId} />;
  }

  return (
    <div className="container mx-auto p-6 bg-white space-y-10">
      {/* Header Section */}
      <div className="bg-gray-100 rounded-lg p-6">
        <div className="flex items-start gap-6">
          <div className="w-[170px] h-[170px] flex-shrink-0">
            <Image
              src={
                company.clogo && company.clogo.trim() !== ""
                  ? company.clogo
                  : "/placeholder.svg"
              }
              alt={company.cname}
              width={170}
              height={170}
              className="w-[170px] h-[170px] object-cover rounded"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2 text-gray-900">
              {company.cname}
            </h1>
            <p className="text-gray-600 text-sm mb-4">{company.industry}</p>
            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {company.city}, {company.country}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {company.employeesId?.length || 0} employees
              </div>
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span>Contact</span>
              </div>
            </div>
            <div className="flex gap-4">
              {links.map((link: string, index: number) => (
                <SocialIcon key={index} url={link} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Company Jobs */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Company Jobs
        </h2>
        {isLoadingJobs ? (
          <div className="text-center py-10">Loading jobs...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs?.data.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onSelect={() => setSelectedJobId(job._id)}
                variant="list"
              />
            ))}
          </div>
        )}
      </div>

      {/* Elevator Pitch */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Elevator Pitch
        </h2>
        <div className=" rounded-lg p-6">
          <VideoPlayer
            pitchId={companyData?.companies[0]?.elevatorPitch?._id}
            className="w-full mx-auto"
          />
        </div>
      </div>

      {/* About Us */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">About Us</h2>
        <div
          className="text-gray-700 leading-relaxed text-sm"
          dangerouslySetInnerHTML={{ __html: company.aboutUs || "" }}
        />
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Website</h3>
            <a
              href={links[0]}
              className="text-blue-600 hover:underline text-sm"
            >
              {links[0] || "Not provided"}
            </a>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Industry</h3>
            <p className="text-gray-700 text-sm">{company.industry}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Company size</h3>
            <p className="text-gray-700 text-sm">
              {company.employeesId?.length || 0} employees
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {services.map((service: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Locations</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">Dubai, AE</span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600 text-xs"
                >
                  Get Direction
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">Dubai, AE</span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600 text-xs"
                >
                  Get Direction
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">Dubai, AE</span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600 text-xs"
                >
                  Get Direction
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Awards and Honors */}
      {honors.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Awards and Honors
          </h2>
          <div className="space-y-4">
            {honors.map((honor: Honor) => (
              <Card key={honor._id}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900">{honor.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {honor.programeName}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    {new Date(honor.programeDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-700">{honor.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
