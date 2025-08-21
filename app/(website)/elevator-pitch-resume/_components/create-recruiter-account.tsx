"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api-service";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";

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

interface FormData {
  firstName: string;
  lastName: string;
  sureName: string;
  emailAddress: string;
  phoneNumber: string;
  title: string;
  bio: string;
  experience: string;
  country: string;
  city: string;
  zipCode: string;
  skills: Skill[];
  languages: string[];
  companyRecruiters: string[];
  educations: Education[];
  sLink: SocialLink[];
  photo?: File;
  videoFile?: File;
  userId?: string;
}

interface Country {
  country: string;
  cities: string[];
}

export default function CreateRecruiterAccountForm() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;
  const token = session?.accessToken;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>({
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
    educations: [],
    sLink: [
      { label: "Upwork", link: "https://www.upwork.com/" },
      { label: "LinkedIn", link: "https://www.linkedin.com/" },
      { label: "X", link: "https://x.com/" },
    ],
    userId: userId || "",
  });

  useEffect(() => {
    if (userId) {
      setFormData((prev) => ({ ...prev, userId }));
    }
  }, [userId]);

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries"
        );
        const data = await response.json();
        if (!data.error) {
          setCountries(data.data);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.country) return;
      setIsLoadingCities(true);
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/cities",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ country: formData.country }),
          }
        );
        const data = await response.json();
        if (!data.error) {
          setCities(data.data);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, [formData.country]);

  const createRecruiterAccount = async (formData: FormData) => {
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (
        key === "skills" ||
        key === "educations" ||
        key === "languages" ||
        key === "companyRecruiters"
      ) {
        data.append(key, JSON.stringify(value));
      } else if (key === "sLink") {
        // Append each SocialLink object individually
        (value as SocialLink[]).forEach((link, index) => {
          data.append(`sLink[${index}][label]`, link.label);
          data.append(`sLink[${index}][link]`, link.link);
        });
      } else if (key === "photo" || key === "videoFile") {
        if (value instanceof File) {
          data.append(key, value);
        }
      } else if (value !== undefined && value !== null) {
        data.append(key, String(value));
      }
    });

    try {
      const response = await apiClient.post(
        "/recruiter/recruiter-account",
        data,
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
      console.log("Account created:", data);
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
      console.error("Error details:", error);
    },
  });

  const handleInputChange = (
    field: keyof FormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (
    field: "photo" | "videoFile",
    file: File | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: file || undefined }));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange("videoFile", file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange("photo", file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleEducationChange = (
    index: number,
    field: keyof Education,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      educations: prev.educations.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      educations: [
        ...(prev.educations || []),
        {
          school: "",
          degree: "",
          year: "",
        },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index),
    }));
  };

  const handleSocialLinkChange = (
    index: number,
    field: keyof SocialLink,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      sLink: prev.sLink.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const addSocialLink = () => {
    setFormData((prev) => ({
      ...prev,
      sLink: [...prev.sLink, { label: "", link: "" }],
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sLink: prev.sLink.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = { ...formData, userId: userId || formData.userId };
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

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-medium">
                Upload Your Elevator Pitch (Optional)
              </CardTitle>
            </div>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => document.getElementById("video-upload")?.click()}
            >
              Upload/Change Elevator Pitch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-16 text-center bg-gray-900 text-white">
            {videoPreview ? (
              <div className="space-y-4">
                <video
                  src={videoPreview}
                  controls
                  className="mx-auto max-w-md rounded-lg"
                />
                <p className="text-sm text-green-400">
                  Video uploaded: {formData.videoFile?.name}
                </p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                <p className="text-lg mb-2">Drop files here</p>
                <p className="text-sm mb-4 text-gray-400">or</p>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  onClick={() =>
                    document.getElementById("video-upload")?.click()
                  }
                >
                  Choose File
                </Button>
              </>
            )}
            <Input
              id="video-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
            />
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                      <div className="flex items-center gap-4">
                        <img
                          src={photoPreview || "/placeholder.svg"}
                          alt="Profile preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                          <p className="text-sm text-green-600 font-medium">
                            Photo uploaded: {formData.photo?.name}
                          </p>
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
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <TextEditor
                  value={formData.bio}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, bio: value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sureName" className="text-sm font-medium">
                  Surname
                </Label>
                <Input
                  id="sureName"
                  value={formData.sureName}
                  onChange={(e) =>
                    handleInputChange("sureName", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emailAddress" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) =>
                    handleInputChange("emailAddress", e.target.value)
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Current Position
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="experience" className="text-sm font-medium">
                  Years of Experience
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("experience", value)
                  }
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="country" className="text-sm font-medium">
                  Country
                </Label>
                <Select
                  onValueChange={(value) => handleInputChange("country", value)}
                  disabled={isLoadingCountries}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={
                        isLoadingCountries ? "Loading..." : "Select Country"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.country} value={country.country}>
                        {country.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city" className="text-sm font-medium">
                  City
                </Label>
                <Select
                  onValueChange={(value) => handleInputChange("city", value)}
                  disabled={isLoadingCities || !formData.country}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={
                        isLoadingCities ? "Loading..." : "Select City"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zipCode" className="text-sm font-medium">
                  Zip Code
                </Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Social Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.sLink.map((link, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor={`social-label-${index}`}
                          className="text-sm font-medium"
                        >
                          Platform
                        </Label>
                        <Input
                          id={`social-label-${index}`}
                          value={link.label}
                          onChange={(e) =>
                            handleSocialLinkChange(
                              index,
                              "label",
                              e.target.value
                            )
                          }
                          placeholder="e.g. GitHub, Portfolio"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor={`social-link-${index}`}
                          className="text-sm font-medium"
                        >
                          URL
                        </Label>
                        <Input
                          id={`social-link-${index}`}
                          value={link.link}
                          onChange={(e) =>
                            handleSocialLinkChange(
                              index,
                              "link",
                              e.target.value
                            )
                          }
                          placeholder="https://example.com/..."
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => removeSocialLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={addSocialLink}
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
            {(formData.educations || []).map((edu, index) => (
              <div key={index} className="space-y-4 border-b pb-4">
                <div>
                  <Label className="text-sm font-medium">
                    Institution Name
                  </Label>
                  <Input
                    value={edu.school}
                    onChange={(e) =>
                      handleEducationChange(index, "school", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Degree</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) =>
                      handleEducationChange(index, "degree", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Year</Label>
                  <Input
                    type="date"
                    value={edu.year}
                    onChange={(e) =>
                      handleEducationChange(index, "year", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                {(formData.educations || []).length > 1 && (
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
              onClick={addEducation}
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
            <Input
              placeholder="Enter languages separated by commas (e.g., English, Spanish, French)"
              value={formData.languages.join(", ")}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  languages: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              className="mt-1"
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
            <Input
              placeholder="Enter profile links separated by commas "
              value={formData.companyRecruiters.join(", ")}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  companyRecruiters: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              className="mt-1"
            />
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating Account..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
