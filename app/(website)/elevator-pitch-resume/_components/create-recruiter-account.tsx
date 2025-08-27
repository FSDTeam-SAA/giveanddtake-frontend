"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import apiClient, { uploadElevatorPitch } from "@/lib/api-service";
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
import { FileUpload } from "@/components/company/file-upload";

interface Option {
  value: string;
  label: string;
}

interface Education {
  school: string;
  degree: string;
  year: string;
}

interface Skill {
  name: string;
}

interface SocialLink {
  label: string;
  link: string;
}

interface Country {
  country: string;
  cities: string[];
}

const recruiterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  sureName: z.string().optional(),
  emailAddress: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  title: z.string().min(1, "Current position is required"),
  bio: z
    .string()
    .min(1, "Bio is required")
    .refine(
      (value) => {
        const wordCount = value.trim().split(/\s+/).length;
        return wordCount <= 200;
      },
      {
        message: "Bio cannot exceed 200 words",
      }
    ),
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
    .min(1, "At least one education entry is required"),
  sLink: z
    .array(
      z.object({
        label: z.string().min(1, "Platform name is required"),
        link: z.string(),
      })
    )
    .optional(),
  companyId: z.string().min(1, "Company selection is required"),
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
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;
  const token = session?.accessToken;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>();
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);

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
        { label: "Upwork", link: "https://www.upwork.com/" },
        { label: "LinkedIn", link: "https://www.linkedin.com/" },
        { label: "X", link: "https://x.com/" },
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

  const {
    fields: socialLinkFields,
    append: appendSocialLink,
    remove: removeSocialLink,
  } = useFieldArray({
    control: form.control,
    name: "sLink",
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
          headers: {
            "Content-Type": "application/json",
          },
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

  const createRecruiterAccount = async (data: RecruiterFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "sLink") {
        (value as SocialLink[]).forEach((link, index) => {
          formData.append(`sLink[${index}][label]`, link.label);
          formData.append(`sLink[${index}][link]`, link.link);
        });
      } else if (key === "educations") {
        formData.append("educations", JSON.stringify(value));
      } else if (
        key === "skills" ||
        key === "languages" ||
        key === "companyRecruiters"
      ) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (photoFile) formData.append("photo", photoFile);
    if (bannerFile) formData.append("banner", bannerFile);
    if (elevatorPitchFile && session?.user?.id) {
      await uploadElevatorPitchMutation.mutateAsync({
        videoFile: elevatorPitchFile,
        userId: session.user.id,
      });
    }

    try {
      const response = await apiClient.post(
        "/recruiter/recruiter-account",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
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
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Recruiter account created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["recruiter"] });
      queryClient.invalidateQueries({ queryKey: ["company-account"] });
      queryClient.invalidateQueries({ queryKey: ["my-resume"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create recruiter account",
        variant: "destructive",
      });
    },
  });

  const uploadElevatorPitchMutation = useMutation({
    mutationFn: uploadElevatorPitch,
    onSuccess: () => {
      // toast.success("Elevator pitch uploaded successfully!");
    },
    onError: (error: any) => {
      // toast.error(error.response?.data?.message || "Failed to upload video");
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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
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

  const onSubmit = (data: RecruiterFormData) => {
    const submissionData = { ...data, userId: userId || data.userId };
    mutation.mutate(submissionData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Create Recruiter Account</h1>
        <Button
          variant="outline"
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        >
          Continue with Google
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            const firstError = Object.values(errors)[0];
            if (firstError) {
              toast({
                title: "Error",
                description:
                  firstError.message || "Please fill in all required fields",
                variant: "destructive",
              });
            }
          })}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-medium">
                    Upload Your Elevator Pitch (Optional)
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg text-center bg-gray-900 text-white">
                <FileUpload
                  onFileSelect={setElevatorPitchFile}
                  accept="video/*"
                  maxSize={100 * 1024 * 1024}
                  variant="dark"
                ></FileUpload>
              </div>
            </CardContent>
          </Card>

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
                  <div className="">
                    <div>
                      {photoPreview ? (
                        <div className="">
                          <Image
                            src={photoPreview || "/placeholder.svg"}
                            alt="Profile preview"
                            width={80}
                            height={80}
                            className="w-[170px] h-[170px] rounded bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center"
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
                    </div>
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
                          Bio
                        </FormLabel>
                        <FormControl>
                          <TextEditor
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Word count: {field.value.trim().split(/\s+/).length}
                          /200
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
                      <FormLabel>Surname</FormLabel>
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                          options={(countries || []).map((country) => ({
                            value: country.country,
                            label: country.country,
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
                      <FormLabel>City</FormLabel>
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
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter zip code" {...field} />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Social Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {socialLinkFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`sLink.${index}.label`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. GitHub, Portfolio"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`sLink.${index}.link`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        onClick={() => removeSocialLink(index)} // Fixed: Changed removeSocialLinkwhose to removeSocialLink
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => appendSocialLink({ label: "", link: "" })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Social Link
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {educationFields.map((field, index) => (
                <div key={field.id} className="space-y-4 border-b pb-4">
                  <FormField
                    control={form.control}
                    name={`educations.${index}.school`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution Name*</FormLabel>
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
                        <FormLabel>Degree*</FormLabel>
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
                        <FormLabel>Year*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {educationFields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeEducation(index)}
                    >
                      <X className="mr-2 h-4 w-4" /> Remove Education
                    </Button>
                  )}
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter languages separated by commas (e.g., English, Spanish, French)"
                        value={field.value?.join(", ") || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Add Profiles of Company Recruiters (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="companyRecruiters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Recruiters</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter profile links separated by commas"
                        value={field.value?.join(", ") || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
              disabled={mutation.isPending || form.formState.isSubmitting}
            >
              {mutation.isPending || form.formState.isSubmitting ? (
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
