"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Upload, X, Copy, Check, Plus, ChevronsUpDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { createResume, uploadElevatorPitch } from "@/lib/api-service";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
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

// Dummy skills data
const DUMMY_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Bootstrap",
  "Vue.js",
  "Angular",
  "Express.js",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Git",
  "GitHub",
  "GitLab",
  "Figma",
  "Adobe Photoshop",
  "Adobe Illustrator",
  "Project Management",
  "Agile",
  "Scrum",
  "Leadership",
  "Communication",
  "Problem Solving",
  "Team Work",
  "Critical Thinking",
  "Web Design",
  "UI/UX Design",
];

const resumeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  title: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  aboutUs: z
    .string()
    .min(1, "About section is required")
    .refine(
      (value) => {
        const wordCount = value.trim().split(/\s+/).length;
        return wordCount <= 200;
      },
      {
        message: "About section cannot exceed 200 words",
      }
    ),
  skills: z.array(z.string()),
  sLink: z
    .array(
      z.object({
        label: z.string().min(1, "Platform name is required"),
        url: z.string().url("Invalid URL").or(z.string().length(0)),
      })
    )
    .optional(),
  experiences: z
    .array(
      z
        .object({
          company: z.string().optional(),
          position: z.string().optional(),
          duration: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          country: z.string().optional(),
          city: z.string().optional(),
          zip: z.string().optional(),
          jobDescription: z.string().optional(),
          jobCategory: z.string().optional(),
          currentlyWorking: z.boolean().optional().default(false),
        })
        .refine(
          (data) =>
            !data.company ||
            !data.position ||
            data.currentlyWorking ||
            (!data.currentlyWorking && data.endDate),
          {
            message: "End date is required unless currently working",
            path: ["endDate"],
          }
        )
    )
    .optional(),
  educationList: z.array(
    z
      .object({
        institutionName: z.string().min(1, "Institution name is required"),
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
          data.currentlyStudying ||
          (!data.currentlyStudying && data.graduationDate),
        {
          message: "Graduation date is required unless currently studying",
          path: ["graduationDate"],
        }
      )
  ),
  awardsAndHonors: z
    .array(
      z.object({
        title: z.string().optional(),
        programName: z.string().optional(),
        programeDate: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

type ResumeFormData = z.infer<typeof resumeSchema>;

interface Country {
  country: string;
  cities: string[];
}

interface DialCode {
  name: string;
  code: string;
  dial_code: string;
}

interface Option {
  value: string;
  label: string;
}

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

export default function CreateResumeForm() {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedExperienceCountries, setSelectedExperienceCountries] =
    useState<string[]>([]);
  const [selectedEducationCountries, setSelectedEducationCountries] = useState<
    string[]
  >([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [copyUrlSuccess, setCopyUrlSuccess] = useState(false);
  const [certificationInput, setCertificationInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);

  const { data: session } = useSession();

  const form = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      title: "",
      city: "",
      zip: "",
      country: "",
      aboutUs: "",
      skills: [],
      sLink: [],
      experiences: [
        {
          company: "",
          position: "",
          duration: "",
          startDate: "",
          endDate: "",
          country: "",
          city: "",
          zip: "",
          jobDescription: "",
          jobCategory: "",
          currentlyWorking: false,
        },
      ],
      educationList: [
        {
          institutionName: "",
          degree: "",
          fieldOfStudy: "",
          startDate: "",
          graduationDate: "",
          currentlyStudying: false,
          city: "",
          country: "",
        },
      ],
      awardsAndHonors: [
        {
          title: "",
          programName: "",
          programeDate: "",
          description: "",
        },
      ],
      certifications: [],
      languages: [],
    },
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control: form.control,
    name: "experiences",
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control: form.control,
    name: "educationList",
  });

  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAward,
  } = useFieldArray({
    control: form.control,
    name: "awardsAndHonors",
  });

  const {
    fields: sLinkFields,
    append: appendSLink,
    remove: removeSLink,
  } = useFieldArray({
    control: form.control,
    name: "sLink",
  });

  const createResumeMutation = useMutation({
    mutationFn: createResume,
    onSuccess: (data: any) => {
      toast.success(data?.message || "Resume created successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to create resume. Please try again."
      );
      console.error("Error creating resume:", error);
    },
  });

  // Fetch countries
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

  // Fetch dial codes
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

  // Fetch cities for Personal Information
  const { data: citiesData, isLoading: isLoadingCities } = useQuery<string[]>({
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

  // Fetch cities for each experience entry
  const experienceCitiesQueries = experienceFields.map((_, index) => {
    const country = selectedExperienceCountries[index] || "";
    return useQuery<string[]>({
      queryKey: ["cities", `experience-${index}`, country],
      queryFn: async () => {
        if (!country) return [];
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/cities",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ country }),
          }
        );
        const data = await response.json();
        if (data.error) throw new Error("Failed to fetch cities");
        return data.data as string[];
      },
      enabled: !!country,
    });
  });

  // Fetch cities for each education entry
  const educationCitiesQueries = educationFields.map((_, index) => {
    const country = selectedEducationCountries[index] || "";
    return useQuery<string[]>({
      queryKey: ["cities", `education-${index}`, country],
      queryFn: async () => {
        if (!country) return [];
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/cities",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ country }),
          }
        );
        const data = await response.json();
        if (data.error) throw new Error("Failed to fetch cities");
        return data.data as string[];
      },
      enabled: !!country,
    });
  });

  // Handle country data side effects
  useEffect(() => {
    if (countriesData && countriesData.length > 0 && !selectedCountry) {
      setSelectedCountry(countriesData[0].country);
      form.setValue("country", countriesData[0].country);
    }
  }, [countriesData, form, selectedCountry]);

  // Handle dial codes data side effects
  useEffect(() => {
    if (dialCodesData && dialCodesData.length > 0) {
      const defaultDialCode = dialCodesData[0].dial_code;
      form.setValue("phoneNumber", defaultDialCode);
    }
  }, [dialCodesData, form]);

  // Update phone number with dial code when country changes
  useEffect(() => {
    if (selectedCountry && dialCodesData?.length) {
      const selectedDialCode = dialCodesData.find(
        (dc) => dc.name === selectedCountry
      )?.dial_code;
      if (selectedDialCode) {
        const currentPhone = form.getValues("phoneNumber");
        const phoneWithoutDial = currentPhone.replace(/^\+\d+/, "");
        form.setValue("phoneNumber", selectedDialCode + phoneWithoutDial);
      }
    }
  }, [selectedCountry, dialCodesData, form]);

  // Sync experience countries state with form data
  useEffect(() => {
    setSelectedExperienceCountries(
      experienceFields.map((field) => field.country || "")
    );
  }, [experienceFields]);

  // Sync education countries state with form data
  useEffect(() => {
    setSelectedEducationCountries(
      educationFields.map((field) => field.country || "")
    );
  }, [educationFields]);

  // Filter skills based on search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (skillSearch.length >= 1) {
        const filtered = DUMMY_SKILLS.filter(
          (skill) =>
            skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
            !selectedSkills.includes(skill)
        );
        setFilteredSkills(filtered);
      } else {
        setFilteredSkills([]);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [skillSearch, selectedSkills]);

  const countryOptions = useMemo(
    () =>
      countriesData?.map((c) => ({ value: c.country, label: c.country })) || [],
    [countriesData]
  );

  const cityOptions = useMemo(
    () => citiesData?.map((c) => ({ value: c, label: c })) || [],
    [citiesData]
  );

  const experienceCityOptions = useMemo(() => {
    return experienceCitiesQueries.map(
      (query) => query.data?.map((c) => ({ value: c, label: c })) || []
    );
  }, [experienceCitiesQueries]);

  const educationCityOptions = useMemo(() => {
    return educationCitiesQueries.map(
      (query) => query.data?.map((c) => ({ value: c, label: c })) || []
    );
  }, [educationCitiesQueries]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const uploadElevatorPitchMutation = useMutation({
    mutationFn: uploadElevatorPitch,
    onSuccess: () => {
      toast.success("Elevator pitch uploaded successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload video");
    },
  });

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      const newSkills = [...selectedSkills, skill];
      setSelectedSkills(newSkills);
      form.setValue("skills", newSkills);
      setSkillSearch("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = selectedSkills.filter((skill) => skill !== skillToRemove);
    setSelectedSkills(newSkills);
    form.setValue("skills", newSkills);
  };

  const addCertification = (certification: string) => {
    if (certification.trim()) {
      const currentCertifications = form.getValues("certifications") || [];
      form.setValue("certifications", [
        ...currentCertifications,
        certification.trim(),
      ]);
      setCertificationInput("");
    }
  };

  const removeCertification = (index: number) => {
    const currentCertifications = form.getValues("certifications") || [];
    form.setValue(
      "certifications",
      currentCertifications.filter((_, i) => i !== index)
    );
  };

  const addLanguage = (language: string) => {
    if (language.trim()) {
      const currentLanguages = form.getValues("languages") || [];
      form.setValue("languages", [...currentLanguages, language.trim()]);
      setLanguageInput("");
    }
  };

  const removeLanguage = (index: number) => {
    const currentLanguages = form.getValues("languages") || [];
    form.setValue(
      "languages",
      currentLanguages.filter((_, i) => i !== index)
    );
  };

  const handleCertificationKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && certificationInput.trim()) {
      e.preventDefault();
      addCertification(certificationInput);
    }
  };

  const handleLanguageKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && languageInput.trim()) {
      e.preventDefault();
      addLanguage(languageInput);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyUrlSuccess(true);
      setTimeout(() => setCopyUrlSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const onSubmit = async (data: ResumeFormData) => {
    const formData = new FormData();

    // Prepare resume data according to backend model
    const resumeData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      title: data.title,
      city: data.city,
      zip: data.zip,
      country: data.country,
      aboutUs: data.aboutUs,
      skills: data.skills,
      sLink: data.sLink,
      certifications: data.certifications,
      languages: data.languages,
    };

    formData.append("resume", JSON.stringify(resumeData));
    formData.append("experiences", JSON.stringify(data.experiences));
    formData.append("educationList", JSON.stringify(data.educationList));
    formData.append("awardsAndHonors", JSON.stringify(data.awardsAndHonors));
    formData.append("userId", session?.user?.id as string);

    if (photoFile) {
      formData.append("photo", photoFile);
    }

    if (bannerFile) {
      formData.append("banner", bannerFile);
    }

    if (elevatorPitchFile && session?.user?.id) {
      try {
        await uploadElevatorPitchMutation.mutateAsync({
          videoFile: elevatorPitchFile,
          userId: session.user.id,
        });
      } catch (error) {
        // Error toast is handled in mutation onError
        return;
      }
    }

    createResumeMutation.mutate(formData);
  };

  return (
    <div className="p-6 space-y-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            const firstError = Object.values(errors)[0];
            if (firstError) {
              toast.error(
                firstError.message || "Please fill in all required fields"
              );
            }
          })}
          className="space-y-8"
        >
          {/* Upload Your Elevator Pitch */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-medium">
                    Upload Your Elevator Pitch
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

          {/* Banner Upload */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upload Banner</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a banner image to enhance your resume profile.
                </p>
              </div>
              <Button
                type="button"
                className="bg-primary hover:bg-blue-700 text-white"
                onClick={() =>
                  document.getElementById("banner-upload")?.click()
                }
              >
                Upload/Change Banner
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
                {bannerPreview ? (
                  <div className="space-y-4">
                    <Image
                      src={bannerPreview}
                      alt="Banner Preview"
                      width={600}
                      height={200}
                      className="mx-auto max-w-full h-auto rounded-lg"
                    />
                    <p className="text-sm text-green-400">
                      Banner uploaded: {bannerFile?.name}
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg mb-2">Drop your banner image here</p>
                    <p className="text-sm mb-4">or</p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="bg-gray-200 hover:bg-gray-300"
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

          {/* About Us Section */}
          <Card className="border-2 border-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-8">
                {/* Photo Upload */}
                <div className="flex-shrink-0">
                  <Label className="text-sm font-medium text-blue-600 mb-2 block">
                    Photo
                  </Label>
                  <div
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() =>
                      document.getElementById("photo-upload")?.click()
                    }
                  >
                    {photoPreview ? (
                      <Image
                        src={photoPreview || "/placeholder.svg"}
                        alt="Preview"
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
                    onChange={handlePhotoUpload}
                  />
                </div>

                {/* About Us Text Area */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-blue-600 font-medium">
                      About Me
                    </FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyUrl}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {copyUrlSuccess ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy URL
                        </>
                      )}
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name="aboutUs"
                    render={({ field }) => (
                      <FormItem>
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
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title*</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Mr" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mr">Mr.</SelectItem>
                            <SelectItem value="mrs">Mrs.</SelectItem>
                            <SelectItem value="ms">Ms.</SelectItem>
                            <SelectItem value="dr">Dr.</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country*</FormLabel>
                      <FormControl>
                        <Combobox
                          options={countryOptions}
                          value={field.value || ""}
                          onChange={(value) => {
                            field.onChange(value);
                            setSelectedCountry(value);
                          }}
                          placeholder={
                            isLoadingCountries
                              ? "Loading countries..."
                              : "Select Country"
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
                      <FormLabel>City*</FormLabel>
                      <FormControl>
                        <Combobox
                          options={cityOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder={
                            !selectedCountry
                              ? "Select country first"
                              : isLoadingCities
                              ? "Loading cities..."
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
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code / Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter code" {...field} />
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
                          placeholder={
                            isLoadingDialCodes
                              ? "Loading..."
                              : selectedCountry
                              ? `${
                                  dialCodesData?.find(
                                    (dc) => dc.name === selectedCountry
                                  )?.dial_code || ""
                                } Enter phone number`
                              : "Select country first"
                          }
                          {...field}
                          onChange={(e) => {
                            const selectedDialCode = dialCodesData?.find(
                              (dc) => dc.name === selectedCountry
                            )?.dial_code;
                            let value = e.target.value;
                            if (
                              selectedDialCode &&
                              !value.startsWith(selectedDialCode)
                            ) {
                              value =
                                selectedDialCode + value.replace(/^\+\d+/, "");
                            }
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Social Links */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Social Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sLinkFields.map((field, index) => (
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
                          name={`sLink.${index}.url`}
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
                        onClick={() => removeSLink(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => appendSLink({ label: "", url: "" })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Social Link
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showcase your strengths and what sets you apart.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormLabel>Skills*</FormLabel>
                <div className="relative">
                  <Input
                    placeholder="Search and add skills"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                  />
                  {filteredSkills.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {filteredSkills.slice(0, 10).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-gray-100"
                          onClick={() => {
                            addSkill(skill);
                            setSkillSearch("");
                          }}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle>Experience (Optional)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Highlight your work journey and key achievements.
              </p>
            </CardHeader>
            <CardContent>
              {experienceFields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-4 p-4 border rounded-lg mb-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`experiences.${index}.position`}
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
                      name={`experiences.${index}.country`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Combobox
                              options={countryOptions}
                              value={field.value || ""}
                              onChange={(value) => {
                                field.onChange(value);
                                setSelectedExperienceCountries((prev) => {
                                  const newCountries = [...prev];
                                  newCountries[index] = value;
                                  return newCountries;
                                });
                              }}
                              placeholder={
                                isLoadingCountries
                                  ? "Loading countries..."
                                  : "Select Country"
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
                      name={`experiences.${index}.city`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Combobox
                              options={experienceCityOptions[index] || []}
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder={
                                !selectedExperienceCountries[index]
                                  ? "Select country first"
                                  : experienceCitiesQueries[index]?.isLoading
                                  ? "Loading cities..."
                                  : "Select City"
                              }
                              minSearchLength={2}
                              disabled={
                                experienceCitiesQueries[index]?.isLoading ||
                                !selectedExperienceCountries[index]
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`experiences.${index}.currentlyWorking`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked: boolean) => {
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
                            <FormLabel className="font-normal">
                              Currently Working
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experiences.${index}.startDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experiences.${index}.endDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                disabled={form.watch(
                                  `experiences.${index}.currentlyWorking`
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeExperience(index)}
                  >
                    Remove Experience
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendExperience({
                    company: "",
                    position: "",
                    duration: "",
                    startDate: "",
                    endDate: "",
                    country: "",
                    city: "",
                    zip: "",
                    jobDescription: "",
                    jobCategory: "",
                    currentlyWorking: false,
                  })
                }
                className="flex items-center gap-2"
              >
                Add more +
              </Button>
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showcase your academic background and qualifications.
              </p>
            </CardHeader>
            <CardContent>
              {educationFields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-4 p-4 border rounded-lg mb-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`educationList.${index}.institutionName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Harvard University"
                              {...field}
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
                                <SelectItem value="bachelor">
                                  Bachelor's Degree
                                </SelectItem>
                                <SelectItem value="master">
                                  Master's Degree
                                </SelectItem>
                                <SelectItem value="phd">PhD</SelectItem>
                                <SelectItem value="associate">
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
                    <FormField
                      control={form.control}
                      name={`educationList.${index}.country`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Combobox
                              options={countryOptions}
                              value={field.value || ""}
                              onChange={(value) => {
                                field.onChange(value);
                                setSelectedEducationCountries((prev) => {
                                  const newCountries = [...prev];
                                  newCountries[index] = value;
                                  return newCountries;
                                });
                              }}
                              placeholder={
                                isLoadingCountries
                                  ? "Loading countries..."
                                  : "Select Country"
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
                      name={`educationList.${index}.city`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Combobox
                              options={educationCityOptions[index] || []}
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder={
                                !selectedEducationCountries[index]
                                  ? "Select country first"
                                  : educationCitiesQueries[index]?.isLoading
                                  ? "Loading cities..."
                                  : "Select City"
                              }
                              minSearchLength={2}
                              disabled={
                                educationCitiesQueries[index]?.isLoading ||
                                !selectedEducationCountries[index]
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`educationList.${index}.currentlyStudying`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked: boolean) => {
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
                      <FormField
                        control={form.control}
                        name={`educationList.${index}.startDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`educationList.${index}.graduationDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Graduation Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                disabled={form.watch(
                                  `educationList.${index}.currentlyStudying`
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {educationFields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEducation(index)}
                    >
                      Remove Education
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendEducation({
                    institutionName: "",
                    degree: "",
                    fieldOfStudy: "",
                    startDate: "",
                    graduationDate: "",
                    currentlyStudying: false,
                    city: "",
                    country: "",
                  })
                }
                className="flex items-center gap-2"
              >
                Add more +
              </Button>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <p className="text-sm text-muted-foreground">
                List your professional certifications.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="certifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add Certification</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Type certification and press Enter"
                          value={certificationInput}
                          onChange={(e) =>
                            setCertificationInput(e.target.value)
                          }
                          onKeyPress={handleCertificationKeyPress}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap gap-2">
                  {(form.getValues("certifications") || []).map(
                    (certification, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        {certification}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeCertification(index)}
                        />
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <p className="text-sm text-muted-foreground">
                List the languages you speak.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add Language</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Type language and press Enter"
                          value={languageInput}
                          onChange={(e) => setLanguageInput(e.target.value)}
                          onKeyPress={handleLanguageKeyPress}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap gap-2">
                  {(form.getValues("languages") || []).map(
                    (language, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        {language}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeLanguage(index)}
                        />
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Awards and Honours */}
          <Card>
            <CardHeader>
              <CardTitle>Awards and Honours (Optional)</CardTitle>
              {/* <p className="text-sm text-muted-foreground">
                Tell employers what you are in a few impactful sentences.
              </p> */}
            </CardHeader>
            <CardContent>
              {awardFields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-4 p-4 border rounded-lg mb-4"
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
                        name={`awardsAndHonors.${index}.programName`}
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
                        name={`awardsAndHonors.${index}.programeDate`}
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
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAward(index)}
                  >
                    Remove Award
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendAward({
                    title: "",
                    programName: "",
                    programeDate: "",
                    description: "",
                  })
                }
                className="flex items-center gap-2"
              >
                add award
              </Button>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-blue-700 text-white py-6 text-lg font-medium"
            disabled={
              createResumeMutation.isPending || form.formState.isSubmitting
            }
          >
            {createResumeMutation.isPending || form.formState.isSubmitting ? (
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
        </form>
      </Form>
    </div>
  );
}
