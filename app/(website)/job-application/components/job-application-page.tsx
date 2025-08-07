"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Linkedin,
  Twitter,
  Dribbble,
  Facebook,
  Instagram,
  Upload,
  Trash,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface JobApplicationPageProps {
  jobId?: string;
}

export default function JobApplicationPage({ jobId }: JobApplicationPageProps) {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [visaSponsorship, setVisaSponsorship] = useState<string | undefined>(
    undefined
  );
  const [elevatorPitchUrl, setElevatorPitchUrl] = useState("");
  const [agreedToShareCV, setAgreedToShareCV] = useState(false);
  const [resumes, setResumes] = useState([
    { id: "1", name: "CV - 1.pdf", lastUsed: "2/28/2025", selected: true },
    { id: "2", name: "CV - 2.pdf", lastUsed: "2/28/2025", selected: false },
    { id: "3", name: "CV - 3.pdf", lastUsed: "2/28/2025", selected: false },
  ]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyJobMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!token) {
        throw new Error("Authentication token not available. Please log in.");
      }
      const response = await fetch(
        "https://giveandtake-backend.onrender.com/api/v1/job-applications",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit application");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your job application has been submitted successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["job-applications", userId] });
      // Reset form
      setVisaSponsorship(undefined);
      setElevatorPitchUrl("");
      setAgreedToShareCV(false);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description:
          error.message || "There was an error submitting your application.",
        variant: "destructive",
      });
    },
  });

  const { data } = useQuery({
    queryKey: ["user", token],
    queryFn: async () => {
      const response = await fetch(
        "https://giveandtake-backend.onrender.com/api/v1/user/single",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.json();
    },
  });

  const userData = data?.data || {};

  const handleResumeSelection = (id: string) => {
    setResumes(resumes.map((r) => ({ ...r, selected: r.id === id })));
  };

  const handleResumeDelete = (id: string) => {
    setResumes(resumes.filter((r) => r.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionStatus === "loading") {
      toast({
        title: "Please wait",
        description: "Session is loading. Please try again in a moment.",
      });
      return;
    }
    if (!userId) {
      toast({
        title: "Not logged in",
        description: "Please log in to submit your application.",
        variant: "destructive",
      });
      return;
    }
    if (!visaSponsorship) {
      toast({
        title: "Missing Information",
        description: "Please specify if visa sponsorship is required.",
        variant: "destructive",
      });
      return;
    }
    if (!agreedToShareCV) {
      toast({
        title: "Agreement Required",
        description: "You must agree to share your CV with the recruiter.",
        variant: "destructive",
      });
      return;
    }
    const selectedResume = resumes.find((r) => r.selected);
    if (!selectedResume && !uploadedFile) {
      toast({
        title: "Resume Required",
        description: "Please select a resume or upload a new one.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("jobId", jobId || "");
    formData.append("userId", userId);
    formData.append("visaSponsorship", visaSponsorship);
    formData.append("elevatorPitchUrl", elevatorPitchUrl);
    formData.append("agreedToShareCV", agreedToShareCV.toString());
    if (selectedResume) {
      formData.append("resumeId", selectedResume.id);
    }
    if (uploadedFile) {
      formData.append("resume", uploadedFile);
    }

    applyJobMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto">
      <div className="">
        <div className="hidden md:block">
          <div className="flex items-center text-[18px] text-gray-500 my-6 ">
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
            <span className="">Job Application</span>
          </div>
        </div>

        <h1 className="text-3xl text-center font-bold mb-8 mt-8 md:mt-0">Job Application</h1>

        <div className="grid grid-cols-8 gap-6">
          <div className="col-span-8 lg:col-span-2">
            <div className="flex flex-col items-center text-center">
              <Image
                src={
                  userData.avatar?.url ||
                  "/placeholder.svg?height=120&width=120"
                }
                alt={userData.name || "User"}
                width={500}
                height={500}
                className="rounded mb-4 object-cover w-[170px] h-[170px]"
              />
              <div className="mb-4">
                <h2 className="text-[40px] font-semibold">
                  {userData.name || "Unknown User"}
                </h2>
                <p className="text[#131313] text-[18px] font-normal">
                  Product Designer
                </p>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-2">
                  <div className="border border-[#9EC7DC] rounded p-2 hover:bg-[#9EC7DC]">
                    <Link href="#" aria-label="LinkedIn">
                      <Linkedin className="h-5 w-5 text-gray-500 hover:text-blue-600" />
                    </Link>
                  </div>
                  <div className="border border-[#9EC7DC] rounded p-2 hover:bg-[#9EC7DC]">
                    <Link href="#" aria-label="Twitter">
                      <Twitter className="h-5 w-5 text-gray-500 hover:text-blue-400" />
                    </Link>
                  </div>
                  <div className="border border-[#9EC7DC] rounded p-2 hover:bg-[#9EC7DC]">
                    <Link href="#" aria-label="Dribbble">
                      <Dribbble className="h-5 w-5 text-gray-500 hover:text-pink-500" />
                    </Link>
                  </div>
                  <div className="border border-[#9EC7DC] rounded p-2 hover:bg-[#9EC7DC]">
                    <Link href="#" aria-label="Facebook">
                      <Facebook className="h-5 w-5 text-gray-500 hover:text-blue-700" />
                    </Link>
                  </div>
                  <div className="border border-[#9EC7DC] rounded p-2 hover:bg-[#9EC7DC]">
                    <Link href="#" aria-label="Instagram">
                      <Instagram className="h-5 w-5 text-gray-500 hover:text-purple-600" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-8 lg:col-span-6">
            <h2 className="text-[40px] font-semibold mb-4 border-b pb-4">
              Contact Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Location */}
              <div>
                <p className="text-black text-[22px] font-semibold">Location</p>
                <p className="font-normal text-[20px] text-[#707070]">
                  {userData.address || "Not provided"}
                </p>
              </div>

              {/* Email */}
              <div>
                <p className="text-black text-[22px] font-semibold">Email</p>
                <p className="font-normal text-[20px] text-[#707070]">
                  {userData.email || "Not provided"}
                </p>
              </div>

              {/* Phone */}
              <div>
                <p className="text-black text-[22px] font-semibold">Phone</p>
                <p className="font-normal text-[20px] text-[#707070]">
                  {userData.phoneNum || "Not provided"}
                </p>
              </div>
              {/* Phone */}
              <div>
                <p className="text-black text-[22px] font-semibold">
                  Linkedin URL 
                </p>
                <p className="font-normal text-[20px] text-[#707070]">
                  <Link href={userData.linkedinUrl || "#"}>
                    {userData.linkedinUrl || "Not provided"}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="my-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* <div>
              <Label className="block text-lg font-medium mb-3">
                Would you require Visa Sponsorship for the role you are applying
                for, now or in the next 2 years?
              </Label>
              <RadioGroup
                value={visaSponsorship}
                onValueChange={setVisaSponsorship}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="visa-yes" />
                  <Label htmlFor="visa-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="visa-no" />
                  <Label htmlFor="visa-no">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label
                htmlFor="elevator-pitch"
                className="block text-lg font-medium mb-3"
              >
                Elevator Pitch URL
              </Label>
              <Input
                id="elevator-pitch"
                placeholder="Please enter Elevator Pitch URL"
                value={elevatorPitchUrl}
                onChange={(e) => setElevatorPitchUrl(e.target.value)}
              />
            </div> */}

            <div>
              <Label className="block text-lg font-medium mb-4">Resume *</Label>
              <div className="space-y-3 mb-6">
                {resumes.map((resume) => (
                  <Card
                    key={resume.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-600 flex items-center justify-center rounded-md mr-3">
                        <span className="text-white font-bold text-xs">
                          PDF
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{resume.name}</p>
                        <p className="text-gray-500 text-sm">
                          Last used {resume.lastUsed}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <RadioGroup
                        value={resumes.find((r) => r.selected)?.id}
                        onValueChange={() => handleResumeSelection(resume.id)}
                      >
                        <RadioGroupItem
                          value={resume.id}
                          id={`resume-${resume.id}`}
                        />
                      </RadioGroup>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleResumeDelete(resume.id)}
                        aria-label={`Delete ${resume.name}`}
                      >
                        <Trash className="h-5 w-5 text-gray-500 hover:text-red-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  {uploadedFile
                    ? `Selected: ${uploadedFile.name}`
                    : "Drop your files here"}
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree-cv"
                  checked={agreedToShareCV}
                  onCheckedChange={(checked) => setAgreedToShareCV(!!checked)}
                />
                <Label htmlFor="agree-cv" className="text-sm text-gray-700">
                  I agree to my CV being shared with the Recruiter for the role
                  I am applying for
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
              disabled={
                applyJobMutation.isPending || sessionStatus === "loading"
              }
            >
              {applyJobMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
