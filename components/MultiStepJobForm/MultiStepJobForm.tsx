"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Info, Check, ChevronsUpDown, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import TextEditor from "./TextEditor";
import CustomCalendar from "./CustomCalendar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import JobPreview from "./JobPreview";
import DOMPurify from "dompurify";

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

interface Option {
  value: string;
  label: string;
}

// Zod Schema
const jobSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  region: z.string().min(1, "City is required"),
  vacancy: z.string().min(1, "Vacancy is required").regex(/^\d+$/, "Vacancy must be a number"),
  employmentType: z.enum([
    "full-time",
    "part-time",
    "internship",
    "contract",
    "temporary",
    "freelance",
    "volunteer",
  ], { message: "Employment type is required" }),
  experience: z.enum(["entry", "mid", "senior", "executive"], {
    message: "Experience level is required",
  }),
  locationType: z.enum(["onsite", "remote", "hybrid"], {
    message: "Location type is required",
  }),
  careerStage: z.enum(["New Entry", "Experienced Professional", "Career Returner"], {
    message: "Career stage is required",
  }),
  categoryId: z.string().min(1, "Job category is required"),
  role: z.string().min(1, "Role is required"),
  compensation: z.string().optional(),
  expirationDate: z.string().min(1, "Expiration date is required"),
  companyUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  jobDescription: z.string().max(2000, "Job description cannot exceed 2000 characters").min(1, "Job description is required"),
  publishDate: z.string().optional(),
  applicationRequirements: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        required: z.boolean(),
      })
    )
    .optional(),
  customQuestions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string().min(1, "Question is required").optional(),
      })
    )
    .optional(),
  userId: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

// API Functions
async function fetchJobCategories() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/category/job-category`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch job categories: ${response.statusText}`);
  }
  return response.json();
}

async function postJob(data: any, retries = 2): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to publish job: ${response.status} - ${errorData.message || "Unknown error"}`);
    }

    return response.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying job post... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return postJob(data, retries - 1);
    }
    throw error;
  }
}

// Combobox Component
function Combobox({
  options,
  value,
  onChange,
  placeholder,
  minSearchLength = 0,
  disabled = false,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minSearchLength?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options
    .filter((option) => option.label.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 100);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 bg-transparent"
          disabled={disabled}
        >
          {value ? options.find((option) => option.value === value)?.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} />
          <CommandList>
            {search.length < minSearchLength ? (
              <CommandEmpty>Type at least {minSearchLength} characters to search.</CommandEmpty>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredOptions.length > 100 && (
              <CommandItem disabled>More results available. Refine your search.</CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function MultiStepJobForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "default-user-id";
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategoryRoles, setSelectedCategoryRoles] = useState<string[]>([]);
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
      vacancy: "1",
      employmentType: undefined,
      experience: undefined,
      locationType: undefined,
      careerStage: undefined,
      categoryId: "",
      role: "",
      compensation: "",
      expirationDate: "30",
      companyUrl: "",
      jobDescription: "",
      publishDate: new Date().toISOString(),
      applicationRequirements: [
        { id: "address", label: "Address", required: false },
        { id: "resume", label: "Resume", required: true },
        { id: "coverLetter", label: "Cover Letter", required: true },
        { id: "reference", label: "Reference", required: true },
        { id: "website", label: "Website", required: true },
        { id: "startDate", label: "Start Date", required: true },
        { id: "name", label: "Name", required: true },
        { id: "email", label: "Email", required: true },
        { id: "phone", label: "Phone", required: true },
        { id: "visa", label: "Valid visa for this job location?", required: true },
      ],
      customQuestions: [{ id: "1", question: "" }],
      userId,
    },
  });

  const { fields: applicationRequirements, update: updateRequirement } = useFieldArray({
    control: form.control,
    name: "applicationRequirements",
  });

  const { fields: customQuestions, append: appendCustomQuestion } = useFieldArray({
    control: form.control,
    name: "customQuestions",
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
        setCategoriesError(error instanceof Error ? error.message : "Failed to load categories");
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
        const response = await fetch("https://countriesnow.space/api/v0.1/countries");
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
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: selectedCountry }),
        });
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

  const handleNext = () => {
    const fieldsToValidate = stepFields[currentStep];
    form.trigger(fieldsToValidate).then((isValid) => {
      if (isValid) {
        setCurrentStep((prev) => Math.min(prev + 1, 5));
      } else {
        const errors = form.formState.errors;
        const firstError = Object.values(errors)[0];
        toast.error(firstError?.message || "Please fill in all required fields.");
      }
    });
  };

  const handleCancel = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handlePreviewClick = () => {
    form.trigger().then((isValid) => {
      if (isValid) {
        setShowPreview(true);
      } else {
        setShowPreview(true);
      }
    });
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const handlePublish = async (data: JobFormData) => {
    if (!session?.user?.id) {
      toast.error("User not authenticated. Please log in.");
      return;
    }

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

      const selectedCategory = jobCategories?.data.find((cat: JobCategory) => cat._id === data.categoryId);

      const postData = {
        userId: data.userId || userId,
        title: DOMPurify.sanitize(data.jobTitle),
        description: DOMPurify.sanitize(data.jobDescription),
        companyName: "Unknown Company",
        salaryRange: data.compensation ? DOMPurify.sanitize(data.compensation) : "$0 - $0",
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
        applicationRequirement: data.applicationRequirements
          ?.filter((req) => req.required)
          .map((req) => ({ requirement: `${DOMPurify.sanitize(req.label)} required` })) || [],
        customQuestion: data.customQuestions
          ?.filter((q) => q.question)
          .map((q) => ({ question: DOMPurify.sanitize(q.question!) })) || [],
        employmentType: data.employmentType,
        websiteUrl: data.companyUrl ? DOMPurify.sanitize(data.companyUrl) : undefined,
        publishDate: getPublishDate(),
        careerStage: data.careerStage,
        locationType: data.locationType,
      };

      await postJob(postData);
      toast.success("Job published successfully!");
      router.push("/jobs");
    } catch (error) {
      console.error("Error publishing job:", error);
      toast.error(error instanceof Error ? error.message : "Failed to publish job");
    } finally {
      setIsPending(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 overflow-x-auto">
      <div className="flex items-center min-w-max">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.active ? "bg-[#2B7FD0] text-white" : "bg-gray-200 text-gray-600"
                }`}
                aria-current={step.active ? "step" : undefined}
              >
                {step.number}
              </div>
              <span className="hidden lg:block text-sm md:text-xl mt-2 text-[#000000] font-normal">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.number ? "bg-[#2B7FD0]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: "Job Details", active: currentStep >= 1 },
    { number: 2, title: "Job Description", active: currentStep >= 2 },
    { number: 3, title: "Application Requirements", active: currentStep >= 3 },
    { number: 4, title: "Custom Questions", active: currentStep >= 4 },
    { number: 5, title: "Finish", active: currentStep >= 5 },
  ];

  const renderJobDetails = () => (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Job Details</h2>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Job Title<span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-10 border-gray-300 h-12 rounded-lg focus-visible:ring-2"
                      placeholder="e.g. Software Engineer"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Department</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg">
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Country<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={countries.map((country) => ({
                        value: country.country,
                        label: country.country,
                      }))}
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                        setSelectedCountry(value);
                        form.setValue("region", "");
                      }}
                      placeholder={isLoadingCountries ? "Loading..." : "Select Country"}
                      disabled={isLoadingCountries}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    City<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={cities.map((city) => ({
                        value: city,
                        label: city,
                      }))}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={
                        !selectedCountry ? "Select country first" : isLoadingCities ? "Loading..." : "Select City"
                      }
                      minSearchLength={2}
                      disabled={isLoadingCities || !selectedCountry}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Other FormFields remain the same as in the original code */}
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Employment Type<span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg">
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vacancy"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Vacancy<span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    className="border-gray-300 h-12 rounded-lg focus-visible:ring-2"
                    placeholder="e.g. 5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Experience Level<span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg">
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior Level (5+ years)</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="locationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Location Type<span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg">
                      <SelectItem value="onsite">Onsite</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="careerStage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Career Stage<span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                      <SelectValue placeholder="Select career stage" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg">
                      <SelectItem value="New Entry">New Entry</SelectItem>
                      <SelectItem value="Experienced Professional">Experienced Professional</SelectItem>
                      <SelectItem value="Career Returner">Career Returner</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Job Category<span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selectedCat = jobCategories?.data.find((cat: JobCategory) => cat._id === value);
                      setSelectedCategoryRoles(selectedCat?.role || []);
                      form.setValue("role", "");
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                      <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg">
                      {categoriesLoading ? (
                        <SelectItem value="loading">Loading...</SelectItem>
                      ) : categoriesError ? (
                        <SelectItem value="error">Error loading categories</SelectItem>
                      ) : (
                        jobCategories?.data.map((category: JobCategory) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                {categoriesError && <p className="text-sm text-red-500">Failed to load categories</p>}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Role<span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                      <SelectValue placeholder={selectedCategoryRoles.length > 0 ? "Select role" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg">
                      {selectedCategoryRoles.length === 0 ? (
                        <SelectItem value="no-roles">No roles available</SelectItem>
                      ) : (
                        selectedCategoryRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="compensation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Compensation (Optional)</FormLabel>
                <FormControl>
                  <Input
                    className="h-12 border-gray-300 rounded-lg focus-visible:ring-2"
                    placeholder="e.g. $80,000 - $100,000 per year"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Company Website URL (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    className="h-12 border-gray-300 rounded-lg focus-visible:ring-2"
                    placeholder="e.g. https://yourcompany.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Job Posting Expiration Date
                  <span className="text-gray-500 ml-1">(Posting can be reopened)</span>
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                      <SelectValue placeholder="Select expiration date" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg">
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="custom">Custom date</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-4 w-full justify-center mt-6">
          <Button
            variant="outline"
            className="h-11 px-6 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
            disabled={currentStep === 1}
          >
            Back
          </Button>
          <Button
            className="h-11 px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 rounded-lg text-white"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderJobDescription = () => (
    <div className="bg-white p-6 rounded-md">
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-none">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-[#000000] mb-6">Job Description</h2>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Job Description<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <TextEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <p className="text-sm text-gray-600">Character count: {field.value.length}/2000</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-none">
            <CardContent className="p-6">
              <div className="flex items-start space-x-2 mb-4">
                <Info className="h-5 w-5 text-[#9EC7DC]" />
                <h3 className="text-base font-semibold text-[#9EC7DC]">TIP</h3>
              </div>
              <p className="text-base text-[#000000] mb-4">
                Job boards will often reject jobs that do not have quality job descriptions. To ensure that your job
                description matches the requirements for job boards, consider the following guidelines:
              </p>
              <ul className="list-disc list-inside text-base text-[#000000] space-y-2">
                <li>Job descriptions should be clear, well-written, and informative</li>
                <li>Job descriptions with 700-2000 characters get the most interaction</li>
                <li>Do not use discriminatory language</li>
                <li>Do not post offensive or inappropriate content</li>
                <li>Be honest about the job requirement details</li>
                <li>Help the candidate understand the expectations for this role</li>
              </ul>
              <p className="text-base text-[#000000] mt-4">
                For more tips on writing good job descriptions,{" "}
                <a href="#" className="text-[#9EC7DC] hover:underline">
                  read our help article.
                </a>
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[#000000]">Publish Now</h3>
                <Switch
                  checked={publishNow}
                  onCheckedChange={setPublishNow}
                  className="data-[state=checked]:bg-[#2B7FD0]"
                />
              </div>
              {!publishNow && (
                <div className="border rounded-lg p-3">
                  <FormField
                    control={form.control}
                    name="publishDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold mb-3">Schedule Publish</FormLabel>
                        <FormControl>
                          <CustomCalendar
                            selectedDate={field.value ? new Date(field.value) : undefined}
                            onDateSelect={(date) => {
                              setSelectedDate(date);
                              field.onChange(date?.toISOString());
                            }}
                          />
                        </FormControl>
                        {field.value && (
                          <p className="text-sm text-gray-600 mt-2">
                            Selected date: {new Date(field.value).toLocaleDateString()}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-6">
        <Button
          className="border border-[#2B7FD0] h-11 px-6 text-[#2B7FD0] hover:bg-transparent"
          variant="outline"
          onClick={handleCancel}
        >
          Back
        </Button>
        <Button className="h-11 px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/85" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );

  const renderApplicationRequirements = () => (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#000000]">Application Requirements</h2>
        </div>
        <p className="text-xl text-[#000000] mb-6">
          What personal info would you like to gather about each applicant?
        </p>
        <div className="space-y-4">
          {applicationRequirements.map((requirement, index) => (
            <div key={requirement.id} className="flex items-center justify-between py-2 border-b pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-[22px] h-[22px] bg-[#2B7FD0] rounded-full flex items-center justify-center">
                  <Check className="text-white w-4 h-4" />
                </div>
                <span className="text-xl text-[#000000] font-normal">{requirement.label}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={!requirement.required ? "default" : "outline"}
                  className={`h-9 px-4 rounded-lg text-sm font-medium ${
                    !requirement.required
                      ? "bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
                      : "border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent"
                  }`}
                  onClick={() => updateRequirement(index, { ...requirement, required: false })}
                >
                  Optional
                </Button>
                <Button
                  variant={requirement.required ? "default" : "outline"}
                  className={`h-9 px-4 rounded-lg text-sm font-medium ${
                    requirement.required
                      ? "bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
                      : "border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent"
                  }`}
                  onClick={() => updateRequirement(index, { ...requirement, required: true })}
                >
                  Required
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <Button
            variant="outline"
            className="h-11 px-6 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
          >
            Back
          </Button>
          <Button
            className="h-11 px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 rounded-lg text-white"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCustomQuestions = () => (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#000000]">Add Custom Questions</h2>
          <Button
            className="border border-[#2B7FD0] h-9 px-4 text-sm text-[#2B7FD0] hover:bg-transparent"
            variant="outline"
            onClick={handleNext}
          >
            Skip
          </Button>
        </div>
        <p className="text-xl text-[#808080] font-medium mb-6">
          Would you require visa sponsorship for this role within the next two years?
        </p>
        <div className="space-y-4 mb-6">
          {customQuestions.map((question, index) => (
            <FormField
              key={question.id}
              control={form.control}
              name={`customQuestions.${index}.question`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-medium text-[#2B7FD0]">Ask a question</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Write Here"
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <Button
          variant="outline"
          onClick={() => appendCustomQuestion({ id: Date.now().toString(), question: "" })}
          className="border-none mb-6 text-[#2B7FD0] flex items-center justify-center text-xl font-medium hover:text-[#2B7FD0] hover:bg-transparent"
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 bg-[#2B7FD0]">
            <Plus className="w-4 h-4 text-white" />
          </div>
          Add a question
        </Button>
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            className="h-11 px-6 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
          >
            Back
          </Button>
          <Button
            className="h-11 px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 rounded-lg text-white"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderFinish = () => (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Card className="w-full max-w-2xl border-none shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-semibold text-[#131313] mb-8">
              Your job posting is ready!
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button
                variant="outline"
                className="w-full sm:w-[267px] h-12 border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent"
                onClick={handlePreviewClick}
              >
                Preview Your Post
              </Button>
              <Button
                className="w-full sm:w-[267px] h-12 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white"
                onClick={form.handleSubmit(handlePublish)}
                disabled={isPending}
              >
                {isPending ? "Publishing..." : "Publish Your Post"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (showPreview) {
    const formData = form.getValues();
    const safeCompanyUrl = formData.companyUrl || "";
    const selectedCategory = jobCategories?.data.find((cat: JobCategory) => cat._id === formData.categoryId);
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Preview</h1>
            <p className="text-gray-600">Review your job posting before publishing</p>
          </div>
          <form onSubmit={form.handleSubmit(handlePublish)}>
            <JobPreview
              formData={{
                ...formData,
                category: selectedCategory?.name || "",
              }}
              companyUrl={safeCompanyUrl}
              applicationRequirements={formData.applicationRequirements || []}
              customQuestions={formData.customQuestions?.filter((q) => q.question) || []}
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
          <form onSubmit={form.handleSubmit(handlePublish)} className="space-y-6">
            {renderStepIndicator()}
            {currentStep === 1 && renderJobDetails()}
            {currentStep === 2 && renderJobDescription()}
            {currentStep === 3 && renderApplicationRequirements()}
            {currentStep === 4 && renderCustomQuestions()}
            {currentStep === 5 && renderFinish()}
          </form>
        </Form>
      </div>
    </div>
  );
}