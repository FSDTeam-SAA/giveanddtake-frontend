"use client";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlayIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import JobList from "./joblist";

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
  deadline: string;
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

interface ApiResponse {
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

interface ApplicantsApiResponse {
  success: boolean;
  message: string;
  data: Applicant[];
}

interface UpdateStatusResponse {
  success: boolean;
  message: string;
  data: any;
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
  country: string;
  city: string;
  zipcode: string;
  cemail: string;
  cPhoneNumber: string;
  links: string[]; // converted from stored JSON string
  industry: string;
  service: string[]; // converted from stored JSON string
  employeesId: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface RecruiterAccount {
  _id: string;
  userId: string;
  bio: string;
  photo: string; // Base64 string or URL
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

const fetchRecruiterAccount = async (
  applicantId: string,
  token?: string
): Promise<RecruiterAccountResponse> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/recruiter/recruiter-account/${applicantId}`,
    { method: "GET", headers }
  );

  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }

  const data: RecruiterAccountResponse = await res.json();
  if (!data.success)
    throw new Error(data.message || "Failed to fetch recruiter account");

  // Optionally parse JSON strings to arrays
  if (
    Array.isArray(data.data.companyId.links) &&
    data.data.companyId.links.length === 1
  ) {
    try {
      data.data.companyId.links = JSON.parse(data.data.companyId.links[0]);
    } catch {}
  }
  if (
    Array.isArray(data.data.companyId.service) &&
    data.data.companyId.service.length === 1
  ) {
    try {
      data.data.companyId.service = JSON.parse(data.data.companyId.service[0]);
    } catch {}
  }

  return data;
};

// Function to fetch jobs from the API
const fetchJobs = async (token?: string): Promise<ApiResponse> => {
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
    const data: ApiResponse = await response.json();
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

// Function to fetch applicants for a specific job
const fetchApplicants = async (
  jobId: string,
  token?: string
): Promise<ApplicantsApiResponse> => {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/applied-jobs/job/${jobId}`,
      {
        method: "GET",
        headers,
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: ApplicantsApiResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch applicants");
    }
    return data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
};

const updateApplicantStatus = async (
  applicantId: string,
  status: string,
  token?: string
): Promise<UpdateStatusResponse> => {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Show loading toast
    const toastId = toast.loading("Updating applicant status...");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/applied-jobs/${applicantId}/status`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: UpdateStatusResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to update status");
    }

    // Update toast to success
    toast.success("Status updated successfully!", { id: toastId });

    return data;
  } catch (error) {
    // Show error toast
    toast.error(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
    throw error;
  }
};

// Function to delete a job
const deleteJob = async (
  jobId: string,
  token?: string
): Promise<DeleteJobResponse> => {
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

  // Fetch jobs
  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
  } = useQuery<ApiResponse, Error>({
    queryKey: ["jobs", token],
    queryFn: () => fetchJobs(token),
  });

  console.log(jobsData);

  // Get the first job ID dynamically
  const firstJobId = jobsData?.data?.[0]?._id;

  // Fetch applicants for the first job
  const {
    data: applicantsData,
    isLoading: applicantsLoading,
    error: applicantsError,
  } = useQuery<ApplicantsApiResponse, Error>({
    queryKey: ["applicants", firstJobId, token],
    queryFn: () => fetchApplicants(firstJobId!, token),
    enabled: !!firstJobId,
  });

  console.log("Applicants", jobsData);

  const {
    data: recruiterAccount,
    isLoading: recruiterAccountLoading,
    error: recruiterAccountError,
  } = useQuery<RecruiterAccountResponse, Error>({
    queryKey: ["recruiter", session?.user?.id, token],
    queryFn: () => fetchRecruiterAccount(session?.user?.id!, token),
    enabled: !!session?.user?.id && !!token, // only run when we have both
  });

  console.log("recruiterAccount", recruiterAccount);

  // Mutation for updating applicant status
  const statusMutation = useMutation<
    UpdateStatusResponse,
    Error,
    { applicantId: string; status: string }
  >({
    mutationFn: ({ applicantId, status }) =>
      updateApplicantStatus(applicantId, status, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants", firstJobId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  // Mutation for deleting a job
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

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Default to empty arrays to simplify data access
  const jobs = jobsData?.data ?? [];
  const applicants = applicantsData?.data ?? [];

  // Handle delete button click
  const handleDeleteClick = (jobId: string) => {
    setDeleteJobId(jobId);
    setIsDeleteModalOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (deleteJobId) {
      deleteMutation.mutate(deleteJobId);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <h1 className="text-[48px] text-[#131313] font-bold text-center mb-8">
          Recruiter Dashboard
        </h1>

        {/* Recruiter Information Section */}
        <section className="mb-10">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-4 border-b border-[#999999] pb-3">
              <div>
                <h2 className="text-3xl font-bold text-[#131313]">
                  Recruiter Information
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
              {/* Left Column */}
              <div className="flex flex-col gap-6">
                <div className="flex items-start space-x-3">
                  <Image
                    src="/assets/Layer_2_1_.png"
                    alt="Company Logo"
                    width={1000}
                    height={1000}
                    className="mt-1 w-[50px] h-[48px]"
                  />
                  <div>
                    <p className="font-medium text-[22px] text-[#000000]">
                      Company Name
                    </p>
                    <p className="text-[18px] text-[#707070]">
                      TechNova Solutions
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[22px] text-[#000000]">
                    About Us
                  </p>
                  <p className="text-base text-[#707070] leading-relaxed">
                    {recruiterAccount?.data?.aboutUs}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                <div>
                  <p className="font-medium text-[22px] text-[#000000]">
                    Email
                  </p>
                  <p className="text-[18px] text-[#707070]">
                    {recruiterAccount?.data?.emailAddress}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-[#131313]">Website</p>
                  <Link
                    href="#"
                    className="text-[18px] text-[#707070] underline"
                  >
                    yourwebsite.com
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Elevator Pitch Section */}
        <section className="mb-10">
          <h2 className="text-[32px] text-[#4D4D4D] font-semibold mb-4 text-center">
            Your Elevator Pitch
          </h2>
          <div className="relative w-full h-[500px] mx-auto aspect-video rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/video-placeholder.png"
              alt="Elevator Pitch Video Thumbnail"
              layout="fill"
              objectFit="cover"
              className="w-full h-full"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
              <Button className="rounded-full w-16 h-16 bg-white bg-opacity-80 text-gray-800 hover:bg-white transition-colors flex items-center justify-center">
                <PlayIcon className="w-8 h-8 fill-current" />
                <span className="sr-only">Play video</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Your Jobs Section */}
        <section className="mb-10">
          <h2 className="text-2xl text-[#000000] font-semibold mb-4">
            Your Jobs
          </h2>
          <div className="rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Job Title
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Applicants
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Status
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Deadline
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Actions
                  </TableHead>
                  <TableHead className="text-base text-[#2B7FD0] font-bold">
                    Deactivation Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsLoading ? (
                  Array.from({ length: jobs.length || 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : jobsError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-red-600">
                      Error loading jobs: {jobsError.message}
                    </TableCell>
                  </TableRow>
                ) : jobs.length > 0 ? (
                  jobs.map((job: Job) => (
                    <TableRow
                      key={job._id}
                      className="text-base text-[#000000] font-medium"
                    >
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.vacancy}</TableCell>
                      <TableCell>
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)}
                      </TableCell>
                      <TableCell>{formatDate(job.deadline)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/candidate-list/${job._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(job.deadline)}</TableCell>
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
        </section>

        {/* Job Cards Section */}
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-[907px] mx-auto">
            {jobsLoading ? (
              Array.from({ length: jobs.length || 4 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-6 w-64 mb-4" />
                    <div className="flex justify-between pt-10">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-12 w-20 rounded-[8px]" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <div className="space-x-2">
                      <Skeleton className="h-10 w-[160px]" />
                      <Skeleton className="h-10 w-[160px]" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : jobsError ? (
              <div className="text-center text-red-600 col-span-2">
                Error loading jobs: {jobsError.message}
              </div>
            ) : jobs.length > 0 ? (
              jobs.map((job: Job) => (
                <Card key={job._id}>
                  <CardHeader>
                    <CardTitle className="text-[#000000] text-2xl font-normal">
                      <span className="font-semibold">Job Title :</span>{" "}
                      {job.title}
                    </CardTitle>
                    <div className="flex justify-between pt-10">
                      <CardDescription className="text-base text-[#000000] font-normal">
                        <span className="font-semibold">Status:</span>{" "}
                        {job.shift}
                        <br />
                        <span className="font-semibold">Posted:</span>{" "}
                        {formatDate(job.createdAt)}
                      </CardDescription>
                      <div className="text-2xl font-bold text-[#000000] bg-[#E6F3FF] px-4 py-2 rounded-[8px]">
                        {job.vacancy}
                        <p className="text-sm font-normal text-gray-500">
                          Applicants
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <div className="space-x-2">
                      <Button
                        className="bg-red-600 w-[160px] hover:bg-red-700 text-white text-base"
                        onClick={() => handleDeleteClick(job._id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending && deleteJobId === job._id
                          ? "Deleting..."
                          : "Delete"}
                      </Button>
                      <Link
                        href={`/single-job/${job._id}`}
                        className="w-[160px] text-base text-[#000000]"
                      >
                        <Button
                          className="w-[160px] text-base text-[#000000]"
                          variant="outline"
                        >
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center col-span-2">No jobs found</div>
            )}
          </div>
        </section>

        <JobList />

        {/* Applicant List Section */}
        <section className="mb-10">
          <div className="overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 items-center p-4 border-b font-semibold text-2xl text-[#000000] pb-10">
              <div className="col-span-2">Picture</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Experience</div>
              <div className="col-span-2">Applied</div>
              <div className="col-span-3">Actions</div>
            </div>

            {/* Applicant Rows */}
            <div className="divide-y border-none">
              {applicantsLoading ? (
                Array.from({ length: applicants.length || 3 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 items-center p-4 bg-[#E6F3FF] text-[#000000] text-xl"
                    >
                      <div className="col-span-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                      </div>
                      <div className="col-span-3">
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="col-span-2">
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="col-span-2">
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="col-span-3 flex space-x-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  )
                )
              ) : applicantsError ? (
                <div className="grid grid-cols-12 items-center p crescita 4 text-center text-red-600">
                  <div className="col-span-12">
                    Error loading applicants: {applicantsError.message}
                  </div>
                </div>
              ) : applicants.length > 0 ? (
                applicants.map((applicant: Applicant) => (
                  <div
                    key={applicant._id}
                    className="grid grid-cols-12 items-center p-4 bg-[#E6F3FF] text-[#000000] text-xl"
                  >
                    <div className="col-span-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/applicant-profile.png" />
                        <AvatarFallback>
                          {applicant.userId.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="col-span-3 font-medium">
                      {applicant.userId.name}
                    </div>
                    <div className="col-span-2">N/A</div>
                    <div className="col-span-2">
                      {formatDate(applicant.createdAt)}
                    </div>
                    <div className="col-span-3 flex space-x-2">
                      <Button
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent text-sm h-8"
                      >
                        Applicant Details
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white text-sm h-8"
                        onClick={() =>
                          statusMutation.mutate({
                            applicantId: applicant._id,
                            status: "shortlisted",
                          })
                        }
                        disabled={statusMutation.isPending}
                      >
                        {statusMutation.isPending ? "Updating..." : "Shortlist"}
                      </Button>
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white text-sm h-8"
                        onClick={() =>
                          statusMutation.mutate({
                            applicantId: applicant._id,
                            status: "rejected",
                          })
                        }
                        disabled={statusMutation.isPending}
                      >
                        {statusMutation.isPending ? "Updating..." : "Reject"}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-12 items-center p-4 text-center">
                  <div className="col-span-12">No applicants found</div>
                </div>
              )}
            </div>
            <p className="text-base text-[#000000] font-semibold text-right mt-8 cursor-pointer">
              See All
            </p>
          </div>
        </section>

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
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Post A Job Button */}
        <div className="text-center mt-10">
          <Link href="/add-job">
            <Button className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/85 text-white px-8 py-3 text-lg">
              Post A Job
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
