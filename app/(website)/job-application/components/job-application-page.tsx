"use client";
import type React from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Resume {
  id: string;
  name: string;
  lastUsed: string;
  url?: string;
  selected?: boolean;
}

interface UserData {
  id?: string;
  name?: string;
  avatar?: { url: string };
  address?: string;
  email?: string;
  phoneNum?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  dribbbleUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  role?: string;
}

interface UserDataResponse {
  data: UserData;
}

interface CustomQuestion {
  question: string;
  _id: string;
}

interface ApplicationRequirement {
  requirement: string;
  status: string;
  _id: string;
}

interface JobDetailsResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    title: string;
    customQuestion: CustomQuestion[];
    applicationRequirement: ApplicationRequirement[];
  };
}

interface JobApplicationPageProps {
  jobId: string;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    aria-label="Loading"
  ></div>
);

export default function JobApplicationPage({ jobId }: JobApplicationPageProps) {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const router = useRouter();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [agreedToShareCV, setAgreedToShareCV] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error(
      "NEXT_PUBLIC_BASE_URL is not defined at 11:31 AM +06, 2025-09-14"
    );
    toast.error("Application configuration error. Please contact support.");
  }

  // Fetch user data
  const { data, isLoading, error } = useQuery<UserDataResponse>({
    queryKey: ["user", token],
    queryFn: async () => {
      if (!token || !baseUrl) throw new Error("Missing token or base URL");
      const response = await fetch(`${baseUrl}/user/single`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch user data");
      return response.json();
    },
    enabled: !!token,
  });

  // Fetch job data
  const {
    data: jobData,
    isLoading: isJobLoading,
    error: jobError,
  } = useQuery<JobDetailsResponse>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      if (!jobId || jobId === "undefined") throw new Error("Invalid job ID");
      const response = await fetch(`${baseUrl}/jobs/${jobId}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch job details");
      return data as JobDetailsResponse;
    },
    enabled: Boolean(jobId && jobId !== "undefined"),
  });

  // Check if resume is required
  const isResumeRequired = jobData?.data.applicationRequirement?.some(
    (req) => req.requirement === "Resume" && req.status === "Required"
  );

  const isResumeOptional = jobData?.data.applicationRequirement?.some(
    (req) => req.requirement === "Resume" && req.status === "Optional"
  );

  // Upload resume mutation
  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!token || !baseUrl) throw new Error("Missing token or base URL");
      const formData = new FormData();
      formData.append("resumes", file);
      formData.append("userId", userId || "");

      const response = await fetch(`${baseUrl}/resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload resume");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Resume uploaded successfully!");
      const newResume: Resume = {
        id: data.data?._id || Date.now().toString(),
        name:
          data.data?.file[0]?.filename ||
          uploadedFile?.name ||
          "Uploaded Resume.pdf",
        lastUsed: new Date().toLocaleDateString("en-US", {
          timeZone: "Asia/Dhaka",
        }),
        url: data.data?.file[0]?.url?.startsWith("undefined")
          ? `${baseUrl}${data.data.file[0].url.replace("undefined", "")}`
          : data.data?.file[0]?.url,
        selected: true,
      };
      setResumes((prev) => [
        ...prev.map((r) => ({ ...r, selected: false })),
        newResume,
      ]);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload resume");
    },
  });

  // Apply job mutation
  const applyJobMutation = useMutation({
    mutationFn: async ({
      jobId,
      userId,
      resumeId,
      answer,
    }: {
      jobId: string;
      userId: string;
      resumeId?: string; // Make resumeId optional
      answer: { question: string; ans: string }[];
    }) => {
      if (!token || !baseUrl) throw new Error("Missing token or base URL");

      const requestBody: any = {
        jobId,
        userId,
        answer,
      };

      // Only include resumeId if it's provided (for required or optional resume cases)
      if (resumeId) {
        requestBody.resumeId = resumeId;
      }

      const response = await fetch(`${baseUrl}/applied-jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit application");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["job-applications", userId] });
      setResumes((prev) =>
        prev.map((r, index) => ({
          ...r,
          selected: index === 0 && !prev.some((r) => r.selected),
        }))
      );
      setUploadedFile(null);
      setAgreedToShareCV(false);
      setAnswers({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.push("/alljobs");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit application");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      uploadResumeMutation.mutate(file);
    } else {
      toast.error("Please select a valid PDF file.");
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionStatus === "loading") {
      toast.info("Please wait, checking authentication...");
      return;
    }
    if (!userId) {
      toast.error("Please log in to apply for this job.");
      return;
    }
    if (!jobId) {
      toast.error("Job ID is missing. Please try again.");
      return;
    }
    if (!agreedToShareCV) {
      toast.error("Please agree to share your CV.");
      return;
    }

    // Resume validation based on requirement
    const selectedResume = resumes.find((r) => r.selected);

    if (isResumeRequired && !selectedResume) {
      toast.error(
        "Please select or upload a resume (required for this application)."
      );
      return;
    }

    // For optional resume, we can proceed without a resume
    const resumeId = selectedResume?.id;

    const customQuestions = jobData?.data.customQuestion || [];
    const answeredQuestions = Object.keys(answers);
    const missingAnswers = customQuestions.filter(
      (q) => !answeredQuestions.includes(q._id) || !answers[q._id].trim()
    );
    if (missingAnswers.length > 0) {
      toast.error("Please answer all custom questions.");
      return;
    }

    const answer = customQuestions.map((q) => ({
      question: q.question,
      ans: answers[q._id] || "",
    }));

    applyJobMutation.mutate({
      jobId,
      userId,
      resumeId, // This will be undefined for optional resumes if none selected
      answer,
    });
  };

  const userData: UserData = data?.data || {};

  return (
    <div className="container mx-auto">
      <div>
        <div className="hidden md:block">
          <div className="flex items-center text-[18px] text-gray-500 my-6">
            <Link
              href="/alljobs"
              className="flex items-center hover:underline text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Jobs
            </Link>
            <span className="mx-2">{">"}</span>
            <Link href="/alljobs" className="hover:underline">
              All Jobs
            </Link>
            <span className="mx-2">{">"}</span>
            <Link href={`/alljobs/${jobId}`} className="hover:underline">
              Job Details
            </Link>
            <span className="mx-2">{">"}</span>
            <span>Job Application</span>
          </div>
        </div>
        <h1 className="text-3xl text-center font-bold mb-8 mt-8 md:mt-0">
          Job Application
        </h1>
        <div className="grid grid-cols-8 gap-6">
          <div className="col-span-8 lg:col-span-2">
            <div className="flex flex-col items-center text-center">
              <Image
                src={
                  userData.avatar?.url ||
                  "/placeholder.svg?height=170&width=170&query=user avatar"
                }
                alt={userData.name || "User"}
                width={170}
                height={170}
                className="rounded mb-4 object-cover w-[170px] h-[170px]"
              />
              <div className="mb-4">
                <h2 className="text-[25px] font-semibold">
                  {userData.name || "Unknown User"}
                </h2>
                <p className="text-[#131313] text-[18px] font-normal">
                  {userData.role
                    ? userData.role.charAt(0).toUpperCase() +
                      userData.role.slice(1)
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-8 lg:col-span-6">
            <h2 className="text-[40px] font-semibold mb-4 border-b pb-4">
              Contact Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <p className="text-black text-[22px] font-semibold">Location</p>
                <p className="font-normal text-[20px] text-[#707070]">
                  {userData.address || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-black text-[22px] font-semibold">Email</p>
                <p className="font-normal text-[20px] text-[#707070]">
                  {userData.email || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-black text-[22px] font-semibold">Phone</p>
                <p className="font-normal text-[20px] text-[#707070]">
                  {userData.phoneNum || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-black text-[22px] font-semibold">
                  LinkedIn URL
                </p>
                <p className="font-normal text-[20px] text-[#707070]">
                  <Link
                    href={userData.linkedinUrl || "#"}
                    className="hover:underline"
                  >
                    {userData.linkedinUrl || "Not provided"}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {(jobData?.data.customQuestion?.length ?? 0) > 0 && (
          <div className="my-12">
            <h2 className="text-[40px] font-semibold mb-4 border-b pb-4">
              Custom Questions
            </h2>
            <div className="space-y-6">
              {jobData?.data.customQuestion.map((question) => (
                <div key={question._id}>
                  <Label
                    htmlFor={`question-${question._id}`}
                    className="block text-lg font-medium mb-2"
                  >
                    {question.question} *
                  </Label>
                  <Textarea
                    id={`question-${question._id}`}
                    value={answers[question._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question._id, e.target.value)
                    }
                    placeholder="Enter your answer here"
                    className="w-full min-h-[100px]"
                    aria-label={`Answer for ${question.question}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditionally render resume section based on requirement */}
        {(isResumeRequired || isResumeOptional) && (
          <div className="my-12">
            <h2 className="text-[40px] font-semibold mb-4 border-b pb-4">
              Resume {isResumeRequired ? "(Required)" : "(Optional)"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    {uploadedFile
                      ? `Selected: ${uploadedFile.name}`
                      : "Drop your PDF resume here"}
                  </p>
                  <input
                    type="file"
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    aria-label="Upload resume"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadResumeMutation.isPending}
                  >
                    {uploadResumeMutation.isPending
                      ? "Uploading..."
                      : "Choose File"}
                  </Button>
                  {isResumeOptional && (
                    <p className="text-sm text-gray-500 mt-2">
                      Resume is optional for this application
                    </p>
                  )}
                </div>

                {/* Display uploaded resumes for selection */}
                {resumes.length > 0 && (
                  <div className="mt-4">
                    <Label className="block text-lg font-medium mb-2">
                      Select a resume:
                    </Label>
                    <div className="space-y-2">
                      {resumes.map((resume) => (
                        <div
                          key={resume.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="radio"
                            id={`resume-${resume.id}`}
                            name="selectedResume"
                            checked={resume.selected || false}
                            onChange={() => {
                              setResumes((prev) =>
                                prev.map((r) => ({
                                  ...r,
                                  selected: r.id === resume.id,
                                }))
                              );
                            }}
                            className="w-4 h-4"
                          />
                          <Label
                            htmlFor={`resume-${resume.id}`}
                            className="flex-1"
                          >
                            {resume.name} - Last used: {resume.lastUsed}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agree-cv"
                    checked={agreedToShareCV}
                    onCheckedChange={(checked) => setAgreedToShareCV(!!checked)}
                  />
                  <Label htmlFor="agree-cv" className="text-sm text-gray-700">
                    I agree to my CV being shared with the Recruiter for the
                    role I am applying for
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-blue-700 py-6 text-lg"
                disabled={
                  applyJobMutation.isPending ||
                  sessionStatus === "loading" ||
                  uploadResumeMutation.isPending
                }
              >
                {applyJobMutation.isPending
                  ? "Submitting..."
                  : "Submit Application"}
              </Button>
            </form>
          </div>
        )}

        {/* If no resume section is needed at all */}
        {!isResumeRequired && !isResumeOptional && (
          <div className="my-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex items-center justify-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agree-cv"
                    checked={agreedToShareCV}
                    onCheckedChange={(checked) => setAgreedToShareCV(!!checked)}
                  />
                  <Label htmlFor="agree-cv" className="text-sm text-gray-700">
                    I agree to my CV being shared with the Recruiter for the
                    role I am applying for
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-blue-700 py-6 text-lg"
                disabled={
                  applyJobMutation.isPending || sessionStatus === "loading"
                }
              >
                {applyJobMutation.isPending
                  ? "Submitting..."
                  : "Submit Application"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
