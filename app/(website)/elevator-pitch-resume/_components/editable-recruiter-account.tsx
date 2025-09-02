"use client";

import type React from "react";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExternalLink,
  Globe,
  Linkedin,
  MapPin,
  BriefcaseBusiness,
  Twitter,
  Edit,
  Save,
  X,
  Camera,
} from "lucide-react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { editRecruiterAccount } from "@/lib/api-service";
import { toast } from "sonner";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import { CompanySelector } from "@/components/company/company-selector";

type MaybeStringifiedArray = string[] | string | undefined;

type Company = {
  _id: string;
  userId: string;
  aboutUs?: string;
  avatar?: {
    url: string;
  };
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

type SLinkItem = {
  label: string;
  url: string;
};

export type Recruiter = {
  _id: string;
  userId: string;
  bio?: string;
  photo?: string;
  title?: string;
  aboutUs?: string;
  firstName?: string;
  lastName?: string;
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

function parseMaybeStringifiedArray(input: MaybeStringifiedArray): string[] {
  if (Array.isArray(input)) {
    if (
      input.length === 1 &&
      typeof input[0] === "string" &&
      input[0].trim().startsWith("[")
    ) {
      try {
        return JSON.parse(input[0]) as string[];
      } catch {
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

function getInitials(first?: string, last?: string) {
  const f = first?.[0] ?? "";
  const l = last?.[0] ?? "";
  const initials = `${f}${l}`.toUpperCase();
  return initials || "RC";
}

function formatFollowerCount(n?: number) {
  if (!n && n !== 0) return null;
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
}

type Social = {
  label: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

function SocialIconLink({ href, label, icon: Icon }: Social) {
  if (!href) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#9EC7DC] bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition"
          )}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function EditableRecruiterAccount({
  recruiter,
  onSave,
}: {
  recruiter: Recruiter;
  onSave?: (updatedRecruiter: Recruiter) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecruiter, setEditedRecruiter] = useState<Recruiter>({
    ...recruiter,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  // Initialize selectedCompany with recruiter.companyId._id
  const [selectedCompany, setSelectedCompany] = useState<string>(
    recruiter.companyId?._id || ""
  );

  const followersText = useMemo(() => {
    const formatted = formatFollowerCount(recruiter?.followerCount);
    return formatted ? `${formatted} followers` : null;
  }, [recruiter?.followerCount]);

  const companyLinks = parseMaybeStringifiedArray(recruiter?.companyId?.links);
  const services = parseMaybeStringifiedArray(recruiter?.companyId?.service);

  const websiteHref =
    companyLinks[0] ||
    recruiter?.OtherLink ||
    recruiter?.upworkUrl ||
    undefined;

  const taglineParts = [recruiter?.title, recruiter?.roleAtCompany].filter(
    Boolean
  );

  const socials: Social[] = useMemo(() => {
    const sLinks = recruiter?.sLink || [];
    const socialMap: {
      [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    } = {
      linkedin: Linkedin,
      twitter: Twitter,
      x: Twitter,
      upwork: BriefcaseBusiness,
      website: ExternalLink,
      other: ExternalLink,
    };

    return sLinks.map((link) => ({
      label: link.label,
      href: link.url,
      icon: socialMap[link.label.toLowerCase()] || ExternalLink,
    }));
  }, [recruiter?.sLink]);

  const updateSLink = (
    index: number,
    field: "label" | "url",
    value: string
  ) => {
    const newSLink = [...(editedRecruiter.sLink || [])];
    if (newSLink[index]) {
      newSLink[index] = { ...newSLink[index], [field]: value };
    }
    setEditedRecruiter({ ...editedRecruiter, sLink: newSLink });
  };

  const addSLink = () => {
    const newSLink = [...(editedRecruiter.sLink || []), { label: "", url: "" }];
    setEditedRecruiter({ ...editedRecruiter, sLink: newSLink });
  };

  const removeSLink = (index: number) => {
    const newSLink = (editedRecruiter.sLink || []).filter(
      (_, i) => i !== index
    );
    setEditedRecruiter({ ...editedRecruiter, sLink: newSLink });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeInBytes) {
      toast.error("Photo file size exceeds 10 MB. Select a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
      setPhotoFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeInBytes) {
      toast.error("Banner file size exceeds 10 MB. Select a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBannerPreview(result);
      setBannerFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editedRecruiter.userId) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.entries(editedRecruiter).forEach(([key, value]) => {
        if (key === "sLink") {
          (value as SLinkItem[]).forEach((link, index) => {
            formData.append(`sLink[${index}][label]`, link.label);
            formData.append(`sLink[${index}][url]`, link.url);
          });
        } else if (key === "photo" && photoFile) {
          formData.append("photo", photoFile);
        } else if (key === "banner" && bannerFile) {
          formData.append("banner", bannerFile);
        } else if (key === "companyId") {
          // Send only the company ID as a string
          formData.append("companyId", selectedCompany);
        } else if (typeof value === "string" && value !== "") {
          formData.append(key, value);
        }
      });

      const updatedRecruiter = await editRecruiterAccount(
        editedRecruiter.userId,
        formData
      );
      onSave?.(updatedRecruiter);
      setIsEditing(false);
      setPhotoPreview(null);
      setBannerPreview(null);
      setPhotoFile(null);
      setBannerFile(null);
      setEditedRecruiter({
        ...updatedRecruiter,
        photo: updatedRecruiter.photo,
        banner: updatedRecruiter.banner,
        companyId: updatedRecruiter.companyId, // Ensure companyId is updated
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to save recruiter account:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedRecruiter(recruiter);
    setSelectedCompany(recruiter.companyId?._id || ""); // Reset to original company
    setIsEditing(false);
    setPhotoPreview(null);
    setBannerPreview(null);
    setPhotoFile(null);
    setBannerFile(null);
  };

  const {
    firstName,
    lastName,
    title,
    aboutUs,
    photo,
    bio,
    country,
    city,
    location,
    linkedIn,
    xLink,
    upworkUrl,
    OtherLink,
    roleAtCompany,
    followerCount,
    companyId,
    banner,
  } = isEditing ? editedRecruiter : recruiter;

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || "Recruiter";
  const primaryLocation =
    location || [city, country].filter(Boolean).join(", ");
  const displayPhoto = photoPreview || photo || "/placeholder.svg";
  const displayBanner = bannerPreview || banner || "/placeholder-banner.svg";

  return (
    <div className="w-full bg-background">
      {/* Cover */}
      <div className="w-full">
        <div className="relative h-36 sm:h-44 md:h-56 lg:h-80 bg-muted">
          <Image
            src={displayBanner}
            alt="Cover image"
            fill
            className="object-cover opacity-80"
            priority
            sizes="100vw"
          />
          {isEditing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <Label htmlFor="banner-upload" className="cursor-pointer">
                <Camera className="h-6 w-6 text-white" />
                <Input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="border-b-2">
        <div className="mx-auto max-w-7xl lg:pb-10 pb-6">
          {/* Avatar row */}
          <div className="relative -mt-10 sm:-mt-14 md:-mt-16">
            <div className="flex items-end justify-between gap-4">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-40 md:w-40 rounded-lg ring-2 ring-background shadow-md overflow-hidden bg-muted">
                <Avatar className="h-full w-full rounded-lg">
                  <AvatarImage src={displayPhoto} alt={`${fullName} photo`} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(firstName, lastName)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </Label>
                  </div>
                )}
              </div>
              <div className="mb-4">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
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

          {/* Main grid */}
          <div className="mt-6 grid gap-8 md:grid-cols-[1fr_300px]">
            {/* Left: profile summary */}
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="banner-upload-form">Banner Image</Label>
                    <div className="mt-2">
                      <Label
                        htmlFor="banner-upload-form"
                        className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        {bannerPreview ? "Change banner" : "Upload banner"}
                      </Label>
                      <Input
                        id="banner-upload-form"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="photo-upload-form">Profile Photo</Label>
                    <div className="mt-2">
                      <Label
                        htmlFor="photo-upload-form"
                        className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        {photoPreview ? "Change photo" : "Upload photo"}
                      </Label>
                      <Input
                        id="photo-upload-form"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editedRecruiter.firstName || ""}
                        onChange={(e) =>
                          setEditedRecruiter({
                            ...editedRecruiter,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editedRecruiter.lastName || ""}
                        onChange={(e) =>
                          setEditedRecruiter({
                            ...editedRecruiter,
                            lastName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editedRecruiter.title || ""}
                      onChange={(e) =>
                        setEditedRecruiter({
                          ...editedRecruiter,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Select your company
                    </h3>
                    <CompanySelector
                      selectedCompany={selectedCompany}
                      onCompanyChange={(companyId) => {
                        setSelectedCompany(companyId);
                        setEditedRecruiter({
                          ...editedRecruiter,
                          companyId: { _id: companyId } as Company,
                        });
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editedRecruiter.city || ""}
                        onChange={(e) =>
                          setEditedRecruiter({
                            ...editedRecruiter,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={editedRecruiter.country || ""}
                        onChange={(e) =>
                          setEditedRecruiter({
                            ...editedRecruiter,
                            country: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </Label>
                    <TextEditor
                      value={editedRecruiter.bio || ""}
                      onChange={(value) =>
                        setEditedRecruiter({ ...editedRecruiter, bio: value })
                      }
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Social Links</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSLink}
                        className="text-xs bg-transparent"
                      >
                        Add Link
                      </Button>
                    </div>
                    {(editedRecruiter.sLink || []).map((link, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-3 gap-2 items-end"
                      >
                        <div>
                          <Label htmlFor={`slink-label-${index}`}>
                            Platform
                          </Label>
                          <Input
                            id={`slink-label-${index}`}
                            placeholder="e.g., LinkedIn"
                            value={link.label}
                            onChange={(e) =>
                              updateSLink(index, "label", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`slink-url-${index}`}>URL</Label>
                          <Input
                            id={`slink-url-${index}`}
                            placeholder="https://..."
                            value={link.url}
                            onChange={(e) =>
                              updateSLink(index, "url", e.target.value)
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSLink(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(!editedRecruiter.sLink ||
                      editedRecruiter.sLink.length === 0) && (
                      <p className="text-sm text-muted-foreground">
                        No social links added yet.
                      </p>
                    )}
                  </div>
                </div>
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
                        {country || city}
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

                  <TooltipProvider delayDuration={100}>
                    <div className="flex flex-wrap items-center gap-2 ">
                      {socials.map((s, index) => (
                        <SocialIconLink
                          key={`${s.label}-${index}`}
                          href={s.href}
                          label={s.label}
                          icon={s.icon}
                        />
                      ))}
                    </div>
                  </TooltipProvider>

                  <div className=" pt-2">
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

            {/* Right: meta sidebar */}
            <aside className="space-y-8 md:pl-4">
              <div className="space-y-3">
                {companyId?.name && (
                  <div className="flex items-center gap-6">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted">
                      <Avatar>
                        <AvatarImage
                          src={companyId?.avatar?.url || "/placeholder.svg"}
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
              <div className="space-y-5">
                {websiteHref && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-6 w-6 text-muted-foreground" />
                    <Link
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline underline-offset-4"
                    >
                      {"Website"}
                    </Link>
                  </div>
                )}
                {primaryLocation && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm">
                      {"Location: "}
                      {primaryLocation}
                    </p>
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