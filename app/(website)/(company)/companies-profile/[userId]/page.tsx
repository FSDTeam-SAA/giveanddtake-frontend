"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialIcon } from "@/components/company/social-icon";
import { VideoPlayer } from "@/components/company/video-player";
import { fetchCompanyDetails, fetchCompanyJobs } from "@/lib/api-service";
import { MapPin, Users, Calendar, ExternalLink, Archive } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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

export default function CompanyProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["company", userId],
    queryFn: () => fetchCompanyDetails(userId),
    enabled: !!userId,
  });

  console.log("CCCCCCCCCCCCCC", companyData);

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ["company-jobs"],
    queryFn: fetchCompanyJobs,
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

  return (
    <div className="container mx-auto p-6 bg-white space-y-10">
      {/* Header Section */}
      <div className="bg-gray-100 rounded-lg p-6">
        <div className="flex items-start gap-6">
          <div className="w-[170px] h-[170px] flex-shrink-0">
            <Image
              src={company.clogo && company.clogo.trim() !== "" ? company.clogo : "/placeholder.svg"}
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
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Company Jobs</h2>
        {isLoadingJobs ? (
          <div className="text-center py-10">Loading jobs...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <Card key={job._id} className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <Link href={`/alljobs/${job._id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-lg">
                            {job.title.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {job.title}
                          </CardTitle>
                          <p className="text-sm text-gray-600">{company.cname}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </Link>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </p>
                    <p className="font-medium text-gray-900">{job.salaryRange}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {job.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Link href={`/alljobs/${job._id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-3 py-1 h-7 bg-transparent"
                        >
                          View Job
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1 h-7 flex items-center gap-1 bg-transparent"
                      >
                        <Archive className="h-3 w-3" />
                        Archive Job
                      </Button>
                    </div>
                    <Link href={`/job-application?id=${job._id}`}>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs px-4 py-1 h-7 text-white"
                      >
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Elevator Pitch */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Elevator Pitch</h2>
        <div className="bg-gray-100 rounded-lg p-6">
          <VideoPlayer
            pitchId="687623daea00f0d9b621c53e"
            className="w-full max-w-2xl mx-auto"
          />
        </div>
      </div>

      {/* About Us */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">About Us</h2>
        <p className="text-gray-700 leading-relaxed text-sm">
          {company.aboutUs}
        </p>
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
                <span className="text-gray-700 text-sm">
                  Dubai, AE
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600 text-xs"
                >
                  Get Direction
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">
                  Dubai, AE
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600 text-xs"
                >
                  Get Direction
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">
                  Dubai, AE
                </span>
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