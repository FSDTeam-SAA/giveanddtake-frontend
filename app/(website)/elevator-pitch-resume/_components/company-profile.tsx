"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialIcon } from "@/components/company/social-icon";
import { VideoPlayer } from "@/components/company/video-player";
import { fetchCompanyDetails } from "@/lib/api-service";
import { MapPin, Users, Calendar } from "lucide-react";
import Link from "next/link";
import {
  Key,
  ReactElement,
  JSXElementConstructor,
  ReactNode,
  ReactPortal,
  AwaitedReactNode,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";

interface PitchData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  video: {
    hlsUrl: string;
    encryptionKeyUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  total: number;
  data: PitchData[];
}

interface Job {
  _id: string;
  title: string;
  location?: string;
  salaryRange?: string;
  description?: string;
}

export default function CompanyProfilePage({ userId }: { userId?: string }) {
  const { data: session } = useSession();
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["company", userId],
    queryFn: () => fetchCompanyDetails(userId as string),
    enabled: !!userId,
  });

  // ---- Fetch company jobs using company _id and the required API path ----
  const company = companyData?.companies?.[0];
  const companyId = company?._id; // IMPORTANT: use _id, not userId

  const {
    data: jobs = [],
    isLoading: isLoadingJobs,
    isError: isJobsError,
    error: jobsError,
  } = useQuery<Job[]>({
    queryKey: ["company-jobs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL as string;
      const res = await fetch(`${baseUrl}/all-jobs/company/${companyId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken
            ? { Authorization: `Bearer ${session.accessToken}` }
            : {}),
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch company jobs");
      }
      const json = await res.json();
      // adapt to your API shape; try common shapes safely:
      // - { data: Job[] }
      // - Job[]
      return (json?.data as Job[]) ?? (json as Job[]) ?? [];
    },
  });
  // ----------------------------------------------------------------------

  console.log("JJJJJJJJJJJJ",jobs)

  useEffect(() => {
    const fetchPitchData = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}/elevator-pitch/all/elevator-pitches?type=company`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pitch data");
        }

        const apiResponse: ApiResponse = await response.json();

        const userPitch = apiResponse.data.find(
          (pitch) => pitch.userId._id === session.user?.id
        );

        if (userPitch) {
          setPitchData(userPitch);
        } else {
          setError("No pitch found for current user");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPitchData();
  }, [session]);

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

  const honors = companyData.honors || [];

  // Parse arrays
  const links = company.links || [];
  const services = company.service || [];

  return (
    <div className="container mx-auto p-6 space-y-8 bg-white">
      {/* Header Section */}
      <div className="bg-gray-100 rounded-lg p-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-gray-600 rounded-lg flex-shrink-0">
            {company.clogo ? (
              <img
                src={company.clogo || "/placeholder.svg"}
                alt={company.cname}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-600 rounded-lg" />
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1 text-gray-900">
              {company.cname}
            </h1>
            <p className="text-gray-600 mb-4 text-sm">{company.industry}</p>

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

            {/* Social Links */}
            <div className="flex gap-2">
              {links.map((link: string, index: number) => (
                <SocialIcon key={index} url={link} />
              ))}
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600 mb-2 font-medium">
              Try it Free - Post Your First Job in No Cost!
            </p>
            <p className="text-xs text-gray-500 mb-4 max-w-xs">
              Easily post your company job openings and reach the right talent
              fast. Get quality applications in no time.
            </p>
            <Link href="/manage-jobs">
              <Button className="bg-primary hover:bg-primary/90 text-white px-6 mr-2">
                Manage Jobs
              </Button>
            </Link>
            <Link href="/add-job">
              <Button className="bg-primary hover:bg-primary/90 text-white px-6">
                Post a Job
              </Button>
            </Link>
            <Link
              href={`/elevator-pitch-resume/edit-company/${company.userId}`}
            >
              <Button className="bg-primary hover:bg-primary/90 text-white px-6 ml-2">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Company Jobs */}
      {/* <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Company Jobs
        </h2>

        {isLoadingJobs ? (
          <div>Loading jobs...</div>
        ) : isJobsError ? (
          <div className="text-red-500">
            {(jobsError as Error)?.message || "Failed to load jobs"}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-gray-500">No jobs posted yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => {
              const plainDescription = job.description?.replace(/<[^>]+>/g, "");
              return (
                <Card
                  key={job._id}
                  className="border border-gray-200 shadow-sm"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-lg">
                            {job.title?.charAt(0) ?? "J"}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {job.title}
                          </CardTitle>
                          <p className="text-sm text-gray-600">
                            {company.cname}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location || "Not specified"}
                      </p>
                      <p className="font-medium text-gray-900">
                        {job.salaryRange || ""}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {plainDescription}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div> */}

      {/* Elevator Pitch */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Elevator Pitch
        </h2>
        <div className=" rounded-lg ">
          {pitchData ? (
            <VideoPlayer pitchId={pitchData._id} className="w-full mx-auto" />
          ) : loading ? (
            <div>Loading pitch...</div>
          ) : error ? (
            <div className="text-red-500">Error: {error}</div>
          ) : (
            <div>No pitch available</div>
          )}
        </div>
      </div>

      {/* About Us */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">About Us</h2>
        <div
          className="prose prose-sm text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: company.aboutUs }}
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
                <span className="text-gray-700 text-sm">
                  {company.city}, {company.country}
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
                  {company.city}, {company.country}
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
                  {company.city}, {company.country}
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

      {/* Employees */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Employees at {company.cname}
        </h2>
        <div className="space-y-4">
          {company.employeesId?.map((employeeId: string) => (
            <div
              key={employeeId}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
            >
              <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">David Usman</h4>
                <p className="text-sm text-gray-600">
                  Product Designer | Storyteller | Problem Solver
                </p>
              </div>
            </div>
          ))}
          {(!company.employeesId || company.employeesId.length === 0) && (
            <p className="text-gray-500">No employees added yet.</p>
          )}
          <div className="text-center pt-4">
            <Link href={`/recruiter-list/${company.userId}`}>
              <Button variant="link" className="text-blue-600">
                See All
              </Button>
            </Link>
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
            {honors.map(
              (honor: {
                _id: Key | null | undefined;
                title:
                  | string
                  | number
                  | bigint
                  | boolean
                  | ReactElement<any, string | JSXElementConstructor<any>>
                  | Iterable<ReactNode>
                  | ReactPortal
                  | Promise<AwaitedReactNode>
                  | null
                  | undefined;
                programeName:
                  | string
                  | number
                  | bigint
                  | boolean
                  | ReactElement<any, string | JSXElementConstructor<any>>
                  | Iterable<ReactNode>
                  | ReactPortal
                  | Promise<AwaitedReactNode>
                  | null
                  | undefined;
                programeDate: string | number | Date;
                description:
                  | string
                  | number
                  | bigint
                  | boolean
                  | ReactElement<any, string | JSXElementConstructor<any>>
                  | Iterable<ReactNode>
                  | ReactPortal
                  | Promise<AwaitedReactNode>
                  | null
                  | undefined;
              }) => (
                <Card key={honor._id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900">
                      {honor.title}
                    </h3>
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
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
