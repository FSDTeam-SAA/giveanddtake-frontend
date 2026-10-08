"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import JobDetailsPreviewEdit from "@/components/job-preview-sections/job-details-preview-edit";
import CustomCalendar from "@/components/CustomCalendar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import DOMPurify from "dompurify";
import { getJobDescriptionCounts, getJobDescriptionError } from "@/lib/job-description-policy";
import { jobQueryOptions } from "@/lib/job-query";

interface Country {
  country: string;
  cities: string[];
}

interface JobCategory {
  _id: string;
  name: string;
  role: string[];
  categoryIcon: string;
}

interface CurrencyApiItem {
  _id: string;
  code: string;
  currencyName: string;
  symbol?: string;
}

interface ApplicationRequirement {
  id: string;
  requirement: string;
  status: string;
}

interface CustomQuestion {
  id: string;
  question: string;
}

interface JobPostData {
  [field: string]: unknown;
  userId: string | undefined;
}

// STATIC APPLICATION REQUIREMENTS
const STATIC_REQUIREMENTS = [
  { id: "resume", label: "Resume" },
  { id: "visa", label: "Have you got a valid visa for this location?" },
];

// keep this OUTSIDE the component
async function updateJob(id: string, data: JobPostData, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/update/${id}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let errorMessage = `Failed to update job: ${response.status}`;
    try {
      const errorData = await response.json();
      const details = errorData?.errorSources?.map((source: { message?: string }) => source.message).filter(Boolean).join("; ");
      if (details || errorData?.message) errorMessage += ` - ${details || errorData.message}`;
    } catch (_) {}
    throw new Error(errorMessage);
  }

  return response.json();
}

async function fetchJobCategories() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/category/job-category`);
  if (!response.ok) throw new Error("Failed to fetch categories");
  const data = await response.json();
  return data.data.category as JobCategory[];
}

async function fetchCountries() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/countries`);
  const data = await response.json();
  if (data.error) throw new Error("Failed to fetch countries");
  return data.data as Country[];
}

async function fetchCities(country: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/countries/cities`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    }
  );
  const data = await response.json();
  if (data.error) throw new Error("Failed to fetch cities");
  return data.data as string[];
}

async function fetchCurrencies() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/courency`);
  if (!response.ok) throw new Error("Failed to fetch currencies");
  const data = await response.json();
  return (Array.isArray(data.data) ? data.data : []) as CurrencyApiItem[];
}

export default function JobPreview() {
  const session = useSession();
  const userId = session.data?.user?.id;
  const role = session.data?.user?.role;
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const token = session.data?.accessToken;
  const id = (params?.id as string) || "6896fb2b12980e468298ad0f";

  const [isEditing, setIsEditing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [publishNow, setPublishNow] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduleChanged, setScheduleChanged] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    country: "",
    region: "",
    employmentType: "",
    experience: "",
    category: "",
    categoryId: "",
    role: "",
    compensationCurrency: "",
    compensation: "",
    expirationDate: "",
    jobDescription: "",
    publishDate: "",
    companyUrl: "",
    vacancy: 1,
    locationType: "",
    careerStage: "",
  });

  // Static application requirements state (Resume + Visa)
  const [applicationRequirements, setApplicationRequirements] = useState<
    ApplicationRequirement[]
  >(() =>
    STATIC_REQUIREMENTS.map((r) => ({
      id: r.id,
      requirement: r.label,
      status: "",
    }))
  );

  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  // react-query
  const { data: jobData, isLoading: jobLoading } = useQuery({
    ...jobQueryOptions(id),
    select: (response) => response.data,
  });

  const { data: jobCategories = [] } = useQuery({
    queryKey: ["jobCategories"],
    queryFn: fetchJobCategories,
  });
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });
  const { data: cities = [] } = useQuery({
    queryKey: ["cities", selectedCountry],
    queryFn: () =>
      selectedCountry ? fetchCities(selectedCountry) : Promise.resolve([]),
    enabled: !!selectedCountry,
  });
  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: fetchCurrencies,
  });

  // Keep a snapshot so ordinary edits submit only changed fields.
  const initialFormRef = useRef<Record<string, string | number>>({});
  const initialRequirementsRef = useRef<string>("");
  const initialQuestionsRef = useRef<string>("");

  // util inside file
  const deriveExpirationDays = (job: any) => {
    const expirySource = job?.deadline || job?.expiryDate;
    const publishBase = job?.publishDate || job?.createdAt;
    if (!expirySource || !publishBase) return "";
    const expiry = new Date(expirySource);
    const base = new Date(publishBase);
    if (Number.isNaN(expiry.getTime()) || Number.isNaN(base.getTime())) {
      return "";
    }
    const diffMs = expiry.getTime() - base.getTime();
    const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    return diffDays.toString();
  };

  // Refresh the form when viewing a fetched job or cancelling an edit.
  useEffect(() => {
    if (!jobData || isEditing) return;

    const createdAt = jobData.createdAt
      ? new Date(jobData.createdAt)
      : undefined;
    const [country, region] = jobData.location?.split(", ") || ["", ""];

    const initialForm = {
      category: "",
      role: "",
      jobTitle: jobData.title || "",
      department: jobData.department || "",
      country: country || "",
      region: region || "",
      employmentType: jobData.employement_Type || "",
      experience: jobData.experience || "",
      categoryId: jobData.jobCategoryId || "",
      compensationCurrency: jobData.compensationCurrency || jobData.compensation || "",
      compensation: jobData.salaryRange?.replace(/[^\d]/g, "") || "",
      expirationDate: deriveExpirationDays(jobData) || "",
      jobDescription: jobData.description || "",
      publishDate: createdAt ? createdAt.toLocaleDateString() : "",
      companyUrl: jobData.website_Url || "",
      vacancy: jobData.vacancy || 1,
      locationType: jobData.location_Type || "",
      careerStage: jobData.career_Stage || "",
    };
    initialFormRef.current = initialForm;
    setFormData(initialForm);

    // Initialize static application requirements from job data statuses
    const initialRequirements = STATIC_REQUIREMENTS.map((r, idx) => {
        const existing =
          jobData.applicationRequirement?.find(
            (req: any) => req.requirement === r.label
          ) ?? jobData.applicationRequirement?.[idx];

        return {
          id: r.id,
          requirement: r.label,
          status: existing?.status || "",
        };
      });
    setApplicationRequirements(initialRequirements);
    initialRequirementsRef.current = JSON.stringify(initialRequirements.map(({ requirement, status }) => ({ requirement, status })));

    const initialQuestions = jobData.customQuestion?.map((q: any, idx: number) => ({
        id: q._id || `q-${idx}`,
        question: q.question || "",
      })) || [];
    setCustomQuestions(initialQuestions);
    initialQuestionsRef.current = JSON.stringify(initialQuestions.map(({ question }: CustomQuestion) => ({ question })));

    if (country) setSelectedCountry(country);
    if (jobData.publishDate) {
      const publishDt = new Date(jobData.publishDate);
      const now = new Date();
      if (publishDt > now) {
        setPublishNow(false);
        setSelectedDate(publishDt);
      } else {
        setPublishNow(true);
        setSelectedDate(publishDt);
      }
    } else {
      setPublishNow(true);
      setSelectedDate(new Date());
    }

    setScheduleChanged(false);
  }, [jobData, isEditing]);

  // 2) After categories load, fill category name & role ONLY if values differ
  useEffect(() => {
    if (!jobData || !jobCategories.length || isEditing) return;
    const found = jobCategories.find((c) => c._id === jobData.jobCategoryId);
    if (!found) return;

    setFormData((prev) => {
      const nextCategory = found.name || "";
      const nextRole = found.role?.[0] || "";
      if (prev.category === nextCategory && prev.role === nextRole) return prev;
      return { ...prev, category: nextCategory, role: nextRole };
    });
  }, [jobData, jobCategories, isEditing]);

  const { mutate: updateJobMutation, isPending } = useMutation({
    mutationFn: (data: JobPostData) => updateJob(id, data, token),
    onSuccess: async (response) => {
      queryClient.setQueryData(["job", id], response);
      toast.success(
        "Job updated successfully! Admin will review and publish it soon."
      );
      setIsEditing(false);
      setNewExpiryDate("");
      await queryClient.invalidateQueries({
        predicate: (query) => ["job", "jobs", "recommendedJobs"].includes(String(query.queryKey[0])),
      });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update job");
    },
  });

  const handleFieldChange = useCallback(
    (field: string, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleUpdateRequirement = useCallback(
    (id: string, field: string, value: string) => {
      if (field !== "status") return;
      setApplicationRequirements((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: value } : req
        )
      );
    },
    []
  );

  const handleAddQuestion = useCallback(() => {
    setCustomQuestions((prev) => [
      ...prev,
      { id: `q-${Date.now()}`, question: "" },
    ]);
  }, []);

  const handleUpdateQuestion = useCallback((id: string, question: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question } : q))
    );
  }, []);

  const handleRemoveQuestion = useCallback((id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const handlePublishToggle = useCallback(
    (checked: boolean) => {
      setPublishNow(checked);
      setScheduleChanged(true);
      setSelectedDate(new Date());
    },
    []
  );

  const handleSave = useCallback(() => {
    const descriptionError = formData.jobDescription !== initialFormRef.current.jobDescription
      ? getJobDescriptionError(formData.jobDescription) : null;
    if (descriptionError) {
      toast.error(descriptionError);
      return;
    }
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }
    if (!token) {
      toast.error("Missing access token. Please sign in again.");
      return;
    }

    const postData: JobPostData = { userId };
    const changed = (field: keyof typeof formData) => formData[field] !== initialFormRef.current[field];
    const fields = {
      jobTitle: "title", jobDescription: "description", companyUrl: "website_Url",
      vacancy: "vacancy", experience: "experience", categoryId: "jobCategoryId",
      employmentType: "employement_Type", careerStage: "career_Stage", locationType: "location_Type",
    } as const;
    for (const [formField, apiField] of Object.entries(fields)) {
      const field = formField as keyof typeof fields;
      if (changed(field)) postData[apiField] = formData[field];
    }
    if (changed("country") || changed("region")) postData.location = `${formData.country}, ${formData.region}`;
    if (changed("compensation") || changed("compensationCurrency")) {
      postData.salaryRange = formData.compensation ? `${formData.compensationCurrency} ${formData.compensation}` : "Negotiable";
      postData.compensation = formData.compensationCurrency || "Negotiable";
    }
    const requirements = applicationRequirements.map(({ requirement, status }) => ({ requirement, status }));
    const questions = customQuestions.map(({ question }) => ({ question }));
    if (JSON.stringify(requirements) !== initialRequirementsRef.current) postData.applicationRequirement = requirements;
    if (JSON.stringify(questions) !== initialQuestionsRef.current) postData.customQuestion = questions;
    if (scheduleChanged) {
      if (!publishNow && (!selectedDate || selectedDate.getTime() <= Date.now())) {
        toast.error("Choose a future publication date.");
        return;
      }
      postData.publishDate = publishNow ? new Date().toISOString() : selectedDate!.toISOString();
    }
    if (Object.keys(postData).length === 1) {
      toast.info("No changes to save.");
      return;
    }

    updateJobMutation(postData);
  }, [
    userId,
    formData,
    publishNow,
    selectedDate,
    scheduleChanged,
    applicationRequirements,
    customQuestions,
    updateJobMutation,
    token,
  ]);

  const handleExtendExpiry = () => {
    if (!userId || !token) {
      toast.error("Please sign in again.");
      return;
    }
    const deadline = new Date(`${newExpiryDate}T23:59:59.999`);
    const currentDeadline = jobData?.deadline || jobData?.expiryDate;
    if (!Number.isFinite(deadline.getTime()) || deadline.getTime() <= Date.now() ||
        (currentDeadline && deadline.getTime() <= new Date(currentDeadline).getTime())) {
      toast.error("Choose a future expiry date later than the current expiry.");
      return;
    }
    updateJobMutation({ userId, deadline: deadline.toISOString(), extendExpiry: true });
  };

  const displayStatus = jobData?.displayStatus || (
    jobData?.arcrivedJob ? "archived" : jobData?.deadline && new Date(jobData.deadline).getTime() < Date.now() ? "expired" :
    jobData?.jobApprove === "denied" ? "denied" : !jobData?.adminApprove || jobData?.jobApprove !== "approved" ? "pending" :
    jobData?.publishDate && new Date(jobData.publishDate).getTime() > Date.now() ? "scheduled" : "published"
  );
  const statusLabel = displayStatus === "pending" ? "Pending approval" : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);

  const { characters: descriptionCharCount, words: descriptionWordCount } =
    getJobDescriptionCounts(formData.jobDescription);

  if (jobLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href={
                role === "company"
                  ? `/manage-jobs/${
                      jobData.companyId?._id || jobData.companyId
                    }`
                  : "/recruiter-dashboard"
              }
            >
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isEditing ? "Edit Job Posting" : "Job Preview"}
            </h1>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              disabled={isPending}
            >
              <Edit className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          )}
        </div>

        {/* Job Title */}
        <Card className="border-none shadow-md bg-gradient-to-r from-[#2B7FD0]/10 to-transparent">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {formData.jobTitle}
            </h2>
            <div className="flex flex-wrap gap-3">
              {formData.category && (
                <span className="px-3 py-1 bg-[#2B7FD0] text-white rounded-full text-sm">
                  {formData.category}
                </span>
              )}
              {formData.role && (
                <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                  {formData.role}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card className="shadow-md border-none">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Job Details
            </h2>
            {isEditing ? (
              <JobDetailsPreviewEdit
                formData={formData}
                hideExpiration
                onFieldChange={handleFieldChange}
                jobCategories={jobCategories}
                countries={countries}
                cities={cities}
                currencies={currencies}
                selectedCountry={selectedCountry}
                onCountryChange={setSelectedCountry}
                isLoadingCountries={false}
                isLoadingCities={false}
                isLoadingCurrencies={false}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Job Title", value: formData.jobTitle },
                  { label: "Department", value: formData.department },
                  { label: "Category", value: formData.category },
                  { label: "Role", value: formData.role },
                  { label: "Country", value: formData.country },
                  { label: "City", value: formData.region },
                  { label: "Employment Type", value: formData.employmentType },
                  { label: "Experience Level", value: formData.experience },
                  { label: "Location Type", value: formData.locationType },
                  { label: "Career Stage", value: formData.careerStage },
                  { label: "Vacancies", value: formData.vacancy },
                  {
                    label: "Compensation",
                    value: formData.compensation
                      ? `${formData.compensationCurrency} ${formData.compensation}`
                      : "N/A",
                  },
                  {
                    label: "Expiry Date",
                    value: jobData.deadline || jobData.expiryDate ? new Date(jobData.deadline || jobData.expiryDate).toLocaleDateString() : "Not set",
                  },
                  { label: "Company Website", value: formData.companyUrl },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {item.label}
                    </p>
                    <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                      {item.value || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Description */}
        {!isEditing && (
          <Card className="shadow-md border-none">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <h2 className="text-2xl font-semibold">Extend expiry</h2>
              <p className="text-sm text-gray-600">Status: {statusLabel}. Changes require admin approval.</p>
              <p className="text-sm text-gray-600">Current expiry: {jobData.deadline || jobData.expiryDate ? new Date(jobData.deadline || jobData.expiryDate).toLocaleDateString() : "Not set"}</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="space-y-2">
                  <label htmlFor="new-job-expiry" className="text-sm font-medium">New expiry date</label>
                  <Input id="new-job-expiry" type="date" value={newExpiryDate}
                    onChange={(event) => setNewExpiryDate(event.target.value)} disabled={isPending} />
                </div>
                <Button onClick={handleExtendExpiry} disabled={isPending || !newExpiryDate}>
                  {isPending ? "Saving..." : "Submit extension for approval"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-md border-none">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Job Description
              </h2>
              {!isEditing && (
                <div className="text-sm text-gray-600 mt-2 sm:mt-0 text-right">
                  <p>Characters: {descriptionCharCount}/2000</p>
                  <p>Words: {descriptionWordCount}/20 min</p>
                </div>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <TextEditor
                  value={formData.jobDescription}
                  onChange={(value) =>
                    handleFieldChange("jobDescription", value)
                  }
                />
                <p className="text-sm text-gray-600">
                  Characters: {descriptionCharCount}/2000 | Words:{" "}
                  {descriptionWordCount}/20 min
                </p>
              </div>
            ) : (
              <div
                className="p-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(formData.jobDescription),
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Application Requirements, Custom Questions, Publish Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Requirements */}
          <Card className="border-none shadow-md col-span-1">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Application Requirements
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                What personal info would you like to gather about each
                applicant?
              </p>
              <div className="space-y-4">
                {applicationRequirements.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-4 border border-gray-200 rounded-lg px-4 py-3 bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2B7FD0] text-white">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {req.requirement}
                      </span>
                    </div>

                    {isEditing ? (
                      <select
                        value={req.status}
                        onChange={(e) =>
                          handleUpdateRequirement(
                            req.id,
                            "status",
                            e.target.value
                          )
                        }
                        className="w-40 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700"
                      >
                        <option value="">Set status</option>
                        <option value="Required">Required</option>
                        <option value="Optional">Optional</option>
                      </select>
                    ) : (
                      <div className="text-sm">
                        {req.status === "Required" ? (
                          <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 font-semibold">
                            Required
                          </span>
                        ) : req.status === "Optional" ? (
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold">
                            Optional
                          </span>
                        ) : (
                          <span className="text-gray-500">Not set</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Questions */}
          <Card className="border-none shadow-md col-span-1">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Custom Questions
              </h2>
              <div className="space-y-4">
                {customQuestions.length === 0 && !isEditing && (
                  <div className="p-3 border border-dashed border-gray-300 rounded-lg text-gray-500">
                    No custom questions added.
                  </div>
                )}
                {customQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-col sm:flex-row sm:items-end gap-3"
                  >
                    {isEditing ? (
                      <>
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700">
                            Question
                          </label>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, e.target.value)
                            }
                            className="w-full h-11 px-3 border border-gray-300 rounded-lg"
                            placeholder="Enter question"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveQuestion(q.id)}
                        >
                          Remove
                        </Button>
                      </>
                    ) : (
                      <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
                        {q.question || "—"}
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <Button
                    onClick={handleAddQuestion}
                    className="mt-2 bg-[#2B7FD0]"
                  >
                    Add Question
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publish Schedule */}
          <Card className="border-none shadow-md col-span-1">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Publish Now
                </h2>
                <Switch
                  checked={publishNow}
                  onCheckedChange={handlePublishToggle}
                  disabled={!isEditing || isPending}
                  className="data-[state=checked]:bg-[#2B7FD0]"
                />
              </div>
              {!publishNow && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-base font-semibold mb-4">
                    Schedule Publish
                  </h3>
                  <CustomCalendar
                    selectedDate={selectedDate || undefined}
                    onDateSelect={(date) => {
                      if (!isEditing) return;
                      setSelectedDate(date);
                      setScheduleChanged(true);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                className="border-[#2B7FD0] text-[#2B7FD0]"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/90"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/90" disabled>
              {statusLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
