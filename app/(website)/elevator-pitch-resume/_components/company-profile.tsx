"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialIcon } from "@/components/company/social-icon";
import { VideoPlayer } from "@/components/company/video-player";
import { ElevatorPitchUpload } from "./elevator-pitch-upload"; // Assumed component
import {
  fetchCompanyDetails,
  uploadElevatorPitch,
  deleteElevatorPitchVideo,
} from "@/lib/api-service";
import {
  MapPin,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash,
  Trash2,
  RefreshCw,
} from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner"; // For toast notifications
import SocialLinks from "./SocialLinks";

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

interface EmployeeData {
  _id: string;
  name: string;
  email: string;
  phoneNum: string;
  photo: {
    url: string;
  };
  role: string;
  skills: string[];
}

interface EmployeeApiResponse {
  success: boolean;
  message: string;
  data: {
    company: {
      _id: string;
      cname: string;
      industry: string;
      aboutUs: string;
      country: string;
      city: string;
    };
    employees: EmployeeData[];
    meta: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

export default function CompanyProfilePage({ userId }: { userId?: string }) {
  const { data: session } = useSession();
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [isElevatorPitchUploaded, setIsElevatorPitchUploaded] =
    useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: companyData,
    isLoading: isLoadingCompany,
    isError: isCompanyError,
    error: companyError,
    refetch,
  } = useQuery({
    queryKey: ["company", userId],
    queryFn: () => fetchCompanyDetails(userId as string),
    enabled: !!userId,
  });

  const company = companyData?.companies?.[0];
  const companyId = company?._id;

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
      return (json?.data as Job[]) ?? (json as Job[]) ?? [];
    },
  });

  const {
    data: employeeData,
    isLoading: isLoadingEmployees,
    isError: isEmployeesError,
    error: employeesError,
  } = useQuery<EmployeeApiResponse, Error>({
    queryKey: ["employees", companyId, currentPage],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/company-employess/skills/${company.userId}?page=${currentPage}`
      );
      if (!res.ok) {
        throw new Error(
          res.status === 404 ? "Company not found" : "Failed to fetch employees"
        );
      }
      const response = (await res.json()) as EmployeeApiResponse;
      if (!response.success) {
        throw new Error(
          response.message || "API returned an unsuccessful response"
        );
      }
      return response;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    enabled: !!companyId,
  });

  const deleteMutation = useMutation<DeleteResponse, Error, string>({
    mutationFn: async (employeeId: string) => {
      const companyRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/${companyId}`
      );
      if (!companyRes.ok) {
        throw new Error("Failed to fetch company data");
      }
      const companyData = await companyRes.json();
      const currentEmployeesId = companyData.data.companies[0].employeesId;

      const updatedEmployeesId = currentEmployeesId.filter(
        (id: string) => id !== employeeId
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/${companyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeesId: updatedEmployeesId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete employee");
      }

      const response = (await res.json()) as DeleteResponse;
      if (!response.success) {
        throw new Error(response.message || "Failed to delete employee");
      }
      return response;
    },
    onMutate: async (employeeId: string) => {
      await queryClient.cancelQueries({
        queryKey: ["employees", companyId, currentPage],
      });

      const previousData = queryClient.getQueryData([
        "employees",
        companyId,
        currentPage,
      ]);

      queryClient.setQueryData(
        ["employees", companyId, currentPage],
        (old: EmployeeApiResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              employees: old.data.employees.filter((e) => e._id !== employeeId),
            },
          };
        }
      );

      return { previousData };
    },
    onError: (err, employeeId, context) => {
      const ctx = context as { previousData?: EmployeeApiResponse } | undefined;
      queryClient.setQueryData(
        ["employees", companyId, currentPage],
        ctx?.previousData
      );
      console.error(
        "Error deleting employee:",
        err instanceof Error ? err.message : err
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees", companyId, currentPage],
      });
    },
  });

  const uploadElevatorPitchMutation = useMutation({
    mutationFn: uploadElevatorPitch,
    onSuccess: () => {
      toast.success("Elevator pitch uploaded successfully!");
      setIsElevatorPitchUploaded(true);
      setElevatorPitchFile(null);
      queryClient.invalidateQueries({ queryKey: ["company", userId] }); // Invalidate to refetch pitch data
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload video");
      setIsElevatorPitchUploaded(false);
    },
  });

  const deleteElevatorPitchMutation = useMutation({
    mutationFn: deleteElevatorPitchVideo,
    onSuccess: () => {
      toast.success("Elevator pitch deleted successfully!");
      setIsElevatorPitchUploaded(false);
      setElevatorPitchFile(null);
      setIsDeleteModalOpen(false);
      setPitchData(null); // Clear pitch data
      queryClient.invalidateQueries({ queryKey: ["company", userId] }); // Invalidate to refetch pitch data
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete elevator pitch.");
      console.error("Error deleting elevator pitch:", error);
    },
  });

  const handleElevatorPitchUpload = async () => {
    if (elevatorPitchFile && userId) {
      try {
        await uploadElevatorPitchMutation.mutateAsync({
          videoFile: elevatorPitchFile,
          userId,
        });
      } catch (error) {
        // Error toast is handled in mutation onError
      }
    } else {
      toast.error("Please select a video file to upload");
    }
  };

  const handleDeleteElevatorPitch = async () => {
    if (userId && pitchData) {
      try {
        await deleteElevatorPitchMutation.mutateAsync(userId);
      } catch (error) {
        // Error toast is handled in mutation onError
      }
    }
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDelete = (employeeId: string) => {
    deleteMutation.mutate(employeeId);
  };

  const recruiters: EmployeeData[] = employeeData?.data?.employees || [];
  const totalPages = employeeData?.data?.meta?.totalPages || 1;

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

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
          setIsElevatorPitchUploaded(true);
        } else {
          setError("No pitch found for current user");
          setIsElevatorPitchUploaded(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setIsElevatorPitchUploaded(false);
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

  if (isCompanyError || !companyData?.companies?.[0]) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
        <p className="text-red-500">
          Error: {companyError?.message || "Company not found"}
        </p>
        <Button
          onClick={() => refetch()}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const honors = companyData.honors || [];
  const links = companyData.companies[0].links || [];
  const services = companyData.companies[0].service || [];

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
            </div>

            <div className="flex gap-2">
              <div>
                <SocialLinks sLink={company.sLink} />
              </div>
            </div>
            <div className="mt-4">
              <Link href="/add-job">
                <Button className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/85 text-white px-10 py-4 text-lg shadow-md">
                  Post A Job
                </Button>
              </Link>
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
            <Link href={`/manage-jobs/${company._id}`}>
              <Button className="bg-primary hover:bg-primary/90 text-white px-6 mr-2">
                Manage Jobs
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

      {/* Elevator Pitch */}
      <div className="lg:pb-12 pb-5">
        <h2 className="text-xl lg:text-4xl font-bold text-center my-10 text-gray-900">
          Elevator Pitch
        </h2>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Elevator Pitch</CardTitle>
              {pitchData && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={openDeleteModal}
                  disabled={deleteElevatorPitchMutation.isPending}
                  title="Delete Elevator Pitch"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Upload or view a short video introducing your company.
            </p>
          </CardHeader>
          <CardContent>
            {pitchData ? (
              <VideoPlayer pitchId={pitchData._id} className="w-full mx-auto" />
            ) : loading ? (
              <div>Loading pitch...</div>
            ) : error && error !== "No pitch found for current user" ? (
              <div className="text-red-500">Error: {error}</div>
            ) : (
              <>
                <ElevatorPitchUpload
                  onFileSelect={setElevatorPitchFile}
                  selectedFile={elevatorPitchFile}
                />
                <Button
                  type="button"
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleElevatorPitchUpload}
                  disabled={
                    uploadElevatorPitchMutation.isPending || !elevatorPitchFile
                  }
                >
                  {uploadElevatorPitchMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    "Upload Elevator Pitch"
                  )}
                </Button>
                {isElevatorPitchUploaded && (
                  <p className="mt-2 text-sm text-green-600">
                    Elevator pitch uploaded successfully!
                  </p>
                )}
                {!isElevatorPitchUploaded && !elevatorPitchFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    No pitch available
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete your elevator pitch? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                className="px-4 py-2"
              >
                No
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteElevatorPitch}
                disabled={deleteElevatorPitchMutation.isPending}
                className="px-4 py-2"
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}

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
            </div>
          </div>
        </div>
      </div>

      {/* Employees */}
      <div className="">
        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">
            Employees
          </h2>
          {isLoadingEmployees && !employeeData ? (
            <div>Loading employees...</div>
          ) : isEmployeesError ? (
            <div className="text-red-500">Error: {employeesError.message}</div>
          ) : (
            <div className="bg-white rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700">
                      Recruiter Name
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      Role
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      Phone Number
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recruiters.slice(0, 3).map((recruiter) => (
                    <TableRow key={recruiter._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={recruiter.photo.url}
                              alt={recruiter.name}
                            />
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                              {recruiter.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">
                            {recruiter.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 hover:bg-opacity-80"
                        >
                          {recruiter.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {recruiter.phoneNum}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                          onClick={() => handleDelete(recruiter._id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-center gap-2 p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant="outline"
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        currentPage === page
                          ? "bg-primary text-white border-blue-600 hover:bg-blue-700"
                          : "bg-transparent"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {deleteMutation.isPending && (
                <div className="text-center text-gray-500 pb-4">
                  Updating list...
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Link href={`/recruiter-list/${company.userId}`}>
            <Button>See all</Button>
          </Link>
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
