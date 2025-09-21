"use client";

// =========================
// CreateRecruiterAccountForm.tsx (UPDATED)
// - sLink uses { label, url } (with legacy [link] back-compat in FormData)
// - Delete-before-upload flow for Elevator Pitch
// - Full-width upload button, spinner, success banner
// =========================

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, X, ChevronsUpDown, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  uploadElevatorPitch,
  deleteElevatorPitchVideo,
} from "@/lib/api-service";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import Image from "next/image";
import { CompanySelector } from "@/components/company/company-selector";
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
import { ElevatorPitchUpload } from "./elevator-pitch-upload";
import { SocialLinksSection } from "./social-links-section";
import CustomDateInput from "@/components/custom-date-input";
import apiClient from "@/lib/api-service";

interface Option {
  value: string;
  label: string;
}
interface Education {
  school: string;
  degree: string;
  year: string;
}
interface SocialLink {
  label: string;
  url?: string; // UPDATED
}
interface Country {
  country: string;
  cities: string[];
}

// ---------- Zod schema updates
const urlOptional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional()
  .pipe(z.string().url("Invalid URL").optional());

const recruiterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  sureName: z.string().optional(),
  emailAddress: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  title: z.string().min(1, "Current position is required"),
  bio: z.string().optional(),
  experience: z.string().min(1, "Years of experience is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  companyRecruiters: z.array(z.string()).optional(),
  educations: z
    .array(
      z.object({
        school: z.string().min(1, "Institution name is required"),
        degree: z.string().min(1, "Degree is required"),
        year: z.string().min(1, "Year is required"),
      })
    )
    .optional(),
  sLink: z
    .array(
      z.object({
        label: z.string().min(1, "Platform name is required"),
        url: urlOptional, // UPDATED key
      })
    )
    .optional(),
  companyId: z.string().optional(),
  userId: z.string().optional(),
});

type RecruiterFormData = z.infer<typeof recruiterSchema>;

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

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  const displayedOptions = filteredOptions.slice(0, 100);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < minSearchLength ? (
              <CommandEmpty>
                Type at least {minSearchLength} characters to search.
              </CommandEmpty>
            ) : displayedOptions.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {displayedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredOptions.length > 100 && (
              <CommandItem disabled>
                More results available. Refine your search.
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function CreateRecruiterAccountForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>();
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [isElevatorPitchUploaded, setIsElevatorPitchUploaded] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RecruiterFormData>({
    resolver: zodResolver(recruiterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      sureName: "",
      emailAddress: "",
      phoneNumber: "",
      title: "",
      bio: "",
      experience: "",
      country: "",
      city: "",
      zipCode: "",
      skills: [],
      languages: [],
      companyRecruiters: [],
      educations: [{ school: "", degree: "", year: "" }],
      sLink: [
        { label: "LinkedIn", url: "" },
        { label: "Twitter", url: "" },
        { label: "Upwork", url: "" },
        { label: "Facebook", url: "" },
        { label: "TikTok", url: "" },
        { label: "Instagram", url: "" },
      ],
      companyId: "",
      userId: userId || "",
    },
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control: form.control,
    name: "educations",
  });

  const { data: countries, isLoading: isLoadingCountries } = useQuery<
    Country[]
  >({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries"
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch countries");
      return data.data as Country[];
    },
  });

  const { data: cities, isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ["cities", selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return [];
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
      return data.data as string[];
    },
    enabled: !!selectedCountry,
  });

  useEffect(() => {
    if (countries && countries.length > 0 && !form.getValues("country")) {
      const defaultCountry = countries[0].country;
      form.setValue("country", defaultCountry);
      setSelectedCountry(defaultCountry);
    }
  }, [countries, form]);

  useEffect(() => {
    if (selectedCompany) {
      form.setValue("companyId", selectedCompany);
    }
  }, [selectedCompany, form]);

  useEffect(() => {
    if (userId) {
      form.setValue("userId", userId);
    }
  }, [userId, form]);

  // Cleanup browser extension attributes to prevent hydration mismatch
  useEffect(() => {
    const cleanupAttributes = () => {
      document
        .querySelectorAll(
          '[bis_skin_checked], [bis_register], [__processed_b668fbb6-84d8-4f67-8dbe-4c6dc7981cbf__]'
        )
        .forEach((el) => {
          el.removeAttribute("bis_skin_checked");
          el.removeAttribute("bis_register");
          el.removeAttribute(
            "__processed_b668fbb6-84d8-4f67-8dbe-4c6dc7981cbf__"
          );
        });
    };
    cleanupAttributes();
  }, []);

  const uploadElevatorPitchMutation = useMutation({
    mutationFn: async ({
      videoFile,
      userId,
    }: {
      videoFile: File;
      userId: string;
    }) => {
      return await uploadElevatorPitch({ videoFile, userId });
    },
    onSuccess: (data) => {
      setIsElevatorPitchUploaded(true);
      setUploadedVideoUrl(data.videoUrl);
      toast.success("Elevator pitch uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to upload elevator pitch"
      );
    },
  });

  const deleteElevatorPitchMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await deleteElevatorPitchVideo(userId);
    },
    onSuccess: () => {
      setIsElevatorPitchUploaded(false);
      setUploadedVideoUrl(null);
      setElevatorPitchFile(null);
      toast.success("Elevator pitch deleted successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete elevator pitch"
      );
    },
  });

  const createRecruiterAccount = async (data: RecruiterFormData) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === "sLink") {
        (value as SocialLink[])?.forEach((item, index) => {
          if (!item?.label) return;
          formData.append(`sLink[${index}][label]`, item.label);
          if (item.url) {
            formData.append(`sLink[${index}][url]`, item.url); // new key
            formData.append(`sLink[${index}][link]`, item.url); // optional: legacy back-compat
          }
        });
        return;
      }

      if (key === "educations") {
        formData.append("educations", JSON.stringify(value));
        return;
      }

      if (
        key === "skills" ||
        key === "languages" ||
        key === "companyRecruiters"
      ) {
        formData.append(key, JSON.stringify(value));
        return;
      }

      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (photoFile) formData.append("photo", photoFile);
    if (bannerFile) formData.append("banner", bannerFile);

    try {
      const response = await apiClient.post(
        "/recruiter/recruiter-account",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };

  const mutation = useMutation({
    mutationFn: createRecruiterAccount,
    onSuccess: () => {
      toast.success("Recruiter account created successfully");
      queryClient.invalidateQueries({ queryKey: ["recruiter"] });
      queryClient.invalidateQueries({ queryKey: ["company-account"] });
      queryClient.invalidateQueries({ queryKey: ["my-resume"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create recruiter account"
      );
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const url = URL.createObjectURL(file);
      setBannerPreview(url);
    }
  };

  const handleElevatorPitchUpload = async () => {
    if (!elevatorPitchFile || !session?.user?.id) {
      toast.error("Please select a video file and ensure you are logged in");
      return;
    }

    // DELETE BEFORE UPLOAD
    try {
      // swallow deletion errors (no previous file etc.)
      await deleteElevatorPitchMutation.mutateAsync(session.user.id);
    } catch (_) {}

    uploadElevatorPitchMutation.mutate({
      videoFile: elevatorPitchFile,
      userId: session.user.id,
    });
  };

  const handleElevatorPitchDelete = async () => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }
    deleteElevatorPitchMutation.mutate(session.user.id);
  };

  const getFirstErrorMessage = (errors: any): string | undefined => {
    for (const key in errors) {
      const error = errors[key];
      if (error?.message) return `${key}: ${error.message}`;
      if (typeof error === "object") {
        for (const subKey in error) {
          if (error[subKey]?.message)
            return `${key}[${subKey}]: ${error[subKey].message}`;
          if (typeof error[subKey] === "object") {
            for (const subSubKey in error[subKey]) {
              if (error[subKey][subSubKey]?.message) {
                return `${key}[${subKey}].${subSubKey}: ${error[subKey][subSubKey].message}`;
              }
            }
          }
        }
      }
    }
    return undefined;
  };

  const onSubmit = async (data: RecruiterFormData) => {
    if (!isElevatorPitchUploaded) {
      toast.error("Please upload an elevator pitch video before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      const submissionData = { ...data, userId: userId || data.userId };
      await mutation.mutateAsync(submissionData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Create Recruiter Account</h1>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            async (data) => {
              await onSubmit(data);
            },
            (errors) => {
              const errorMessage = getFirstErrorMessage(errors);
              toast.error(errorMessage || "Please fill in all required fields");
            }
          )}
          className="space-y-6"
        >
          {/* Elevator Pitch (UPDATED UX) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Elevator Pitch
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload a short video introducing yourself. This is required
                before submitting.
              </p>
            </CardHeader>
            <CardContent>
              <ElevatorPitchUpload
                onFileSelect={setElevatorPitchFile}
                selectedFile={elevatorPitchFile}
                uploadedVideoUrl={uploadedVideoUrl}
                onDelete={handleElevatorPitchDelete}
                isUploaded={isElevatorPitchUploaded}
              />

              {elevatorPitchFile && !isElevatorPitchUploaded && (
                <Button
                  type="button"
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                  onClick={handleElevatorPitchUpload}
                  disabled={uploadElevatorPitchMutation.isPending}
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    "Upload Elevator Pitch"
                  )}
                </Button>
              )}

              {isElevatorPitchUploaded && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">
                    ✓ Elevator pitch uploaded successfully! You can now submit.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Banner Upload */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-medium">
                    Upload Banner (Optional)
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() =>
                    document.getElementById("banner-upload")?.click()
                  }
                >
                  Upload/Change Banner
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-16 text-center bg-gray-900 text-white">
                {bannerPreview ? (
                  <div className="space-y-4">
                    <Image
                      src={bannerPreview}
                      alt="Banner preview"
                      width={600}
                      height={200}
                      className="mx-auto rounded-lg object-cover"
                    />
                    <p className="text-sm text-green-400">
                      Banner uploaded: {bannerFile?.name}
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg mb-2">Drop image here</p>
                    <p className="text-sm mb-4 text-gray-400">or</p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                      onClick={() =>
                        document.getElementById("banner-upload")?.click()
                      }
                    >
                      Choose File
                    </Button>
                  </>
                )}
                <Input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerUpload}
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="mt-[-130px]">
                  <Label className="text-sm font-medium">Profile Photo</Label>
                  <div>
                    {photoPreview ? (
                      <div>
                        <Image
                          src={photoPreview}
                          alt="Profile preview"
                          width={170}
                          height={170}
                          className="rounded bg-gray-100 border-2 border-dashed border-gray-300"
                        />
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-1 bg-transparent"
                            onClick={() =>
                              document.getElementById("photo-upload")?.click()
                            }
                          >
                            Change Photo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-[170px] h-[170px] rounded bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("photo-upload")?.click()
                          }
                        >
                          Upload Photo
                        </Button>
                      </div>
                    )}
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Bio (Optional)
                        </FormLabel>
                        <FormControl>
                          <TextEditor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Word count:{" "}
                          {(field.value ?? "").trim()
                            ? (field.value ?? "")
                                .trim()
                                .split(/\s+/).length
                            : 0}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sureName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter surname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address*</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Position*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter current position"
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
                      <FormLabel>Years of Experience*</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select Experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-1">0-1 years</SelectItem>
                            <SelectItem value="2-5">2-5 years</SelectItem>
                            <SelectItem value="6-10">6-10 years</SelectItem>
                            <SelectItem value="10+">10+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country*</FormLabel>
                      <FormControl>
                        <Combobox
                          options={(countries || []).map((c) => ({
                            value: c.country,
                            label: c.country,
                          }))}
                          value={field.value || ""}
                          onChange={(value) => {
                            field.onChange(value);
                            setSelectedCountry(value);
                          }}
                          placeholder={
                            isLoadingCountries ? "Loading..." : "Select Country"
                          }
                          minSearchLength={0}
                          disabled={isLoadingCountries}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City (Optional)</FormLabel>
                      <FormControl>
                        <Combobox
                          options={(cities || []).map((city) => ({
                            value: city,
                            label: city,
                          }))}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder={
                            !selectedCountry
                              ? "Select country first"
                              : isLoadingCities
                              ? "Loading..."
                              : "Select City"
                          }
                          minSearchLength={2}
                          disabled={isLoadingCities || !selectedCountry}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip/Postal Code (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Zip/Postal Code"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  View your company
                </h3>
                <CompanySelector
                  selectedCompany={selectedCompany}
                  onCompanyChange={setSelectedCompany}
                />
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <SocialLinksSection form={form} />
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Education (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {educationFields.map((field, index) => (
                <div key={field.id} className="space-y-4 border-b pb-4">
                  <FormField
                    control={form.control}
                    name={`educations.${index}.school`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter institution name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`educations.${index}.degree`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter degree" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`educations.${index}.year`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <CustomDateInput {...field} placeholder="MM/YYYY" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeEducation(index)}
                  >
                    <X className="mr-2 h-4 w-4" /> Remove Education
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={() =>
                  appendEducation({ school: "", degree: "", year: "" })
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Education
              </Button>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Languages (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="languages"
                render={({ field }) => {
                  const [inputValue, setInputValue] = useState("");
                  return (
                    <FormItem>
                      <FormLabel>Languages</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a language and press Enter"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = inputValue.trim();
                              if (
                                trimmed &&
                                !field.value?.includes(trimmed)
                              ) {
                                field.onChange([
                                  ...(field.value || []),
                                  trimmed,
                                ]);
                                setInputValue("");
                              }
                            }
                          }}
                        />
                      </FormControl>
                      {field.value && field.value.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {field.value.map((language: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center bg-gray-200 text-gray-800 px-2 py-1 rounded"
                            >
                              {language}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-4 w-4 p-0"
                                onClick={() => {
                                  field.onChange(
                                    (field.value ?? []).filter(
                                      (_: any, i: number) => i !== idx
                                    )
                                  );
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </CardContent>
          </Card>

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
              disabled={
                mutation.isPending || isSubmitting || !isElevatorPitchUploaded
              }
            >
              {mutation.isPending || isSubmitting ? (
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
