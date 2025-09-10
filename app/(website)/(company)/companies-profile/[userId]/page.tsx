"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SocialIcon } from "@/components/company/social-icon";
import { VideoPlayer } from "@/components/company/video-player";
import { fetchCompanyDetails } from "@/lib/api-service";
import { MapPin, Users, Calendar } from "lucide-react";
import Image from "next/image";
import JobCard from "@/components/shared/card/job-card";
import { useMemo, useState } from "react";
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

  return res.json(); // { success, message, data: Job[] }
};

export default function CompanyProfilePage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // NEW: pagination state (6 per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 6;

  const params = useParams();
  const userId = params.userId as string;

  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["company", userId],
    queryFn: () => fetchCompanyDetails(userId),
    enabled: !!userId,
  });

  const { data: jobs = { data: [] as any[] }, isLoading: isLoadingJobs } =
    useQuery({
      queryKey: ["company-jobs", companyData?.companies[0]?._id],
      queryFn: () => fetchCompanyJobs(companyData?.companies[0]?._id),
      enabled: !!companyData?.companies[0]?._id,
    });

  // NEW: derive only admin-approved jobs
  const approvedJobs = useMemo(() => {
    return (jobs?.data ?? []).filter((j: any) => j?.adminApprove === true);
  }, [jobs]);

  // NEW: pagination derivations
  const totalPages = Math.max(1, Math.ceil(approvedJobs.length / PAGE_SIZE));
  const visibleJobs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return approvedJobs.slice(start, start + PAGE_SIZE);
  }, [approvedJobs, currentPage]);

  // Reset to page 1 if the job list changes and current page is now out of bounds
  // (e.g., after filtering or refetch)
  if (currentPage > totalPages) {
    setTimeout(() => setCurrentPage(1), 0);
  }

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
    <div className="container mx-auto">
      {/* Banner */}
      <div>
        <Image
          src={company.banner || "/company-cover.jpg"}
          alt={`${company.cname} banner`}
          width={1200}
          height={200}
          className="w-full h-[200px] object-cover rounded-b-lg"
        />
      </div>

      {/* Header Section */}
      <div className="px-4 md:px-6 lg:pl-10 mt-[-30px]">
        <div className="">
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
              {links.slice(0, 3).map((link, index) => (
                <SocialIcon key={index} url={link} />
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm">
                Follow
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Company Jobs */}
      <div className="my-12">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Company Jobs
        </h2>

        {isLoadingJobs ? (
          <div className="text-center py-10">Loading jobs...</div>
        ) : approvedJobs.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            No approved jobs available.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visibleJobs.map((job: any) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onSelect={() => setSelectedJobId(job._id)}
                  variant="list"
                />
              ))}
            </div>

            {/* NEW: Pagination (only if more than one page) */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </Button>

                {/* Numbered page buttons */}
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <Button
                      key={pageNum}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Elevator Pitch */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Elevator Pitch
        </h2>
        <div className="rounded-lg p-6 bg-gray-50">
          <VideoPlayer
            pitchId={companyData?.companies[0]?.elevatorPitch?._id}
            className="w-full mx-auto"
          />
        </div>
      </div>

      {/* About Us */}
      <div className="space-y-12 pb-24 pt-8  mx-auto">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">About Us</h2>
          <div className="text-gray-700 leading-relaxed text-sm">
            <div
              className="text-gray-700 mt-2 prose"
              dangerouslySetInnerHTML={{ __html: company.aboutUs }}
            />
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
                    <h3 className="font-semibold text-gray-900">
                      {honor.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {honor.programeName || honor.issuer}
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
    </div>
  );
}
