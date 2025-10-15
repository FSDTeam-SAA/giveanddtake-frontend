"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Info, Check, Edit, Trash, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import DOMPurify from "dompurify";
import { useQuery, useMutation } from "@tanstack/react-query";
import CustomCalendar from "@/components/MultiStepJobForm/CustomCalendar";
import { useState, useEffect } from "react";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";

interface ApplicationRequirement {
  id: string;
  label: string;
  required: boolean;
}

interface CustomQuestion {
  id: string;
  question: string;
}

interface JobPostData {
  userId: string | undefined;
  companyId: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  companyUrl: string;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  vacancy: number;
  experience: number;
  deadline: string;
  publishDate: string;
  status: string;
  jobCategoryId: string;
  employement_Type: string;
  compensation: string;
  arcrivedJob: boolean;
  applicationRequirement: { requirement: string }[];
  customQuestion: { question: string }[];
}

async function updateJob(id: string, data: JobPostData) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to update job: ${response.status} - ${
        errorData.message || "Unknown error"
      }`
    );
  }
  return response.json();
}

export default function JobPreview() {
  const session = useSession();
  const userId = session.data?.user?.id;
  const role = session.data?.user?.role;
  console.log(role);
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "6896fb2b12980e468298ad0f"; // Fallback ID for demonstration

  const [isEditing, setIsEditing] = useState(false);
  const [publishNow, setPublishNow] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    country: "",
    region: "",
    employmentType: "",
    experience: "",
    category: "",
    categoryId: "",
    compensation: "",
    expirationDate: "",
    jobDescription: "",
    publishDate: "",
    companyUrl: "",
  });
  const [applicationRequirements, setApplicationRequirements] = useState<
    ApplicationRequirement[]
  >([]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  const { data: jobData, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch job");
      }
      const res = await response.json();
      return res.data as {
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
        applicationRequirement: { _id: string; requirement: string }[];
        customQuestion: { _id: string; question: string }[];
        jobApprove: string;
        createdAt: string;
        updatedAt: string;
        __v: number;
      };
    },
  });

  useEffect(() => {
    if (jobData) {
      const createdAt = jobData.createdAt
        ? new Date(jobData.createdAt)
        : undefined;
      setSelectedDate(createdAt);
      setFormData({
        jobTitle: jobData.title || "N/A",
        department: "N/A", // Assuming department is not in jobData, or needs to be derived
        country: jobData.location?.split(", ")[0] || "N/A",
        region: jobData.location?.split(", ")[1] || "N/A",
        employmentType: jobData.shift?.toLowerCase() || "N/A",
        experience: jobData.experience ? `${jobData.experience}` : "N/A",
        category: "N/A", // Assuming category is not in jobData, or needs to be derived
        categoryId: jobData.jobCategoryId || "N/A",
        compensation: jobData.salaryRange
          ? `${jobData.salaryRange} ${jobData.compensation}`
          : "N/A",
        expirationDate: jobData.deadline
          ? new Date(jobData.deadline).toLocaleDateString()
          : "N/A",
        jobDescription: jobData.description || "N/A",
        publishDate: createdAt ? createdAt.toLocaleDateString() : "N/A",
        companyUrl: "N/A", // Assuming companyUrl is not in jobData, or needs to be derived
      });
      setApplicationRequirements(
        jobData.applicationRequirement?.map((req) => ({
          id: req._id,
          label: req.requirement.replace(" required", ""),
          required: true,
        })) || []
      );
      setCustomQuestions(
        jobData.customQuestion?.map((q) => ({
          id: q._id,
          question: q.question,
        })) || []
      );
    }
  }, [jobData]);

  const { mutate: updateJobMutation, isPending } = useMutation({
    mutationFn: (data: JobPostData) => updateJob(id, data),
    onSuccess: () => {
      toast.success("Job updated successfully!");
      setIsEditing(false);
      router.push("/jobs-success"); // Redirect after successful update
    },
    onError: (error: Error) => {
      console.error("Error updating job:", error);
      toast.error(error.message || "An error occurred while updating the job.");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Job not found
      </div>
    );
  }

  const companyUrl = formData.companyUrl; // Use formData.companyUrl for display

  const onBackToEdit = () => {
    setIsEditing(true);
  };

  const handleToggleRequired = (reqId: string, isRequired: boolean) => {
    setApplicationRequirements((prev) =>
      prev.map((req) =>
        req.id === reqId ? { ...req, required: isRequired } : req
      )
    );
  };

  const handleUpdateQuestion = (qId: string, newQuestion: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, question: newQuestion } : q))
    );
  };

  const handleAddQuestion = () => {
    const newId = `new-${customQuestions.length + 1}`;
    setCustomQuestions((prev) => [...prev, { id: newId, question: "" }]);
  };

  const handleRemoveQuestion = (qId: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const handleSave = () => {
    if (!userId) {
      toast.error("User not authenticated. Please log in.");
      return;
    }

    // Extract responsibilities, educationExperience, and benefits from jobDescription
    const responsibilities = formData.jobDescription
      .split("\n")
      .filter((line) => line.startsWith("* "))
      .map((line) => line.replace("* ", "").trim())
      .filter((line) => line);

    const educationExperience =
      formData.jobDescription
        .split("Must-Have")[1]
        ?.split("Nice-to-Have")[0]
        ?.split("\n")
        .filter((line) => line.startsWith("* "))
        .map((line) => line.replace("* ", "").trim())
        .filter((line) => line) || [];

    const benefits =
      formData.jobDescription
        .split("Why Join Us?")[1]
        ?.split("How to Apply")[0]
        ?.split("\n")
        .filter((line) => line.startsWith("* "))
        .map((line) => line.replace("* ", "").trim())
        .filter((line) => line) || [];

    const experienceMatch = formData.experience.match(/\d+/);
    const experience = experienceMatch
      ? Number.parseInt(experienceMatch[0], 10)
      : 0;

    const postData: JobPostData = {
      userId,
      companyId: jobData.companyId,
      title: formData.jobTitle,
      description: formData.jobDescription,
      salaryRange: formData.compensation.split(" ")[0] || "Negotiable",
      location: `${formData.country}, ${formData.region}`,
      shift: formData.employmentType === "fulltime" ? "Day" : "Flexible", // Adjust based on your actual shift values
      companyUrl: formData.companyUrl,
      responsibilities,
      educationExperience,
      benefits,
      vacancy: jobData.vacancy, // Keep existing vacancy
      experience,
      deadline: formData.expirationDate
        ? new Date(formData.expirationDate).toISOString()
        : jobData.deadline, // Use existing deadline if not updated
      publishDate: publishNow
        ? new Date().toISOString()
        : selectedDate?.toISOString() || jobData.createdAt, // Use selectedDate or existing createdAt
      status: jobData.status, // Keep existing status
      jobCategoryId: formData.categoryId,
      employement_Type: formData.employmentType,
      compensation: formData.compensation.split(" ")[1] || "Negotiable",
      arcrivedJob: jobData.arcrivedJob, // Keep existing archived status
      applicationRequirement: applicationRequirements
        .filter((req) => req.required)
        .map((req) => ({ requirement: `${req.label} required` })),
      customQuestion: customQuestions
        .filter((q) => q.question.trim() !== "")
        .map((q) => ({ question: q.question })),
    };

    updateJobMutation(postData);
  };

  const sanitizedDescription = DOMPurify.sanitize(formData.jobDescription);

  return (
    <div className="">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href={role === "company" ? "/manage-jobs" : "/recruiter-dashboard"}
          >
            <Button variant="ghost" size="icon" className="text-gray-500">
              <ArrowLeft className="h-6 w-6 text-gray-500" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mx-auto">
            Preview Job Posting
          </h1>
          {role !== "company" && (
            <Button variant="ghost" size="icon" onClick={onBackToEdit}>
              <Edit className="h-6 w-6 text-gray-500" />
            </Button>
          )}
        </div>

        {/* Job Details Section */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
            Job Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Job Title</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      jobTitle: e.target.value,
                    }))
                  }
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                  {formData.jobTitle || "N/A"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Department</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                  {formData.department || "N/A"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Country</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                  {formData.country || "N/A"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Region/State</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, region: e.target.value }))
                  }
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                  {formData.region || "N/A"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Employment Type
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.employmentType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employmentType: e.target.value,
                    }))
                  }
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                  {formData.employmentType || "N/A"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Experience Level
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      experience: e.target.value,
                    }))
                  }
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                  {formData.experience || "N/A"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Job Category</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                  {formData.category || "N/A"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Compensation</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.compensation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      compensation: e.target.value,
                    }))
                  }
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                  {formData.compensation || "N/A"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Company Website
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.companyUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyUrl: e.target.value,
                    }))
                  }
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                  {companyUrl ? (
                    <Link
                      href={
                        companyUrl.startsWith("http")
                          ? companyUrl
                          : `https://${companyUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {companyUrl}
                    </Link>
                  ) : (
                    "N/A"
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Job Posting Expiration Date
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.expirationDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expirationDate: e.target.value,
                    }))
                  }
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                  {formData.expirationDate || "N/A"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Description Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 bg-white">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Job Description
              </h2>
              <div className="space-y-4">
                {isEditing ? (
                  <TextEditor
                    value={formData.jobDescription}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        jobDescription: value,
                      }))
                    }
                  />
                ) : (
                  <div
                    className="p-4 border border-gray-300 rounded-lg text-gray-800 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Tips and Publish Schedule */}
          <div className="lg:col-span-1 space-y-6">
            {/* TIP Section */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-2 mb-4">
                  <Info className="h-5 w-5 text-[#9EC7DC]" />
                  <h3 className="text-base font-semibold text-[#9EC7DC]">
                    TIP
                  </h3>
                </div>
                <p className="text-base text-gray-800 mb-4">
                  Job boards will often reject jobs that do not have quality job
                  descriptions. To ensure that your job description matches the
                  requirements for job boards, consider the following
                  guidelines:
                </p>
                <ul className="list-disc list-inside text-base text-gray-800 space-y-2">
                  <li>
                    Job descriptions should be clear, well-written, and
                    informative
                  </li>
                  <li>
                    Job descriptions with 700-2,000 characters get the most
                    interaction
                  </li>
                  <li>Do not use discriminatory language</li>
                  <li>Do not post offensive or inappropriate content</li>
                  <li>Be honest about the job requirement details</li>
                  <li>
                    Help the candidate understand the expectations for this role
                  </li>
                </ul>
                <p className="text-base text-gray-800 mt-4">
                  For more tips on writing good job descriptions,{" "}
                  <Link href="#" className="text-[#2B7FD0]">
                    {" "}
                    {/* Changed color to match theme */}
                    read our help article.
                  </Link>
                </p>
              </CardContent>
            </Card>

            {/* Publish Schedule Section */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Publish Now
                  </h3>
                  {isEditing ? (
                    <Switch
                      className="!bg-[#2B7FD0]"
                      checked={publishNow}
                      onCheckedChange={(checked) => setPublishNow(checked)}
                    />
                  ) : (
                    <Switch
                      className="!bg-[#2B7FD0]"
                      checked={publishNow}
                      disabled
                    />
                  )}
                </div>
                {!publishNow && (
                  <>
                    <h3 className="text-base font-semibold mb-4">
                      Schedule Publish
                    </h3>
                    <div className="border rounded-lg p-3">
                      <CustomCalendar
                        selectedDate={selectedDate}
                        onDateSelect={(date) => setSelectedDate(date)}
                      />
                    </div>
                    {selectedDate && (
                      <p className="text-sm text-gray-600 mt-2">
                        Selected date: {selectedDate.toLocaleDateString()}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Application Requirements Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Application Requirements
          </h2>
          <p className="text-xl text-gray-800 mb-6">
            What personal info would you like to gather about each applicant?
          </p>
          <div className="space-y-4">
            {applicationRequirements.map((requirement) => (
              <div
                key={requirement.id}
                className="flex items-center justify-between py-2 border-b pb-10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-[22px] h-[22px] bg-[#2B7FD0] rounded-full flex items-center justify-center">
                    <Check className="text-white w-4 h-4" />
                  </div>
                  <span className="text-xl text-gray-900 font-normal">
                    {requirement.label}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant={!requirement.required ? "default" : "outline"}
                    className={`h-9 px-4 rounded-lg text-sm font-medium ${
                      !requirement.required
                        ? "bg-[#2B7FD0] text-white"
                        : "border-[#2B7FD0] text-[#2B7FD0]"
                    }`}
                    onClick={() => handleToggleRequired(requirement.id, false)}
                    disabled={!isEditing}
                  >
                    Optional
                  </Button>
                  <Button
                    variant={requirement.required ? "default" : "outline"}
                    className={`h-9 px-4 rounded-lg text-sm font-medium ${
                      requirement.required
                        ? "bg-[#2B7FD0] text-white"
                        : "border-[#2B7FD0] text-[#2B7FD0]"
                    }`}
                    onClick={() => handleToggleRequired(requirement.id, true)}
                    disabled={!isEditing}
                  >
                    Required
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Questions Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Add Custom Questions
          </h2>
          <div className="space-y-4 mb-6">
            {customQuestions.map((question) => (
              <div key={question.id} className="space-y-2 flex items-end">
                <div className="flex-1">
                  <p className="text-xl font-medium text-[#2B7FD0]">
                    Ask a question
                  </p>
                  {isEditing ? (
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) =>
                          handleUpdateQuestion(question.id, e.target.value)
                        }
                        className="flex min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(question.id)}
                        className="ml-2"
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                      {question.question || "No question entered."}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isEditing && (
              <Button
                onClick={handleAddQuestion}
                className="mt-4 bg-[#2B7FD0] text-white"
              >
                Add Question
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                className="w-full sm:w-[267px] h-12 border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent hover:text-[#2B7FD0] bg-transparent"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-[267px] h-12 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              {role !== "company" && (
                <>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[267px] h-12 border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent hover:text-[#2B7FD0] bg-transparent"
                    onClick={onBackToEdit}
                  >
                    Edit
                  </Button>
                  <Button
                    className="w-full sm:w-[267px] h-12 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white"
                    disabled
                  >
                    Published
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
