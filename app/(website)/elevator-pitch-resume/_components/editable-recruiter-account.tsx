
"use client";

import type React from "react";
import { useMemo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { ExternalLink, Globe, MapPin, Edit, Save, X, Camera, Upload } from "lucide-react";
import DOMPurify from "dompurify";
import { editRecruiterAccount } from "@/lib/api-service";
import { toast } from "sonner";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import { CompanySelector } from "@/components/company/company-selector";
import SocialLinks from "./SocialLinks"; // Revert to using SocialLinks in view mode
import { SocialLinksSection } from "./social-links-section";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type MaybeStringifiedArray = string[] | string | undefined;

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

interface BannerUploadProps {
  onFileSelect: (file: File | null) => void;
  previewUrl?: string | null;
  onUploadSuccess: () => void;
  isEditing: boolean;
}

function BannerUpload({ onFileSelect, previewUrl, onUploadSuccess, isEditing }: BannerUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeBanner = () => {
    onFileSelect(null);
    setSelectedImage(null);
    setCropModalOpen(false);
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<File> => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const outputHeight = 300;
    const scale = outputHeight / pixelCrop.height;
    const outputWidth = pixelCrop.width * scale;

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], "cropped-banner.jpg", { type: "image/jpeg" }));
        }
      }, "image/jpeg");
    });
  };

  const handleCropConfirm = async () => {
    if (selectedImage && croppedAreaPixels) {
      setIsProcessing(true);
      try {
        const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
        onFileSelect(croppedImage);
        setCropModalOpen(false);
        setSelectedImage(null);
        onUploadSuccess();
      } catch (error) {
        toast.error("Failed to process image");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <>
      <div
        className={`relative h-36 sm:h-44 md:h-56 lg:h-[300px] bg-muted ${
          isEditing ? "cursor-pointer" : ""
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Image
          src={previewUrl || "/placeholder-banner.svg"}
          alt="Cover image"
          width={1600}
          height={900}
          className="object-cover opacity-80 w-full h-full"
          priority
        />
        {isEditing && (
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => document.getElementById("banner-upload")?.click()}
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}
        <input
          id="banner-upload"
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={!isEditing}
        />
      </div>
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Crop Banner Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-[400px] bg-black">
            {selectedImage && (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={5 / 1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={false}
                minZoom={0.5}
                maxZoom={3}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCropModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm} disabled={isProcessing}>
              Confirm Crop
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface PhotoUploadProps {
  onFileSelect: (file: File | null) => void;
  previewUrl?: string | null;
  onUploadSuccess: () => void;
  isEditing: boolean;
}

function PhotoUpload({ onFileSelect, previewUrl, onUploadSuccess, isEditing }: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removePhoto = () => {
    onFileSelect(null);
    setSelectedImage(null);
    setCropModalOpen(false);
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<File> => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const outputSize = 150;
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], "cropped-photo.jpg", { type: "image/jpeg" }));
        }
      }, "image/jpeg");
    });
  };

  const handleCropConfirm = async () => {
    if (selectedImage && croppedAreaPixels) {
      setIsProcessing(true);
      try {
        const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
        onFileSelect(croppedImage);
        setCropModalOpen(false);
        setSelectedImage(null);
        onUploadSuccess();
      } catch (error) {
        toast.error("Failed to process image");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <>
      <div
        className={`relative h-20 w-20 sm:h-24 sm:w-24 md:h-40 md:w-40 rounded-lg ring-2 ring-background shadow-md overflow-hidden bg-muted ${
          isEditing ? "cursor-pointer" : ""
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Avatar className="h-full w-full rounded-lg">
          <AvatarImage src={previewUrl || "/placeholder.svg"} alt="Profile photo" />
          <AvatarFallback className="rounded-lg">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        {isEditing && (
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => document.getElementById("photo-upload")?.click()}
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={!isEditing}
        />
      </div>
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crop Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-[300px] bg-black">
            {selectedImage && (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={false}
                minZoom={0.5}
                maxZoom={3}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCropModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm} disabled={isProcessing}>
              Confirm Crop
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function parseMaybeStringifiedArray(input: MaybeStringifiedArray): string[] {
  if (Array.isArray(input)) {
    if (input.length === 1 && typeof input[0] === "string" && input[0].trim().startsWith("[")) {
      try { return JSON.parse(input[0]) as string[]; } catch { return input as string[]; }
    }
    return input as string[];
  }
  if (typeof input === "string") {
    try { return JSON.parse(input) as string[]; } catch { return [input]; }
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
  if (!Number.isFinite(n as number)) return null;
  const num = Number(n);
  if (num < 1000) return `${num}`;
  if (num < 1_000_000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`;
}

export default function EditableRecruiterAccount({
  recruiter,
  onSave,
}: {
  recruiter: Recruiter;
  onSave?: (updatedRecruiter: Recruiter) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecruiter, setEditedRecruiter] = useState<Recruiter>({ ...recruiter });
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

  const form = useForm<{ sLink: SLinkItem[] }>({
    defaultValues: { sLink: recruiter.sLink || [] },
    mode: "onChange",
  });

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
  } = isEditing ? editedRecruiter : recruiter;

  const fullName = [firstName, sureName].filter(Boolean).join(" ") || "Recruiter";
  const primaryLocation = location || [city, country].filter(Boolean).join(", ");
  const displayPhoto = photoPreview || recruiter.photo || "/placeholder.svg";
  const displayBanner = bannerPreview || recruiter.banner || "/placeholder-banner.svg";

  const followersText = useMemo(() => {
    const formatted = formatFollowerCount(followerCount);
    return formatted ? `${formatted} followers` : null;
  }, [followerCount]);

  const companyLinks = parseMaybeStringifiedArray(companyId?.links);
  const websiteHref =
    companyLinks[0] ||
    editedRecruiter?.OtherLink ||
    editedRecruiter?.upworkUrl ||
    recruiter?.OtherLink ||
    recruiter?.upworkUrl ||
    undefined;

  const taglineParts = [title, roleAtCompany].filter(Boolean);

  const handleSave = async () => {
    if (!editedRecruiter.userId) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      const { sLink: formLinks } = form.getValues();
      const cleanedLinks = (formLinks || []).filter(
        (l) => (l.label?.trim() || "") && (l.url?.trim() || "")
      );

      cleanedLinks.forEach((link, index) => {
        formData.append(`sLink[${index}][label]`, link.label);
        formData.append(`sLink[${index}][url]`, link.url || "");
      });

      Object.entries(editedRecruiter).forEach(([key, value]) => {
        if (key === "sLink") return;
        if (key === "photo") {
          if (photoFile) formData.append("photo", photoFile);
          return;
        }
        if (key === "banner") {
          if (bannerFile) formData.append("banner", bannerFile);
          return;
        }
        if (key === "companyId") {
          if (selectedCompany) formData.append("companyId", selectedCompany);
          return;
        }
        if (typeof value === "string" && value.trim() !== "") {
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
      setIsBannerUploaded(false);
      setIsPhotoUploaded(false);
      setEditedRecruiter({
        ...updatedRecruiter,
        photo: updatedRecruiter.photo,
        banner: updatedRecruiter.banner,
        companyId: updatedRecruiter.companyId,
      });
      form.reset({ sLink: updatedRecruiter.sLink || [] });

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
    setSelectedCompany(recruiter.companyId?._id || "");
    setIsEditing(false);
    setPhotoPreview(null);
    setBannerPreview(null);
    setPhotoFile(null);
    setBannerFile(null);
    setIsBannerUploaded(false);
    setIsPhotoUploaded(false);
    form.reset({ sLink: recruiter.sLink || [] });
  };

  return (
    <div className="w-full bg-background">
      <BannerUpload
        onFileSelect={(file) => {
          setBannerFile(file);
          if (file) {
            const url = URL.createObjectURL(file);
            setBannerPreview(url);
          } else {
            setBannerPreview(null);
          }
        }}
        previewUrl={displayBanner}
        onUploadSuccess={() => setIsBannerUploaded(true)}
        isEditing={isEditing}
      />

      <div className="border-b-2">
        <div className="mx-auto max-w-7xl lg:pb-10 pb-6">
          <div className="relative -mt-10 sm:-mt-14 md:-mt-16">
            <div className="flex items-end justify-between gap-4">
              <PhotoUpload
                onFileSelect={(file) => {
                  setPhotoFile(file);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setPhotoPreview(url);
                  } else {
                    setPhotoPreview(null);
                  }
                }}
                previewUrl={displayPhoto}
                onUploadSuccess={() => setIsPhotoUploaded(true)}
                isEditing={isEditing}
              />

              <div className="mb-4">
                {!isEditing ? (
                  <Button
                    onClick={() => {
                      form.reset({ sLink: editedRecruiter.sLink || recruiter.sLink || [] });
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

          <div className="mt-6 grid gap-8 md:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              {isEditing ? (
                <Form {...form}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={editedRecruiter.firstName || ""}
                          onChange={(e) =>
                            setEditedRecruiter((r) => ({ ...r, firstName: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="sureName">Last Name</Label>
                        <Input
                          id="sureName"
                          value={editedRecruiter.sureName || ""}
                          onChange={(e) =>
                            setEditedRecruiter((r) => ({ ...r, sureName: e.target.value }))
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
                          setEditedRecruiter((r) => ({ ...r, title: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Select your company</h3>
                      <CompanySelector
                        selectedCompany={selectedCompany}
                        onCompanyChange={(companyId) => {
                          setSelectedCompany(companyId);
                          setEditedRecruiter((r) => ({
                            ...r,
                            companyId: { _id: companyId } as Company,
                          }));
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
                            setEditedRecruiter((r) => ({ ...r, city: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={editedRecruiter.country || ""}
                          onChange={(e) =>
                            setEditedRecruiter((r) => ({ ...r, country: e.target.value }))
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
                          setEditedRecruiter((r) => ({ ...r, bio: value }))
                        }
                      />
                    </div>

                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">Social Links</CardTitle>
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
                      <p className="text-base text-muted-foreground">{country || city}</p>
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
                    <p className="text-sm text-muted-foreground">{followersText}</p>
                  )}

                  <div className="flex space-x-2 mt-2">
                    <SocialLinks sLink={sLink || []} /> {/* Revert to SocialLinks in view mode */}
                  </div>

                  <div className="pt-2">
                    <p className="text-[14px] md:text-[20px] mb-4">
                      {"Try It Free — Post Your First Job at No Cost!"}
                    </p>
                    <Link href="/add-job" className="text-blue-600 hover:underline capitalize">
                      <Button size="lg" className="w-full sm:w-auto bg-[#2B7FD0] hover:bg-[#2B7FD0]">
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
                      <p className="truncate text-sm font-medium">{companyId.name}</p>
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
                      Website
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
