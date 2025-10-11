"use client";

import type React from "react";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Edit, Save, X, Check, ChevronsUpDown } from "lucide-react";
import DOMPurify from "dompurify";
import { editRecruiterAccount } from "@/lib/api-service";
import { toast } from "sonner";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import { CompanySelector } from "@/components/company/company-selector";
import SocialLinks from "./SocialLinks";
import { SocialLinksSection } from "./social-links-section";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BannerUpload } from "@/components/shared/banner-upload";
import { PhotoUpload } from "./update-resume/photo-upload";
import Image from "next/image";

type MaybeStringifiedArray = string[] | string | undefined | null;

type Company = {
  _id: string;
  userId: string;
  aboutUs?: string;
  avatar?: { url: string };
  name?: string;
  country?: string;
  city?: string;
  zipcode?: string;
  cemail?: string;
  cPhoneNumber?: string;
  links?: MaybeStringifiedArray;
  industry?: string;
  service?: MaybeStringifiedArray;
  employeesId?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

type Country = {
  country: string;
  cities: string[];
};

type SLinkItem = {
  label: string;
  url?: string;
  _id?: string;
};

export type Recruiter = {
  _id: string;
  userId: string;
  bio?: string;
  photo?: string;
  title?: string;
  aboutUs?: string;
  firstName?: string;
  sureName?: string;
  country?: string;
  city?: string;
  zipCode?: string;
  location?: string;
  emailAddress?: string;
  phoneNumber?: string;
  upworkUrl?: string;
  linkedIn?: string;
  xLink?: string;
  OtherLink?: string;
  roleAtCompany?: string;
  awardTitle?: string;
  programName?: string;
  programDate?: string;
  awardDescription?: string;
  companyId?: Company;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  sLink?: SLinkItem[];
  followerCount?: number;
  banner?: string;
};

const FALLBACK_IMAGE = "/placeholder.svg";

function parseMaybeStringifiedArray(input: MaybeStringifiedArray): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    if (
      input.length === 1 &&
      typeof input[0] === "string" &&
      input[0].trim().startsWith("[")
    ) {
      try {
        return JSON.parse(input[0]) as string[];
      } catch (e) {
        console.error("parseMaybeStringifiedArray: Failed to parse array", e);
        return input as string[];
      }
    }
    return input as string[];
  }
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as string[];
    } catch {
      return [input];
    }
  }
  return [];
}

function formatFollowerCount(n?: number) {
  if (!Number.isFinite(n as number)) return null;
  const num = Number(n);
  if (num < 1000) return `${num}`;
  if (num < 1_000_000)
    return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`;
}

const fetchCountries = async (): Promise<Country[]> => {
  const response = await fetch("https://countriesnow.space/api/v0.1/countries");
  const data = await response.json();
  if (data.error) throw new Error("Failed to fetch countries");
  return data.data as Country[];
};

const fetchCities = async (country: string): Promise<string[]> => {
  if (!country) return [];
  const response = await fetch(
    "https://countriesnow.space/api/v0.1/countries/cities",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    }
  );
  const data = await response.json();
  if (data.error) throw new Error("Failed to fetch cities");
  return data.data as string[];
};

export default function EditableRecruiterAccount({
  recruiter,
  onSave,
}: {
  recruiter: Recruiter;
  onSave?: (updatedRecruiter: Recruiter) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>(
    recruiter.companyId?._id || ""
  );
  const [isBannerUploaded, setIsBannerUploaded] = useState(false);
  const [isPhotoUploaded, setIsPhotoUploaded] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    recruiter.country || ""
  );
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const form = useForm<Recruiter>({
    defaultValues: {
      ...recruiter,
      sLink: recruiter.sLink || [],
    },
    mode: "onChange",
  });

  const {
    data: countriesData = [],
    isLoading: isLoadingCountries,
    error: countriesError,
  } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const {
    data: citiesData = [],
    isLoading: isLoadingCities,
    error: citiesError,
  } = useQuery({
    queryKey: ["cities", selectedCountry],
    queryFn: () => fetchCities(selectedCountry),
    enabled: !!selectedCountry && isEditing,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    setSelectedCompany(recruiter.companyId?._id || "");
    setSelectedCountry(recruiter.country || "");
    form.reset({
      ...recruiter,
      sLink: recruiter.sLink || [],
      companyId: recruiter.companyId || undefined,
      country: recruiter.country || "",
      city: recruiter.city || "",
    });
  }, [recruiter, form]);

  useEffect(() => {
    if (countriesError) toast.error("Failed to load countries.");
    if (citiesError) toast.error("Failed to load cities.");
  }, [countriesError, citiesError]);

  const handleBannerUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
      setIsBannerUploaded(true);
    };
    reader.onerror = () => {
      toast.error("Failed to read banner image.");
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
      setIsPhotoUploaded(true);
    };
    reader.onerror = () => {
      toast.error("Failed to read profile photo.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.getValues().userId) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      const values = form.getValues();
      const cleanedLinks = (values.sLink || []).filter(
        (l) => (l.label?.trim() || "") && (l.url?.trim() || "")
      );

      cleanedLinks.forEach((link, index) => {
        formData.append(`sLink[${index}][label]`, link.label);
        formData.append(`sLink[${index}][url]`, link.url || "");
      });

      Object.entries(values).forEach(([key, value]) => {
        if (key === "sLink") return;
        if (key === "photo" && photoFile) {
          formData.append("photo", photoFile);
          return;
        }
        if (key === "banner" && bannerFile) {
          formData.append("banner", bannerFile);
          return;
        }
        if (key === "companyId" && selectedCompany) {
          formData.append("companyId", selectedCompany);
          return;
        }
        if (key === "country" && values.country) {
          formData.append("country", values.country);
          return;
        }
        if (key === "city" && values.city) {
          formData.append("city", values.city);
          return;
        }
        if (typeof value === "string" && value.trim() !== "") {
          formData.append(key, value);
        }
      });

      const updatedRecruiter = await editRecruiterAccount(
        values.userId,
        formData
      );

      onSave?.(updatedRecruiter);
      setIsEditing(false);
      setPhotoPreview(null);
      setBannerPreview(null);
      setPhotoFile(null);
      setBannerFile(null);
      setIsBannerUploaded(false);
      setIsPhotoUploaded(false);
      form.reset(updatedRecruiter);

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Failed to save recruiter account:", error);
      toast.error(
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedCompany(recruiter.companyId?._id || "");
    setSelectedCountry(recruiter.country || "");
    setIsEditing(false);
    setPhotoPreview(null);
    setBannerPreview(null);
    setPhotoFile(null);
    setBannerFile(null);
    setIsBannerUploaded(false);
    setIsPhotoUploaded(false);
    form.reset({ ...recruiter, sLink: recruiter.sLink || [] });
  };

  const {
    firstName,
    sureName,
    title,
    bio,
    country,
    city,
    location,
    roleAtCompany,
    companyId,
    sLink,
    followerCount,
  } = isEditing ? form.getValues() : recruiter;

  const fullName =
    [firstName, sureName].filter(Boolean).join(" ") || "Recruiter";
  const taglineParts = [title, roleAtCompany].filter(Boolean);
  const primaryLocation =
    location || [city, country].filter(Boolean).join(", ");
  const displayPhoto = photoPreview || recruiter.photo || FALLBACK_IMAGE;
  const displayBanner = bannerPreview || recruiter.banner || "";

  const followersText = useMemo(() => {
    const formatted = formatFollowerCount(followerCount);
    return formatted ? `${formatted} followers` : null;
  }, [followerCount]);

  const companyLinks = companyId
    ? parseMaybeStringifiedArray(companyId.links)
    : [];
  const websiteHref =
    companyLinks[0] ||
    form.getValues()?.OtherLink ||
    form.getValues()?.upworkUrl ||
    recruiter?.OtherLink ||
    recruiter?.upworkUrl ||
    undefined;

  return (
    <div className="w-full bg-background">
      {/* Conditionally render BannerUpload only when editing */}
      {isEditing ? (
        <BannerUpload
          onFileSelect={handleBannerUpload}
          previewUrl={displayBanner}
        />
      ) : (
        /* Show static banner when not editing */
        recruiter.banner && (
          <div className="w-full h-auto">
            {recruiter.banner ? (
              <Image
                src={recruiter.banner}
                alt="Resume Header Background"
                width={1200}
                height={300}
                className="w-full h-auto object-cover"
              />
            ) : (
              <div className="w-full h-auto bg-gray-200" />
            )}
          </div>
        )
      )}

      <div className="border-b-2">
        <div className="container mx-auto lg:pb-10 pb-6 px-4 sm:px-6 lg:px-16">
          <div className="relative mt-[-10px] md:mt-[-20px] lg:mt-[-30px]">
            <div className="md:flex md:items-end md:justify-between md:gap-4 space-y-2">
              <div>
                {/* Conditionally render PhotoUpload based on editing state */}
                {isEditing ? (
                  <div className="mt-[20px]">
                    <PhotoUpload
                      onFileSelect={handlePhotoSelect}
                      previewUrl={displayPhoto}
                      onUploadSuccess={() => setIsPhotoUploaded(true)}
                    />
                  </div>
                ) : recruiter?.photo ? (
                  // Show static avatar when not editing and photo exists
                  <Image
                    src={recruiter.photo || FALLBACK_IMAGE}
                    alt={`${recruiter.firstName || ""}`}
                    height={500}
                    width={500}
                    className="w-[120px] h-[120px] md:h-[170px] md:w-[170px] object-cover object-top"
                  />
                ) : (
                  // Fallback gradient avatar
                  <div className="w-[120px] h-[120px] md:h-[170px] md:w-[170px] bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {/* {recruiter.full?.[0] || "U"} */}
                  </div>
                )}
              </div>

              <div className="mb-4">
                {!isEditing ? (
                  <Button
                    onClick={() => {
                      form.reset({
                        ...recruiter,
                        sLink: recruiter.sLink || [],
                      });
                      setIsEditing(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-[#2B7FD0] hover:bg-[#2B7FD0] text-white hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="flex items-center gap-2 bg-[#2B7FD0] hover:bg-[#2B7FD0] text-white hover:text-white"
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-transparent bg-[#2B7FD0] hover:bg-[#2B7FD0] text-white hover:text-white"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-8">
            <div className="space-y-4">
              {isEditing ? (
                <Form {...form}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <Label htmlFor="firstName">First Name</Label>
                            <FormControl>
                              <Input id="firstName" {...field} />
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
                            <Label htmlFor="sureName">Last Name</Label>
                            <FormControl>
                              <Input id="sureName" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="title">Title</Label>
                          <FormControl>
                            <Input id="title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Select your company
                      </h3>
                      <CompanySelector
                        selectedCompany={selectedCompany}
                        onCompanyChange={(companyId) => {
                          setSelectedCompany(companyId);
                          form.setValue("companyId", {
                            _id: companyId,
                          } as Company);
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Popover
                          open={countryOpen}
                          onOpenChange={setCountryOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={countryOpen}
                              aria-label="Select country"
                              className={cn(
                                "w-full justify-between font-normal",
                                !form.getValues().country &&
                                  "text-muted-foreground"
                              )}
                            >
                              {form.getValues().country || "Select a country"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search country..." />
                              <CommandList>
                                <CommandEmpty>
                                  {isLoadingCountries ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <svg
                                        className="animate-spin h-5 w-5"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                          fill="none"
                                        />
                                      </svg>
                                      Loading countries...
                                    </div>
                                  ) : (
                                    "No country found."
                                  )}
                                </CommandEmpty>
                                <CommandGroup>
                                  {countriesData?.map((country) => (
                                    <CommandItem
                                      key={country.country}
                                      value={country.country}
                                      onSelect={(value) => {
                                        form.setValue("country", value);
                                        form.setValue("city", "");
                                        setSelectedCountry(value);
                                        setCountryOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          form.getValues().country ===
                                            country.country
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {country.country}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Popover open={cityOpen} onOpenChange={setCityOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={cityOpen}
                              aria-label="Select city"
                              disabled={!selectedCountry}
                              className={cn(
                                "w-full justify-between font-normal",
                                !form.getValues().city &&
                                  "text-muted-foreground"
                              )}
                            >
                              {form.getValues().city || "Select a city"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search city..." />
                              <CommandList>
                                <CommandEmpty>
                                  {isLoadingCities ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <svg
                                        className="animate-spin h-5 w-5"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                          fill="none"
                                        />
                                      </svg>
                                      Loading cities...
                                    </div>
                                  ) : (
                                    "No city found."
                                  )}
                                </CommandEmpty>
                                <CommandGroup>
                                  {citiesData?.map((city) => (
                                    <CommandItem
                                      key={city}
                                      value={city}
                                      onSelect={(value) => {
                                        form.setValue("city", value);
                                        setCityOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          form.getValues().city === city
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {city}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="bio" className="text-sm font-medium">
                            Bio
                          </Label>
                          <FormControl>
                            <TextEditor
                              value={field.value || ""}
                              onChange={(value) => field.onChange(value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">
                          Social Links
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="sLink"
                          render={() => (
                            <FormItem>
                              <FormControl>
                                <SocialLinksSection form={form} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </Form>
              ) : (
                <div className="space-y-1">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {fullName}
                    </h1>
                    {taglineParts.length > 0 && (
                      <p className="text-sm sm:text-base">
                        {taglineParts.map((part, idx) => (
                          <span key={idx}>
                            {part}
                            {idx < taglineParts.length - 1 && (
                              <span className="px-2">{"|"}</span>
                            )}
                          </span>
                        ))}
                      </p>
                    )}
                    {(country || city) && (
                      <p className="text-base text-muted-foreground">
                        {primaryLocation}
                      </p>
                    )}
                  </div>

                  <div
                    className="text-gray-600 text-sm line-clamp-2 prose prose-sm max-w-none text-start"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        companyId?.aboutUs ||
                          bio ||
                          "We connect top talent with great companies. Our mission is to make hiring simple, fast, and effective for everyone."
                      ),
                    }}
                  />

                  {followersText && (
                    <p className="text-sm text-muted-foreground">
                      {followersText}
                    </p>
                  )}

                  <div className="flex space-x-2 mt-2">
                    <SocialLinks sLink={sLink || []} />
                  </div>

                  <div className="pt-2">
                    <p className="text-[14px] md:text-[20px] mb-4">
                      {"Try It Free — Post Your First Job at No Cost!"}
                    </p>
                    <Link
                      href="/add-job"
                      className="text-blue-600 hover:underline capitalize"
                    >
                      <Button
                        size="lg"
                        className="w-full sm:w-auto bg-[#2B7FD0] hover:bg-[#2B7FD0]"
                      >
                        Post A Job
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-8 md:pl-4">
              <div className="space-y-3">
                {companyId?.name && (
                  <div className="flex items-center gap-6">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted">
                      <Avatar>
                        <AvatarImage
                          src={companyId?.avatar?.url || FALLBACK_IMAGE}
                          alt={companyId?.name || ""}
                          className="rounded-none object-cover"
                        />
                        <AvatarFallback className="rounded-none">
                          {companyId?.name
                            ?.split(" ")
                            .map((word: string) => word[0]?.toUpperCase())
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {companyId.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
