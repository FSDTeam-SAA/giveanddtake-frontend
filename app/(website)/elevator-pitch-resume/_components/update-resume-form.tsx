"use client";

import type React from "react";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, Search } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import Image from "next/image";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SocialLinksSection } from "./social-links-section";
import { LanguageSelector } from "./resume/language-selector";
import { CertificationSelector } from "./resume/certification-selector";
import { UniversitySelector } from "./resume/university-selector";

const CustomDateInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/\D/g, ""); // Remove non-digits

    if (inputValue.length >= 2) {
      inputValue = inputValue.slice(0, 2) + "/" + inputValue.slice(2, 6);
    }

    if (inputValue.length > 7) {
      inputValue = inputValue.slice(0, 7);
    }

    onChange(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const cursorPosition = (e.target as HTMLInputElement).selectionStart || 0;
      if (cursorPosition === 3 && value.charAt(2) === "/") {
        e.preventDefault();
        onChange(value.slice(0, 2));
      }
    }
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      maxLength={7}
    />
  );
};

const SkillsSelector = ({
  selectedSkills,
  onSkillsChange,
}: {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
}) => {
  const [skillSearch, setSkillSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: skillsData, isLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/skill`);
      const data = await response.json();
      if (!data.success) throw new Error("Failed to fetch skills");
      return data.data.map((skill: any) => skill.name);
    },
  });

  const filteredSkills =
    skillsData?.filter(
      (skill: string) =>
        skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !selectedSkills.includes(skill)
    ) || [];

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      onSkillsChange([...selectedSkills, skill]);
      setSkillSearch("");
      setShowDropdown(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(selectedSkills.filter((skill) => skill !== skillToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search and add skills..."
            value={skillSearch}
            onChange={(e) => {
              setSkillSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="pl-10"
          />
        </div>

        {showDropdown && skillSearch && filteredSkills.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredSkills.slice(0, 10).map((skill: string) => (
              <button
                key={skill}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => addSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export const resumeFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),

  title: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  aboutUs: z.string().optional(),
  banner: z.string().optional(),

  skills: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),

  sLink: z
    .array(
      z.object({
        _id: z.string().optional(),
        type: z.enum(["create", "update", "delete"]).optional(),
        label: z.string().min(1, "Platform name is required"),
        url: z
          .string()
          .optional()
          .transform((v) => v ?? "")
          .pipe(z.string().url("Please enter a valid URL").or(z.literal(""))),
      })
    )
    .optional()
    .default([]),

  experiences: z
    .array(
      z
        .object({
          _id: z.string().optional(),
          type: z.enum(["create", "update", "delete"]).optional(),
          company: z.string().optional(),
          jobTitle: z.string().optional(), // Kept jobTitle for schema consistency
          position: z.string().optional(), // Added position for API compatibility
          duration: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          currentlyWorking: z.boolean().optional().default(false),
          country: z.string().optional(),
          city: z.string().optional(),
          zip: z.string().optional(),
          jobDescription: z.string().optional(),
          jobCategory: z.string().optional(),
        })
        .refine(
          (data) =>
            // only require endDate if we have both company & jobTitle,
            // not currently working, and endDate is missing
            !data.company ||
            !data.jobTitle ||
            data.currentlyWorking === true ||
            (!!data.endDate && data.currentlyWorking === false),
          {
            message: "End date is required unless currently working",
            path: ["endDate"],
          }
        )
    )
    .optional()
    .default([]),

  educationList: z
    .array(
      z
        .object({
          _id: z.string().optional(),
          type: z.enum(["create", "update", "delete"]).optional(),
          instituteName: z.string().min(1, "Institute name is required"),
          university: z.string().optional(),
          degree: z.string().min(1, "Degree is required"),
          fieldOfStudy: z.string().optional(),
          startDate: z.string().optional(),
          graduationDate: z.string().optional(),
          currentlyStudying: z.boolean().optional().default(false),
          city: z.string().optional(),
          country: z.string().optional(),
        })
        .refine(
          (data) =>
            data.currentlyStudying === true ||
            (!!data.graduationDate && data.currentlyStudying === false),
          {
            message: "Graduation date is required unless currently studying",
            path: ["graduationDate"],
          }
        )
    )
    .optional()
    .default([]),

  awardsAndHonors: z
    .array(
      z.object({
        _id: z.string().optional(),
        type: z.enum(["create", "update", "delete"]).optional(),
        title: z.string().optional(),
        programeName: z.string().optional(),
        year: z.string().optional(), // Kept year for schema consistency
        programeDate: z.string().optional(), // Added programeDate for API compatibility
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

type ResumeFormData = z.infer<typeof resumeFormSchema>;

interface Country {
  country: string;
  cities: string[];
}

interface UpdateResumeFormProps {
  resume: any;
  onCancel: () => void;
  onUpdate: (data: FormData) => Promise<void>;
  onDelete?: (id: string, type: string) => Promise<void>;
}

export default function UpdateResumeForm({
  resume,
  onCancel,
  onUpdate,
  onDelete,
}: UpdateResumeFormProps): React.ReactElement {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    resume.resume?.skills || []
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [copyUrlSuccess, setCopyUrlSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    resume.resume?.country || ""
  );
  const [selectedExpCountries, setSelectedExpCountries] = useState<string[]>(
    resume.experiences?.map((exp: any) => exp.country || "") || []
  );
  const [selectedEduCountries, setSelectedEduCountries] = useState<string[]>(
    resume.education?.map((edu: any) => edu.country || "") || []
  );

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    resume.resume?.languages || []
  );
  const [selectedCertifications, setSelectedCertifications] = useState<
    string[]
  >(resume.resume?.certifications || []);

  const [experienceCitiesData, setExperienceCitiesData] = useState<{
    [key: number]: string[];
  }>({});
  const [educationCitiesData, setEducationCitiesData] = useState<{
    [key: number]: string[];
  }>({});
  const [experienceCitiesLoading, setExperienceCitiesLoading] = useState<{
    [key: number]: boolean;
  }>({});
  const [educationCitiesLoading, setEducationCitiesLoading] = useState<{
    [key: number]: boolean;
  }>({});

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

  const formatDateForMongoDB = (dateString: string): string => {
    if (!dateString || dateString.trim() === "") return "";

    const [month, year] = dateString.split("/");
    if (!month || !year || month.length !== 2 || year.length !== 4) {
      return "";
    }

    const monthNum = Number.parseInt(month, 10);
    const yearNum = Number.parseInt(year, 10);

    if (monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return "";
    }

    return new Date(yearNum, monthNum - 1, 1).toISOString();
  };

  // ... existing code for form setup and handlers ...

  const form = useForm<ResumeFormData>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: {
      firstName: resume.resume?.firstName || "",
      lastName: resume.resume?.lastName || "",
      email: resume.resume?.email || "",
      phoneNumber: resume.resume?.phoneNumber || "",
      title: resume.resume?.title || "",
      banner: resume.resume?.banner || "",
      city: resume.resume?.city || "",
      zipCode: resume.resume?.zipCode || "",
      country: resume.resume?.country || "",
      aboutUs: resume.resume?.aboutUs || "",
      skills: Array.isArray(resume.resume?.skills) ? resume.resume.skills : [],
      sLink:
        Array.isArray(resume.resume?.sLink) && resume.resume.sLink.length > 0
          ? resume.resume.sLink.map(
              (link: { _id?: string; label: string; url: string }) => ({
                _id: link._id,
                type: link._id ? "update" : "create",
                label: link.label || "",
                url: link.url || "",
              })
            )
          : [],
      experiences: (() => {
        if (
          Array.isArray(resume.experiences) &&
          resume.experiences.length > 0
        ) {
          return resume.experiences.map((exp: any) => ({
            _id: exp._id || undefined,
            type: exp._id ? "update" : "create",
            company: exp.company || "",
            jobTitle: exp.position || exp.jobTitle || "", // Handle both position and jobTitle fields
            duration: exp.duration || "",
            startDate: exp.startDate
              ? new Date(exp.startDate)
                  .toLocaleDateString("en-US", {
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace("/", "/")
              : "",
            endDate: exp.endDate
              ? new Date(exp.endDate)
                  .toLocaleDateString("en-US", {
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace("/", "/")
              : "",
            currentlyWorking: exp.currentlyWorking || false,
            country: exp.country || "",
            city: exp.city || "",
            zip: exp.zip || "",
            jobDescription: exp.jobDescription || "",
            jobCategory: exp.jobCategory || "",
          }));
        }
        return [
          {
            type: "create",
            company: "",
            jobTitle: "",
            duration: "",
            startDate: "",
            endDate: "",
            currentlyWorking: false,
            country: "",
            city: "",
            zip: "",
            jobDescription: "",
            jobCategory: "",
          },
        ];
      })(),
      educationList: (() => {
        if (Array.isArray(resume.education) && resume.education.length > 0) {
          return resume.education.map((edu: any) => ({
            _id: edu._id || undefined,
            type: edu._id ? "update" : "create",
            instituteName: edu.instituteName || edu.university || "", // Handle both instituteName and university fields
            degree: edu.degree || "",
            fieldOfStudy: edu.fieldOfStudy || "",
            startDate: edu.startDate
              ? new Date(edu.startDate)
                  .toLocaleDateString("en-US", {
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace("/", "/")
              : "",
            graduationDate: edu.graduationDate
              ? new Date(edu.graduationDate)
                  .toLocaleDateString("en-US", {
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace("/", "/")
              : "",
            currentlyStudying: edu.currentlyStudying || false,
            city: edu.city || "",
            country: edu.country || "",
          }));
        }
        return [
          {
            type: "create",
            instituteName: "",
            degree: "",
            fieldOfStudy: "",
            startDate: "",
            graduationDate: "",
            currentlyStudying: false,
            city: "",
            country: "",
          },
        ];
      })(),
      awardsAndHonors: (() => {
        if (
          Array.isArray(resume.awardsAndHonors) &&
          resume.awardsAndHonors.length > 0
        ) {
          return resume.awardsAndHonors.map((award: any) => ({
            _id: award._id || undefined,
            type: award._id ? "update" : "create",
            title: award.title || "",
            programeName: award.programeName || "",
            year: award.programeDate
              ? new Date(award.programeDate).getFullYear().toString()
              : award.year || "", // Handle programeDate field
            description: award.description || "",
          }));
        }
        return [
          {
            type: "create",
            title: "",
            programeName: "",
            year: "",
            description: "",
          },
        ];
      })(),
      languages: Array.isArray(resume.resume?.languages)
        ? resume.resume.languages
        : [],
      certifications: Array.isArray(resume.resume?.certifications)
        ? resume.resume.certifications
        : [],
    },
  });

  // ... existing code for field arrays and handlers ...

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperienceFields,
  } = useFieldArray({
    control: form.control,
    name: "experiences",
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducationFields,
  } = useFieldArray({
    control: form.control,
    name: "educationList",
  });

  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAwardFields,
  } = useFieldArray({
    control: form.control,
    name: "awardsAndHonors",
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ResumeFormData) => {
    try {
      setIsSubmitting(true);
      const isValid = await form.trigger();
      if (!isValid) {
        const firstError = Object.values(form.formState.errors)[0];
        toast.error(firstError.message || "Please fill in all required fields");
        return;
      }

      const formData = new FormData();
      const resumeObject = {
        type: "update",
        _id: resume.resume?._id, // Use resume._id from nested structure
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        title: data.title || "",
        city: data.city || "",
        zipCode: data.zipCode || "",
        country: data.country || "",
        aboutUs: data.aboutUs,
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
        languages: Array.isArray(data.languages) ? data.languages : [],
        certifications: Array.isArray(data.certifications)
          ? data.certifications
          : [],
        sLink: (data.sLink || [])
          .filter((link) => link.url && link.url.trim() !== "")
          .map((link) => ({
            _id: link._id,
            type: link._id
              ? link.type === "delete"
                ? "delete"
                : "update"
              : "create",
            label: link.label,
            url: link.url,
          })),
      };

      const processedExperiences = (data.experiences || []).map((exp) => ({
        ...exp,
        type: exp._id
          ? exp.type === "delete"
            ? "delete"
            : "update"
          : "create",
        position: exp.jobTitle, // Map jobTitle to position for API compatibility
        startDate: exp.startDate ? formatDateForMongoDB(exp.startDate) : "",
        endDate: exp.currentlyWorking
          ? ""
          : exp.endDate
          ? formatDateForMongoDB(exp.endDate)
          : "",
      }));

      const processedEducation = (data.educationList || []).map((edu) => ({
        ...edu,
        type: edu._id
          ? edu.type === "delete"
            ? "delete"
            : "update"
          : "create",
        university: edu.instituteName, // Map instituteName to university for API compatibility
        startDate: edu.startDate ? formatDateForMongoDB(edu.startDate) : "",
        graduationDate: edu.currentlyStudying
          ? ""
          : edu.graduationDate
          ? formatDateForMongoDB(edu.graduationDate)
          : "",
      }));

      const processedAwards = (data.awardsAndHonors || []).map((award) => ({
        ...award,
        type: award._id
          ? award.type === "delete"
            ? "delete"
            : "update"
          : "create",
        programeDate: award.year
          ? new Date(`${award.year}-01-01`).toISOString()
          : "", // Map year to programeDate
      }));

      formData.append("resume", JSON.stringify(resumeObject));
      formData.append("experiences", JSON.stringify(processedExperiences));
      formData.append("educationList", JSON.stringify(processedEducation));
      formData.append("awardsAndHonors", JSON.stringify(processedAwards));

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      if (bannerFile) {
        formData.append("banner", bannerFile);
      }

      await onUpdate(formData);
      toast.success("Resume updated successfully!");
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Failed to update resume. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Update Resume</h1>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information Card */}
          {/* Banner Field */}
          <div className="flex-shrink-0 w-full">
            <FormLabel className="text-sm font-medium text-blue-600 mb-2 block">
              Banner
            </FormLabel>

            <div
              className="w-full h-[400px] border-2 border-dashed border-gray-300 rounded-lg
               flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 overflow-hidden"
              onClick={() => document.getElementById("banner-upload")?.click()}
            >
              {bannerPreview || resume.resume?.banner ? (
                <Image
                  src={
                    bannerPreview || resume.resume?.banner || "/placeholder.svg"
                  }
                  alt="Banner"
                  width={1200}
                  height={400}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <Upload className="h-5 w-5" />
                  <span>Click to upload banner (recommended 1200×400)</span>
                </div>
              )}
            </div>

            <Input
              id="banner-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />

            {/* Optional: small helper text */}
            <p className="text-xs text-muted-foreground mt-2">
              JPG/PNG, up to ~5MB. Wide images look best.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-8">
                <div className="flex-shrink-0">
                  <FormLabel className="text-sm font-medium text-blue-600 mb-2 block">
                    Photo
                  </FormLabel>
                  <div
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() =>
                      document.getElementById("photo-upload")?.click()
                    }
                  >
                    {photoPreview || resume.resume?.photo ? (
                      <Image
                        src={
                          photoPreview ||
                          resume.resume?.photo ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt="Profile photo"
                        width={100}
                        height={100}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>

                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="aboutUs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-600 font-medium">
                          About Me
                        </FormLabel>
                        <FormControl>
                          <TextEditor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Your First Name" {...field} />
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
                        <Input placeholder="Enter Your Last Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address*</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter Your Email Address"
                          disabled
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
                        <Input
                          disabled
                          placeholder="Enter Phone Number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCountry(value);
                            form.setValue("city", "");
                          }}
                          value={field.value}
                          disabled={isLoadingCountries}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingCountries
                                  ? "Loading countries..."
                                  : "Select Country"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {countriesData?.map((country) => (
                              <SelectItem
                                key={country.country}
                                value={country.country}
                              >
                                {country.country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoadingCities || !selectedCountry}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !selectedCountry
                                  ? "Select country first"
                                  : isLoadingCities
                                  ? "Loading cities..."
                                  : "Select City"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {citiesData?.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Social Links Section */}
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
                    render={({ field }) => (
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
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SkillsSelector
                        selectedSkills={selectedSkills}
                        onSkillsChange={(skills) => {
                          setSelectedSkills(skills);
                          field.onChange(skills);
                        }}
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
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <LanguageSelector
                        selectedLanguages={selectedLanguages}
                        onLanguagesChange={(languages) => {
                          setSelectedLanguages(languages);
                          field.onChange(languages);
                        }}
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
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CertificationSelector
                        selectedCertifications={selectedCertifications}
                        onCertificationsChange={(certifications) => {
                          setSelectedCertifications(certifications);
                          field.onChange(certifications);
                        }}
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
              <CardTitle>Experience (Optional)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Highlight your work journey and key achievements.
              </p>
            </CardHeader>
            <CardContent>
              {(form.watch("experiences") || []).map((experience, index) => {
                if (experience.type === "delete") return null;

                return (
                  <div
                    key={index}
                    className="space-y-4 rounded-lg border p-4 mb-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`experiences.${index}.company`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. IBM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`experiences.${index}.jobTitle`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Software Engineer"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* <FormField
                        control={form.control}
                        name={`experiences.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 2 years" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      /> */}

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <CustomDateInput
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  placeholder="MMYYYY"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {!experience.currentlyWorking && (
                          <FormField
                            control={form.control}
                            name={`experiences.${index}.endDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <CustomDateInput
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="MMYYYY"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`experiences.${index}.currentlyWorking`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue(
                                      `experiences.${index}.endDate`,
                                      ""
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Currently Working</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`experiences.${index}.jobDescription`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your responsibilities and achievements"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {experienceFields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const currentExperiences =
                            form.getValues("experiences") || [];
                          const experienceToRemove = currentExperiences[index];

                          if (experienceToRemove._id) {
                            const updatedExperiences = [...currentExperiences];
                            updatedExperiences[index] = {
                              ...experienceToRemove,
                              type: "delete",
                            };
                            form.setValue("experiences", updatedExperiences);
                          } else {
                            const updatedExperiences =
                              currentExperiences.filter((_, i) => i !== index);
                            form.setValue("experiences", updatedExperiences);
                          }
                        }}
                      >
                        Remove Experience
                      </Button>
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentExperiences =
                    form.getValues("experiences") || [];
                  form.setValue("experiences", [
                    ...currentExperiences,
                    {
                      type: "create",
                      company: "",
                      jobTitle: "",
                      duration: "",
                      startDate: "",
                      endDate: "",
                      currentlyWorking: false,
                      country: "",
                      city: "",
                      zip: "",
                      jobDescription: "",
                      jobCategory: "",
                    },
                  ]);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Experience
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showcase your academic background and qualifications.
              </p>
            </CardHeader>
            <CardContent>
              {(form.watch("educationList") || []).map((education, index) => {
                if (education.type === "delete") return null;

                return (
                  <div
                    key={index}
                    className="space-y-4 rounded-lg border p-4 mb-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`educationList.${index}.instituteName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Institute Name*</FormLabel>
                            <FormControl>
                              <UniversitySelector
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="Search for university..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`educationList.${index}.degree`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Degree</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a degree" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Bachelor">
                                    Bachelor's Degree
                                  </SelectItem>
                                  <SelectItem value="Master">
                                    Master's Degree
                                  </SelectItem>
                                  <SelectItem value="phd">PhD</SelectItem>
                                  <SelectItem value="Associate">
                                    Associate Degree
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`educationList.${index}.fieldOfStudy`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Of Study</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Computer Science"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`educationList.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <CustomDateInput
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  placeholder="MMYYYY"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {!education.currentlyStudying && (
                          <FormField
                            control={form.control}
                            name={`educationList.${index}.graduationDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Graduation Date</FormLabel>
                                <FormControl>
                                  <CustomDateInput
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="MMYYYY"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`educationList.${index}.currentlyStudying`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue(
                                      `educationList.${index}.graduationDate`,
                                      ""
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Currently Studying
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    {educationFields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const currentEducation =
                            form.getValues("educationList") || [];
                          const educationToRemove = currentEducation[index];

                          if (educationToRemove._id) {
                            const updatedEducation = [...currentEducation];
                            updatedEducation[index] = {
                              ...educationToRemove,
                              type: "delete",
                            };
                            form.setValue("educationList", updatedEducation);
                          } else {
                            const updatedEducation = currentEducation.filter(
                              (_, i) => i !== index
                            );
                            form.setValue("educationList", updatedEducation);
                          }
                        }}
                      >
                        Remove Education
                      </Button>
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentEducation =
                    form.getValues("educationList") || [];
                  form.setValue("educationList", [
                    ...currentEducation,
                    {
                      type: "create",
                      instituteName: "",
                      degree: "",
                      fieldOfStudy: "",
                      startDate: "",
                      graduationDate: "",
                      currentlyStudying: false,
                      city: "",
                      country: "",
                    },
                  ]);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Education
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Awards and Honours (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              {(form.watch("awardsAndHonors") || []).map((award, index) => {
                if (award.type === "delete") return null;

                return (
                  <div
                    key={index}
                    className="space-y-4 rounded-lg border p-4 mb-4"
                  >
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name={`awardsAndHonors.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Award Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Write here" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`awardsAndHonors.${index}.programeName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Program Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Write here" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`awardsAndHonors.${index}.year`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Program Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1900"
                                  max={new Date().getFullYear()}
                                  placeholder="e.g. 2023"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`awardsAndHonors.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Award Short Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Write here" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {awardFields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const currentAwards =
                            form.getValues("awardsAndHonors") || [];
                          const awardToRemove = currentAwards[index];

                          if (awardToRemove._id) {
                            const updatedAwards = [...currentAwards];
                            updatedAwards[index] = {
                              ...awardToRemove,
                              type: "delete",
                            };
                            form.setValue("awardsAndHonors", updatedAwards);
                          } else {
                            const updatedAwards = currentAwards.filter(
                              (_, i) => i !== index
                            );
                            form.setValue("awardsAndHonors", updatedAwards);
                          }
                        }}
                      >
                        Remove Award
                      </Button>
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentAwards = form.getValues("awardsAndHonors") || [];
                  form.setValue("awardsAndHonors", [
                    ...currentAwards,
                    {
                      type: "create",
                      title: "",
                      programeName: "",
                      year: "",
                      description: "",
                    },
                  ]);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Award
              </Button>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-primary hover:bg-blue-700 text-white py-6 text-lg font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Resume"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="py-6 text-lg font-medium bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
