"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import JobPreview from "./JobPreview";
import DOMPurify from "dompurify";

import { jobSchema, type JobFormData } from "@/types/job";

// Step Components
import StepIndicator from "./job-form-steps/step-indicator";
import JobDetailsStep from "./job-form-steps/job-details-step";
import JobDescriptionStep from "./job-form-steps/job-description-step";
import ApplicationRequirementsStep from "./job-form-steps/application-requirements-step";
import CustomQuestionsStep from "./job-form-steps/custom-questions-step";
import FinishStep from "./job-form-steps/finish-step";

// Interfaces
interface ApplicationRequirement {
  id: string;
  label: string;
  required: boolean;
}

interface CustomQuestion {
  id: string;
  question: string;
}

interface JobCategory {
  _id: string;
  name: string;
  role: string[];
  categoryIcon: string;
}

interface Country {
  country: string;
  cities: string[];
}

// API Functions
async function fetchJobCategories() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/category/job-category`);
  if (!response.ok) throw new Error("Failed to fetch job categories");
  return response.json();
}

async function postJob(data: any, retries = 2): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  console.log("[v0] Attempting to post job with data:", data);

  try {
    const response = await fetch(`${baseUrl}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("[v0] Job post response status:", response.status);
    console.log(
      "[v0] Job post response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      console.error("[v0] Job post failed with error:", errorData);
      throw new Error(
        `Failed to publish job: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }

    const result = await response.json();
    console.log("[v0] Job post successful:", result);
    return result;
  } catch (error) {
    console.error("[v0] Job post error:", error);
    if (retries > 0) {
      console.warn(`[v0] Retrying job post... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return postJob(data, retries - 1);
    }
    throw error;
  }
}

export default function MultiStepJobForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategoryRoles, setSelectedCategoryRoles] = useState<string[]>(
    []
  );
  const [jobCategories, setJobCategories] = useState<any>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Initialize form
  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobTitle: "",
      department: "",
      country: "",
      region: "",
      vacancy: "",
      employmentType: undefined,
      experience: undefined,
      locationType: undefined,
      careerStage: undefined,
      categoryId: "",
      role: "",
      compensation: "",
      expirationDate: "",
      companyUrl: "",
      jobDescription: "",
      publishDate: new Date().toISOString(),
      applicationRequirements: [
        { id: "address", label: "Address", required: false },
        { id: "resume", label: "Resume", required: true },
        { id: "name", label: "Name", required: true },
        { id: "email", label: "Email", required: true },
        { id: "phone", label: "Phone", required: true },
        {
          id: "visa",
          label: "Valid visa for this job location?",
          required: true,
        },
      ],
      customQuestions: [{ id: "1", question: "" }],
      userId,
    },
  });

  // Fetch job categories
  useEffect(() => {
    const loadJobCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const data = await fetchJobCategories();
        setJobCategories(data);
      } catch (error) {
        setCategoriesError(
          error instanceof Error ? error.message : "Failed to load categories"
        );
        toast.error("Failed to load job categories");
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadJobCategories();
  }, []);

  // Fetch countries
  useEffect(() => {
    const loadCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries"
        );
        const data = await response.json();
        if (data.error) throw new Error("Failed to fetch countries");
        setCountries(data.data as Country[]);
      } catch (error) {
        console.error("Error loading countries:", error);
        toast.error("Failed to load countries");
      } finally {
        setIsLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  // Fetch cities
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedCountry) {
        setCities([]);
        return;
      }
      setIsLoadingCities(true);
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/cities",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: selectedCountry }),
          }
        );
        const data = await response.json();
        if (data.error) throw new Error("Failed to fetch cities");
        setCities(data.data as string[]);
      } catch (error) {
        console.error("Error loading cities:", error);
        toast.error("Failed to load cities");
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };
    loadCities();
  }, [selectedCountry]);

  // Set default country
  useEffect(() => {
    if (countries.length > 0 && !form.getValues("country")) {
      const defaultCountry = countries[0].country;
      form.setValue("country", defaultCountry);
      setSelectedCountry(defaultCountry);
    }
  }, [countries, form]);

  // Step validation fields
  const stepFields: Record<number, (keyof JobFormData)[]> = {
    1: [
      "jobTitle",
      "country",
      "region",
      "vacancy",
      "employmentType",
      "experience",
      "locationType",
      "careerStage",
      "categoryId",
      "role",
      "expirationDate",
    ],
    2: ["jobDescription"],
    3: [],
    4: [],
    5: [],
  };

  const handleStepClick = async (targetStep: number) => {
    console.log("[v0] Attempting to navigate to step:", targetStep);
    console.log("[v0] Current step:", currentStep);

    // Allow going to any previous step or current step without validation
    if (targetStep <= currentStep) {
      console.log(
        "[v0] Navigating to previous/current step without validation"
      );
      setCurrentStep(targetStep);
      return;
    }

    // For forward navigation, validate all steps between current and target
    let canNavigate = true;
    for (let step = currentStep; step < targetStep; step++) {
      const fieldsToValidate = stepFields[step];
      if (fieldsToValidate && fieldsToValidate.length > 0) {
        console.log("[v0] Validating step", step, "fields:", fieldsToValidate);
        const isValid = await form.trigger(fieldsToValidate);
        console.log("[v0] Step", step, "validation result:", isValid);

        if (!isValid) {
          const errors = form.formState.errors;
          console.log("[v0] Validation errors:", errors);
          const firstError = Object.values(errors)[0];
          toast.error(
            firstError?.message ||
              `Please complete step ${step} before proceeding.`
          );
          canNavigate = false;
          break;
        }
      }
    }

    if (canNavigate) {
      console.log("[v0] Navigation allowed, moving to step:", targetStep);
      setCurrentStep(targetStep);
    }
  };

  const handleNext = async () => {
    console.log("[v0] Next button clicked, current step:", currentStep);
    const fieldsToValidate = stepFields[currentStep];
    console.log("[v0] Fields to validate:", fieldsToValidate);

    if (fieldsToValidate && fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      console.log("[v0] Validation result:", isValid);
      console.log("[v0] Form errors:", form.formState.errors);

      if (isValid) {
        console.log("[v0] Validation passed, moving to next step");
        setCurrentStep((prev) => Math.min(prev + 1, 5));
      } else {
        const errors = form.formState.errors;
        const firstError = Object.values(errors)[0];
        console.log("[v0] Validation failed, first error:", firstError);
        toast.error(
          firstError?.message || "Please fill in all required fields."
        );
      }
    } else {
      console.log("[v0] No validation needed, moving to next step");
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleCancel = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handlePreviewClick = async () => {
    console.log("[v0] Preview button clicked");
    const isValid = await form.trigger();
    console.log("[v0] Full form validation result:", isValid);
    console.log("[v0] Form errors:", form.formState.errors);

    if (isValid) {
      console.log("[v0] Form is valid, showing preview");
      setShowPreview(true);
    } else {
      console.log("[v0] Form has errors, showing preview anyway for debugging");
      setShowPreview(true);
    }
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const handlePublish = async (data: JobFormData) => {
    console.log("[v0] Publish handler called with data:", data);

    if (!session?.user?.id) {
      console.error("[v0] User not authenticated");
      toast.error("User not authenticated. Please log in.");
      return;
    }

    console.log("[v0] User authenticated, userId:", session.user.id);
    setIsPending(true);

    try {
      const responsibilities = data.jobDescription
        .split("\n")
        .filter((line) => line.startsWith("* "))
        .map((line) => DOMPurify.sanitize(line.substring(2)))
        .filter((line) => line);

      const requirements = data.jobDescription
        .split("\n")
        .filter((line) => line.startsWith("- "))
        .map((line) => DOMPurify.sanitize(line.substring(2)))
        .filter((line) => line);

      const getExpirationDate = () => {
        const days = Number.parseInt(data.expirationDate) || 30;
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + days);
        return expDate.toISOString();
      };

      const getPublishDate = () => {
        if (publishNow) return new Date().toISOString();
        return selectedDate?.toISOString() || new Date().toISOString();
      };

      const selectedCategory = jobCategories?.data.find(
        (cat: JobCategory) => cat._id === data.categoryId
      );
      console.log("[v0] Selected category:", selectedCategory);

      const postData = {
        userId: data.userId || userId,
        title: DOMPurify.sanitize(data.jobTitle),
        description: DOMPurify.sanitize(data.jobDescription),
        salaryRange: data.compensation
          ? DOMPurify.sanitize(data.compensation)
          : "$0 - $0",
        location: DOMPurify.sanitize(`${data.country}, ${data.region}`),
        shift: data.employmentType === "full-time" ? "Day" : "Flexible",
        responsibilities,
        educationExperience: requirements,
        benefits: [],
        vacancy: Number.parseInt(data.vacancy, 10) || 1,
        experience: 0,
        deadline: getExpirationDate(),
        status: "active" as const,
        jobCategoryId: data.categoryId,
        name: selectedCategory?.name || "",
        role: DOMPurify.sanitize(data.role),
        compensation: data.compensation ? "Monthly" : "Negotiable",
        archivedJob: false,
        applicationRequirement:
          data.applicationRequirements
            ?.filter((req) => req.required)
            .map((req) => ({
              requirement: `${DOMPurify.sanitize(req.label)} required`,
            })) || [],
        customQuestion:
          data.customQuestions
            ?.filter((q) => q.question)
            .map((q) => ({ question: DOMPurify.sanitize(q.question!) })) || [],
        employmentType: data.employmentType,
        websiteUrl: data.companyUrl
          ? DOMPurify.sanitize(data.companyUrl)
          : undefined,
        publishDate: getPublishDate(),
        careerStage: data.careerStage,
        locationType: data.locationType,
      };

      console.log("[v0] Final post data prepared:", postData);
      await postJob(postData);
      toast.success("Job published successfully!");
      // router.push("/jobs");
    } catch (error) {
      console.error("[v0] Error publishing job:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to publish job"
      );
    } finally {
      setIsPending(false);
    }
  };

  const steps = [
    { number: 1, title: "Job Details", active: currentStep >= 1 },
    { number: 2, title: "Job Description", active: currentStep >= 2 },
    { number: 3, title: "Application Requirements", active: currentStep >= 3 },
    { number: 4, title: "Custom Questions", active: currentStep >= 4 },
    { number: 5, title: "Finish", active: currentStep >= 5 },
  ];

  if (showPreview) {
    const formData = form.getValues();
    const safeCompanyUrl = formData.companyUrl || "";
    const selectedCategory = jobCategories?.data.find(
      (cat: JobCategory) => cat._id === formData.categoryId
    );
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Job Preview
            </h1>
            <p className="text-gray-600">
              Review your job posting before publishing
            </p>
          </div>
          <form onSubmit={form.handleSubmit(handlePublish)}>
            <JobPreview
              formData={{ ...formData, category: selectedCategory?.name ?? "" }}
              companyUrl={safeCompanyUrl}
              applicationRequirements={formData.applicationRequirements ?? []}
              customQuestions={(formData.customQuestions ?? []).map((q) => ({
                id: q.id,
                question: q.question ?? "", // <-- guarantee string
              }))}
              selectedDate={selectedDate ?? new Date()}
              publishNow={publishNow}
              onBackToEdit={handleBackToEdit}
            />
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#131313] text-center mb-8">
          Create Job Posting
        </h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handlePublish)}
            className="space-y-6"
          >
            <StepIndicator
              steps={steps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />

            {currentStep === 1 && (
              <JobDetailsStep
                form={form}
                onNext={handleNext}
                onCancel={handleCancel}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                selectedCategoryRoles={selectedCategoryRoles}
                setSelectedCategoryRoles={setSelectedCategoryRoles}
                jobCategories={jobCategories}
                categoriesLoading={categoriesLoading}
                categoriesError={categoriesError}
                countries={countries}
                isLoadingCountries={isLoadingCountries}
                cities={cities}
                isLoadingCities={isLoadingCities}
              />
            )}

            {currentStep === 2 && (
              <JobDescriptionStep
                form={form}
                onNext={handleNext}
                onCancel={handleCancel}
                publishNow={publishNow}
                setPublishNow={setPublishNow}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            )}

            {currentStep === 3 && (
              <ApplicationRequirementsStep
                form={form}
                onNext={handleNext}
                onCancel={handleCancel}
              />
            )}

            {currentStep === 4 && (
              <CustomQuestionsStep
                form={form}
                onNext={handleNext}
                onCancel={handleCancel}
              />
            )}

            {currentStep === 5 && (
              <FinishStep
                form={form}
                onPreview={handlePreviewClick}
                onPublish={form.handleSubmit(handlePublish)}
                isPending={isPending}
              />
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
