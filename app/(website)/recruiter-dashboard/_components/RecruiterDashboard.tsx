"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlayIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Mail,
  Globe,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/company/video-player";

// Define TypeScript interfaces for jobs API response
interface ApplicationRequirement {
  requirement: string;
  _id: string;
}

interface CustomQuestion {
  question: string;
  _id: string;
}

interface Job {
  _id: string;
  userId: string;
  companyId: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  vacancy: number;
  experience: number;
  adminApprove: boolean;
  deadline: string;
  applicantCount: number;
  status: string;
  jobCategoryId: string;
  compensation: string;
  arcrivedJob: boolean;
  applicationRequirement: ApplicationRequirement[];
  customQuestion: CustomQuestion[];
  jobApprove: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  publishDate?: string;
}

interface JobApiResponse {
  success: boolean;
  message: string;
  data: Job[];
}

// Define TypeScript interfaces for applicants API response
interface User {
  _id: string;
  name: string;
  email: string;
}

interface Applicant {
  _id: string;
  jobId: string;
  userId: User;
  status: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface DeleteJobResponse {
  success: boolean;
  message: string;
  data: any;
}

interface SocialLink {
  label: string;
  url: string;
  _id: string;
}

interface Company {
  _id: string;
  userId: string;
  aboutUs: string;
  cname: string;
  clogo: string;
  country: string;
  city: string;
  zipcode: string;
  cemail: string;
  cPhoneNumber: string;
  links: string[];
  industry: string;
  service: string[];
  employeesId: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface RecruiterAccount {
  _id: string;
  userId: string;
  bio: string;
  photo: string;
  title: string;
  firstName: string;
  lastName: string;
  sureName: string;
  country: string;
  city: string;
  zipCode: string;
  location: string;
  emailAddress: string;
  phoneNumber: string;
  roleAtCompany: string;
  awardTitle: string;
  programName: string;
  programDate: string;
  awardDescription: string;
  companyId: Company;
  sLink: SocialLink[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  aboutUs: string;
}

interface RecruiterAccountResponse {
  success: boolean;
  message: string;
  data: RecruiterAccount;
}

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

interface PitchApiResponse {
  success: boolean;
  message: string;
  total: number;
  data: PitchData[];
}

const fetchRecruiterAccount = async (
  applicantId: string,
  token?: string
): Promise<RecruiterAccountResponse> => {
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  }

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/recruiter/recruiter-account/${applicantId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }

  const data: RecruiterAccountResponse = await res.json();
  if (!data.success)
    throw new Error(data.message || "Failed to fetch recruiter account");

  if (
    Array.isArray(data.data.companyId.links) &&
    data.data.companyId.links.length === 1
  ) {
    try {
      data.data.companyId.links = JSON.parse(data.data.companyId.links[0]);
    } catch (error) {
      console.warn("Failed to parse company links:", error);
      data.data.companyId.links = [];
    }
  }
  if (
    Array.isArray(data.data.companyId.service) &&
    data.data.companyId.service.length === 1
  ) {
    try {
      data.data.companyId.service = JSON.parse(data.data.companyId.service[0]);
    } catch (error) {
      console.warn("Failed to parse company services:", error);
      data.data.companyId.service = [];
    }
  }

  return data;
};

const fetchJobs = async (token?: string): Promise<JobApiResponse> => {
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  }

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/recruiter/company`,
      {
        method: "GET",
        headers,
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: JobApiResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch jobs");
    }
    return data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
};

const fetchPitchData = async (
  userId: string,
  token?: string
): Promise<PitchApiResponse> => {
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  }

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/elevator-pitch/all/elevator-pitches?type=recruiter`,
      {
        method: "GET",
        headers,
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: PitchApiResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch pitch data");
    }
    return data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
};

const deleteJob = async (
  jobId: string,
  token?: string
): Promise<DeleteJobResponse> => {
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  }

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${jobId}`,
      {
        method: "DELETE",
        headers,
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: DeleteJobResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to delete job");
    }
    return data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
};

export default function RecruiterDashboard() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPageTable, setCurrentPageTable] = useState(1);
  const itemsPerPage = 4;

  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
  } = useQuery<JobApiResponse, Error>({
    queryKey: ["jobs", token],
    queryFn: () => fetchJobs(token),
  });

  const {
    data: recruiterAccount,
    isLoading: recruiterAccountLoading,
    error: recruiterAccountError,
  } = useQuery<RecruiterAccountResponse, Error>({
    queryKey: ["recruiter", session?.user?.id, token],
    queryFn: () => fetchRecruiterAccount(session?.user?.id!, token),
    enabled: !!session?.user?.id && !!token,
  });

  const {
    data: pitchDataResponse,
    isLoading: pitchLoading,
    error: pitchError,
  } = useQuery<PitchApiResponse, Error>({
    queryKey: ["pitch", session?.user?.id, token],
    queryFn: () => fetchPitchData(session?.user?.id!, token),
    enabled: !!session?.user?.id && !!token,
  });

  const deleteMutation = useMutation<DeleteJobResponse, Error, string>({
    mutationFn: (jobId) => deleteJob(jobId, token),
    onSuccess: (data) => {
      toast.success(data.message || "Job deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setIsDeleteModalOpen(false);
      setDeleteJobId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete job");
    },
  });

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const userPitch = pitchDataResponse?.data.find(
    (pitch) => pitch.userId._id === session?.user?.id
  );

  const jobs = jobsData?.data ?? [];
  const totalPagesTable = Math.ceil(jobs.length / itemsPerPage);
  const startIndexTable = (currentPageTable - 1) * itemsPerPage;
  const endIndexTable = startIndexTable + itemsPerPage;
  const currentJobsTable = useMemo(
    () => jobs.slice(startIndexTable, endIndexTable),
    [jobs, startIndexTable, endIndexTable]
  );

  const firstJobId = jobsData?.data?.[0]?._id;

  const handlePageChangeTable = (page: number) => {
    setCurrentPageTable(page);
  };

  const handlePreviousTable = () => {
    if (currentPageTable > 1) {
      setCurrentPageTable(currentPageTable - 1);
    }
  };

  const handleNextTable = () => {
    if (currentPageTable < totalPagesTable) {
      setCurrentPageTable(currentPageTable + 1);
    }
  };

  const handleDeleteClick = (jobId: string) => {
    setDeleteJobId(jobId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteJobId) {
      deleteMutation.mutate(deleteJobId);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8 bg-gray-50">
      <div className="container mx-auto">
        <h1 className="text-4xl text-[#131313] font-bold text-center mb-12">
          Recruiter Dashboard
        </h1>

        {/* Recruiter Information Section */}
        <section className="mb-12 bg-white md:p-6 rounded-lg shadow-sm">
          <div className="container mx-auto px-4 md:px-6">
            <div className="md:flex md:items-center md:justify-between mb-4 border-b border-[#999999] pb-3 space-y-2">
              <div>
                <h2 className="text-2xl font-bold text-[#131313]">
                  Recruiter Information
                </h2>
              </div>
              {/* Post A Job Button */}
              <div className="">
                <Link href="/add-job">
                  <Button className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/85 text-white px-10 py-4 text-lg shadow-md">
                    Post A Job
                  </Button>
                </Link>
              </div>
            </div>
            {recruiterAccountError && (
              <div className="text-center text-red-600 mb-4">
                Error loading recruiter data: {recruiterAccountError.message}
                <Button
                  variant="outline"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["recruiter", session?.user?.id, token],
                    })
                  }
                  className="ml-4"
                >
                  Retry
                </Button>
              </div>
            )}
            <div className="">
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                <div className="col-span-1 lg:col-span-2">
                  <div className="md:flex space-x-3">
                    {recruiterAccountLoading ? (
                      <Skeleton className="w-[50px] h-[48px]" />
                    ) : (
                      <Image
                        src={
                          recruiterAccount?.data?.companyId.clogo ??
                          "/placeholder.png"
                        }
                        alt="Company Logo"
                        width={50}
                        height={48}
                        className="mt-1 w-[170px] h-[170px]"
                      />
                    )}
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-xl text-[#000000]">
                          {recruiterAccountLoading ? (
                            <Skeleton className="h-6 w-32" />
                          ) : (
                            `${recruiterAccount?.data?.firstName} ${recruiterAccount?.data?.lastName}`
                          )}
                        </p>
                        <p className="text-base text-blue-600">
                          {recruiterAccountLoading ? (
                            <Skeleton className="h-5 w-48" />
                          ) : (
                            recruiterAccount?.data?.companyId.cname
                          )}
                        </p>
                      </div>
                      <div className="space-y-3">
                        {/* Email */}
                        <div className="flex items-center gap-3">
                          <Mail className="text-gray-600 h-5 w-5" />
                          {recruiterAccountLoading ? (
                            <Skeleton className="h-5 w-64" />
                          ) : (
                            <p className="text-base text-gray-700">
                              {recruiterAccount?.data?.emailAddress ??
                                "No email available"}
                            </p>
                          )}
                        </div>

                        {/* Website */}
                        <div className="flex items-center gap-3">
                          <Globe className="text-gray-700 h-5 w-5" />
                          {recruiterAccountLoading ? (
                            <Skeleton className="h-5 w-48" />
                          ) : recruiterAccount?.data?.companyId.links
                              ?.length ? (
                            <Link
                              href={recruiterAccount.data.companyId.links[0]}
                              className="text-base text-gray-700 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {recruiterAccount.data.companyId.links[0]}
                            </Link>
                          ) : (
                            <p className="text-base text-gray-700">
                              No website available
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 lg:col-span-4">
                  <p className="font-medium text-xl text-[#000000]">About Us</p>
                  {recruiterAccountLoading ? (
                    <Skeleton className="h-4 w-full" />
                  ) : (
                    // <p className="text-base text-[#707070] leading-relaxed">
                    //   {recruiterAccount?.data?.bio ??
                    //     "No description available"}
                    // </p>
                    <div
                      className="text-gray-700 mt-2 prose"
                      dangerouslySetInnerHTML={{
                        __html: recruiterAccount?.data?.bio ?? "",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Elevator Pitch Section */}
        <section className="mb-12 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl lg:text-2xl font-bold text-center mb-8">
            Elevator Pitch
          </h2>
          <div className="rounded-lg overflow-hidden">
            {pitchLoading ? (
              <Skeleton className="w-full h-[500px] mx-auto" />
            ) : pitchError ? (
              <div className="text-center text-red-500">
                Error: {pitchError.message}
                <Button
                  variant="outline"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["pitch", session?.user?.id, token],
                    })
                  }
                  className="ml-4"
                >
                  Retry
                </Button>
              </div>
            ) : userPitch ? (
              <VideoPlayer
                pitchId={userPitch._id}
                className="w-full h-[500px] mx-auto"
              />
            ) : (
              <div className="text-center text-gray-500">
                No pitch available
              </div>
            )}
          </div>
        </section>

        {/* Your Jobs Section */}
        <section className="mb-12 bg-white p-6 rounded-lg shadow-sm ">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-[#000000] font-semibold">Your Jobs</h2>
          </div>
          {jobsError && (
            <div className="text-center text-red-600 mb-4">
              Error loading jobs: {jobsError.message}
              <Button
                variant="outline"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["jobs"] })
                }
                className="ml-4"
              >
                Retry
              </Button>
            </div>
          )}
          <div className="rounded-lg w-full overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Job Title
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Status
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Publish Date
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Applicants list
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Deadline
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsLoading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-6 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentJobsTable.length > 0 ? (
                  currentJobsTable.map((job: Job) => (
                    <TableRow
                      key={job._id}
                      className="text-base text-[#000000] font-medium"
                    >
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)}
                      </TableCell>
                      <TableCell>{formatDate(job.publishDate)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/candidate-list/${job._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View{" "}
                          <span className="text-gray-500">
                            ({job.applicantCount})
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(job.deadline)}</TableCell>
                      <TableCell className="flex items-center gap-4">
                        <span
                          className={`text-sm font-medium ${
                            job.adminApprove
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {job.adminApprove ? "Live" : "Scheduled"}
                        </span>
                        <Link
                          href={`/single-job/${job._id}`}
                          className="text-[#000000] hover:text-blue-600 transition-colors"
                          aria-label={`View job ${job.title}`}
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(job._id)}
                          disabled={
                            deleteMutation.isPending && deleteJobId === job._id
                          }
                          className={`text-red-600 hover:text-red-700 transition-colors ${
                            deleteMutation.isPending && deleteJobId === job._id
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          aria-label={`Delete job ${job.title}`}
                        >
                          <Trash2 className="h-6 w-6" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No jobs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {jobs.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={handlePreviousTable}
                disabled={currentPageTable === 1}
                className="flex items-center gap-2 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPagesTable }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={
                        currentPageTable === page ? "default" : "outline"
                      }
                      onClick={() => handlePageChangeTable(page)}
                      className="w-10 h-10"
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleNextTable}
                disabled={currentPageTable === totalPagesTable}
                className="flex items-center gap-2 bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>

        {/* Applicant List Section */}
        {/* <section className="mb-12 bg-white p-6 rounded-lg shadow-sm">
          <div className="overflow-hidden">
            <div className="flex justify-end">
              {firstJobId ? (
                <Link
                  href={`/candidate-list/${firstJobId}`}
                  className="text-base text-[#000000] font-semibold text-right mt-8 cursor-pointer"
                >
                  See All
                </Link>
              ) : (
                <p className="text-base text-[#707070] font-semibold text-right mt-8">
                  No jobs available to view applicants
                </p>
              )}
            </div>
          </div>
        </section> */}

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Job Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this job? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteJobId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
