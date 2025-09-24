"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combo-box";
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
import { FileUpload } from "@/components/company/file-upload";
import { EmployeeSelector } from "@/components/company/employee-selector";
import { DynamicInputList } from "@/components/company/dynamic-input-list";
import { ElevatorPitchUpload } from "./elevator-pitch-upload";
import CustomDateInput from "@/components/custom-date-input";
import {
  createCompany,
  uploadElevatorPitch,
  deleteElevatorPitchVideo,
} from "@/lib/api-service";

// 👉 Add these imports (adjust paths if needed)
import { SocialLinksSection } from "./social-links-section";
import { AwardsSection } from "./resume/awards-section";
import { BannerUpload } from "./banner-upload";

// ---------- Types from the public APIs ----------
interface Country {
  country: string;
  cities?: string[];
}

interface DialCode {
  name: string; // country name
  dial_code: string; // e.g. "+221"
  code: string; // ISO alpha-2
}

// ---------- Form Schema ----------
const formSchema = z.object({
  cname: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name is too long"),
  country: z
    .string()
    .min(1, "Country is required")
    .max(50, "Country name is too long"),
  city: z.string().min(1, "City is required").max(50, "City name is too long"),
  zipcode: z
    .string()
    .min(1, "Zip code is required")
    .max(20, "Zip code is too long"),
  cemail: z
    .string()
    .email("Invalid email address")
    .max(100, "Email is too long"),
  cPhoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .max(20, "Phone number is too long"),
  aboutUs: z
    .string()
    .min(1, "About us is required")
    .max(1000, "About us is too long"),
  industry: z
    .string()
    .min(1, "Industry is required")
    .max(100, "Industry is too long"),
  banner: z.any().optional(),

  // Social links
  sLink: z
    .array(
      z.object({
        label: z.string().max(50, "Label is too long"),
        url: z.string().optional().or(z.literal("")),
      })
    )
    .optional(),

  // Awards remain unchanged
  awardsAndHonors: z
    .array(
      z.object({
        title: z.string().optional().or(z.literal("")),
        programeName: z.string().optional().or(z.literal("")),
        programeDate: z.string().optional().or(z.literal("")),
        description: z.string().optional().or(z.literal("")),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateCompanyPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [isElevatorPitchUploaded, setIsElevatorPitchUploaded] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([""]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);

  // ---------- React Query: Countries, Dial Codes, Cities ----------
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const { data: countriesData, isLoading: isLoadingCountries } = useQuery<
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

  const { data: dialCodesData, isLoading: isLoadingDialCodes } = useQuery<
    DialCode[]
  >({
    queryKey: ["dialCodes"],
    queryFn: async () => {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/codes"
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch dial codes");
      return data.data as DialCode[];
    },
  });

  const { data: citiesData, isLoading: isLoadingCities } = useQuery<string[]>({
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

  const countryOptions = useMemo(
    () =>
      countriesData?.map((c) => ({ value: c.country, label: c.country })) || [],
    [countriesData]
  );
  const cityOptions = useMemo(
    () => citiesData?.map((c) => ({ value: c, label: c })) || [],
    [citiesData]
  );

  // Dial code placeholder for phone
  const dialCodeByCountry = useMemo(() => {
    const map = new Map<string, string>();
    (dialCodesData || []).forEach((d) => map.set(d.name, d.dial_code));
    return map;
  }, [dialCodesData]);

  // ---------- Form ----------
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cname: "",
      country: "",
      city: "",
      zipcode: "",
      cemail: "",
      cPhoneNumber: "",
      banner: null,
      aboutUs: "",
      industry: "",
      sLink: [], // SocialLinksSection seeds this to 6 fixed rows
      awardsAndHonors: [],
    },
  });

  // Tie Select country to city query
  const watchedCountry = form.watch("country");
  useEffect(() => {
    setSelectedCountry(watchedCountry || "");
  }, [watchedCountry]);

  // Prefill from session once available
  useEffect(() => {
    if (!session?.user) return;

    const sessCountry = (session.user as any)?.country ?? "";
    const sessEmail = session.user.email ?? "";
    const sessPhone = (session.user as any)?.phoneNumber ?? "";
    const sessName = session.user.name ?? "";

    // If your backend wants company name separate from user, leave cname empty.
    // Otherwise we set cname from session name by default.
    form.reset({
      ...form.getValues(),
      cname: sessName || form.getValues("cname"),
      country: sessCountry || form.getValues("country"),
      cemail: sessEmail || form.getValues("cemail"),
      cPhoneNumber: sessPhone || form.getValues("cPhoneNumber"),
    });
  }, [session, form]);

  // Awards (react-hook-form field array)
  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAward,
  } = useFieldArray({
    control: form.control,
    name: "awardsAndHonors",
  });

  // ---------- Mutations ----------
  const createCompanyMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      toast.success("Company created successfully!");
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create company");
    },
  });

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
      toast.success("Elevator pitch uploaded successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload video");
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
      toast.success("Elevator pitch deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete video");
    },
  });

  // ---------- Handlers ----------
  const handleElevatorPitchUpload = async () => {
    if (!elevatorPitchFile || !session?.user?.id) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Always try delete first; ignore errors if nothing exists
      try {
        await deleteElevatorPitchMutation.mutateAsync(session.user.id);
      } catch (_) {
        // no-op
      }

      await uploadElevatorPitchMutation.mutateAsync({
        videoFile: elevatorPitchFile,
        userId: session.user.id,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Could not upload your elevator pitch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleElevatorPitchDelete = async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }
    deleteElevatorPitchMutation.mutate(userId);
  };

  useEffect(() => {
    if (bannerFile) {
      const objectUrl = URL.createObjectURL(bannerFile);
      setBannerPreviewUrl(objectUrl);

      // Cleanup
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setBannerPreviewUrl(null);
    }
  }, [bannerFile]);
  const handleBannerSelect = (file: File | null) => {
    setBannerFile(file);
    form.setValue("banner", file);
  };

  const onSubmit = async (data: FormData) => {
    const userId = (session?.user as any)?.id;
    if (!userId) {
      toast.error("Please log in to create a company");
      return;
    }
    if (!isElevatorPitchUploaded) {
      toast.error("Please upload an elevator pitch video before submitting.");
      return;
    }

    const formData = new FormData();

    if (bannerFile) {
      formData.append("banner", bannerFile);
    }
    if (logoFile) {
      formData.append("clogo", logoFile);
    }

    // Basic fields
    const base = {
      cname: data.cname,
      country: data.country,
      city: data.city,
      zipcode: data.zipcode,
      cemail: data.cemail,
      cPhoneNumber: data.cPhoneNumber,
      aboutUs: data.aboutUs,
      industry: data.industry,
    };
    Object.entries(base).forEach(([k, v]) => formData.append(k, v ?? ""));

    // Links: websites + social links URLs
    const sLinks = (data.sLink ?? [])
      .filter((s) => s.label && (s.url || s.url === ""))
      .map((s) => ({
        label: s.label,
        url: s.url || "",
      }));

    // const websiteLinks = (websites ?? []).filter(Boolean).map((url) => ({
    //   label: "Website", // or however you want to label them
    //   url,
    // }));

    // const allLinks = [...websiteLinks, ...sLinks];
    const allLinks = [...sLinks];

    formData.append("sLink", JSON.stringify(allLinks));

    // Services
    const filteredServices = services.map((s) => s.trim()).filter(Boolean);
    formData.append("service", JSON.stringify(filteredServices));

    // Employees
    formData.append("employeesId", JSON.stringify(selectedEmployees));

    // Awards
    const filteredAwards = (data.awardsAndHonors ?? []).filter((a) =>
      (a.title ?? "").trim()
    );
    // Keep your backend key casing:
    formData.append("AwardsAndHonors", JSON.stringify(filteredAwards));

    try {
      // await createCompanyMutation.mutateAsync(formData);
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const phonePlaceholder =
    dialCodeByCountry.get(form.getValues("country") || "") ?? "+1";

  return (
    <div className="container mx-auto py-6 space-y-8 bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Create Company/Business Account
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Elevator Pitch Upload */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Company Elevator Pitch
                </h2>
                <p className="text-sm text-gray-600 max-w-2xl">
                  Upload a 60-second elevator video pitch introducing your
                  company and what should make candidates want to join you!
                </p>
              </div>
            </div>

            <ElevatorPitchUpload
              onFileSelect={setElevatorPitchFile}
              selectedFile={elevatorPitchFile}
              uploadedVideoUrl={uploadedVideoUrl}
              onDelete={handleElevatorPitchDelete}
              isUploaded={isElevatorPitchUploaded}
            />
            <div className="flex justify-center">
              <Button
                type="button"
                className="w-full bg-primary hover:bg-blue-700 text-white py-3 text-lg font-medium"
                onClick={handleElevatorPitchUpload}
                disabled={
                  !elevatorPitchFile ||
                  uploadElevatorPitchMutation.isPending ||
                  isElevatorPitchUploaded
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
            </div>
          </div>

          {/* Company Logo and About */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Company Banner
            </h2>
            <BannerUpload
              onFileSelect={handleBannerSelect}
              previewUrl={bannerPreviewUrl}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Company Logo
              </Label>
              <div className="aspect-square">
                <FileUpload
                  onFileSelect={setLogoFile}
                  accept="image/*"
                  className="h-full"
                >
                  <div className="w-full h-full bg-primary text-white flex items-center justify-center text-sm font-medium rounded-lg">
                    photo/recruiter logo
                  </div>
                </FileUpload>
              </div>
            </div>

            <div className="md:col-span-3 space-y-2">
              <FormField
                control={form.control}
                name="aboutUs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      About Us*
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Write your description here (400 words)"
                        className="min-h-[140px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Company Details */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="cname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Company Name*
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your Company Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Country (dynamic) */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country*</FormLabel>
                    <FormControl>
                      <Combobox
                        options={countryOptions}
                        value={field.value || ""}
                        onChange={(val) => {
                          field.onChange(val);
                          form.setValue("city", ""); // reset city
                        }}
                        placeholder={
                          isLoadingCountries
                            ? "Loading countries..."
                            : "Select Country"
                        }
                        disabled={isLoadingCountries}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City (depends on country) */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City*</FormLabel>
                    <FormControl>
                      <Combobox
                        options={cityOptions}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={
                          !form.getValues("country")
                            ? "Select country first"
                            : isLoadingCities
                            ? "Loading cities..."
                            : "Select City"
                        }
                        minSearchLength={2}
                        disabled={isLoadingCities || !form.getValues("country")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Zipcode (input, not a select) */}
              <FormField
                control={form.control}
                name="zipcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Zip / Postal Code*
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter Zip/Postal Code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <FormField
                control={form.control}
                name="cemail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Email Address*
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter Your Email Address"
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="cPhoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Phone Number*
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`${phonePlaceholder} 234567890`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Websites */}
          {/* <DynamicInputList
            label="Website"
            placeholder="Enter Your Website Url"
            values={websites}
            onChange={setWebsites}
            buttonText="Add More"
          /> */}

          {/* Social Links (fixed 6) */}
          <SocialLinksSection form={form} />

          {/* Industry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Industry*
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Services */}
            <DynamicInputList
              label="Services*"
              placeholder="Add Here"
              values={services}
              onChange={setServices}
            />
          </div>

          {/* Employee Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              View your company employees
            </h3>
            <EmployeeSelector
              selectedEmployees={selectedEmployees}
              onEmployeesChange={setSelectedEmployees}
            />
          </div>

          {/* Awards & Honors (Field Array + Component) */}
          <AwardsSection
            form={form}
            awardFields={awardFields}
            appendAward={(value) =>
              appendAward(
                value ?? {
                  title: "",
                  programeName: "",
                  programeDate: "",
                  description: "",
                }
              )
            }
            removeAward={removeAward}
          />

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-blue-700 text-white py-3 text-lg font-medium"
            disabled={
              createCompanyMutation.isPending || !isElevatorPitchUploaded
            }
          >
            {createCompanyMutation.isPending ? (
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
                Creating...
              </div>
            ) : (
              "Save"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
