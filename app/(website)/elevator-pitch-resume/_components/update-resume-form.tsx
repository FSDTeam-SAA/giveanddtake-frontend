"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Copy, Check, Plus, Upload } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import TextEditor from "@/components/MultiStepJobForm/TextEditor"
import Image from "next/image"
import { toast } from "sonner"

// Resume schema for validation
const resumeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  title: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  aboutUs: z
    .string()
    .min(1, "About section is required")
    .refine(
      (value) => {
        const wordCount = value.trim().split(/\s+/).length
        return wordCount <= 200
      },
      {
        message: "About section cannot exceed 200 words",
      }
    ),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
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
          jobTitle: z.string().optional(),
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
            !data.company ||
            !data.jobTitle ||
            data.currentlyWorking ||
            (!data.currentlyWorking && data.endDate),
          {
            message: "End date is required unless currently working",
            path: ["endDate"],
          }
        )
    )
    .optional(),
  educationList: z
    .array(
      z
        .object({
          institution: z.string().min(1, "Institution name is required"),
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
        year: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
})

type ResumeFormData = z.infer<typeof resumeSchema>

interface Country {
  country: string
  cities: string[]
}

interface UpdateResumeFormProps {
  resume: any
  onCancel: () => void
  onUpdate: (data: FormData) => Promise<void>
}

// Skills list for autocomplete
const skillsList = [
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
]

export default function UpdateResumeForm({ resume, onCancel, onUpdate }: UpdateResumeFormProps): React.ReactElement {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(resume.resume?.skills || [])
  const [skillSearch, setSkillSearch] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copyUrlSuccess, setCopyUrlSuccess] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>(resume.resume?.country || "")
  const [selectedExpCountries, setSelectedExpCountries] = useState<string[]>(
    resume.experiences?.map((exp: any) => exp.country || "") || []
  )
  const [selectedEduCountries, setSelectedEduCountries] = useState<string[]>(
    resume.education?.map((edu: any) => edu.country || "") || []
  )

  // Fetch countries
  const { data: countriesData, isLoading: isLoadingCountries } = useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries")
      const data = await response.json()
      if (data.error) throw new Error("Failed to fetch countries")
      return data.data as Country[]
    },
  })

  // Fetch cities for Personal Information
  const { data: citiesData, isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ["cities", selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return []
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selectedCountry }),
      })
      const data = await response.json()
      if (data.error) throw new Error("Failed to fetch cities")
      return data.data as string[]
    },
    enabled: !!selectedCountry,
  })

  // Fetch cities for each experience entry
  const experienceCitiesQueries = selectedExpCountries.map((country, index) =>
    useQuery<string[]>({
      queryKey: ["cities", `experience-${index}`, country],
      queryFn: async () => {
        if (!country) return []
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country }),
        })
        const data = await response.json()
        if (data.error) throw new Error("Failed to fetch cities")
        return data.data as string[]
      },
      enabled: !!country,
    })
  )

  // Fetch cities for each education entry
  const educationCitiesQueries = selectedEduCountries.map((country, index) =>
    useQuery<string[]>({
      queryKey: ["cities", `education-${index}`, country],
      queryFn: async () => {
        if (!country) return []
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country }),
        })
        const data = await response.json()
        if (data.error) throw new Error("Failed to fetch cities")
        return data.data as string[]
      },
      enabled: !!country,
    })
  )

  const form = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      firstName: resume.resume?.firstName || "",
      lastName: resume.resume?.lastName || "",
      email: resume.resume?.email || "",
      phoneNumber: resume.resume?.phoneNumber || "",
      title: resume.resume?.title || "",
      city: resume.resume?.city || "",
      zipCode: resume.resume?.zipCode || "",
      country: resume.resume?.country || "",
      aboutUs: resume.resume?.aboutUs || "",
      skills: Array.isArray(resume.resume?.skills) ? resume.resume.skills : [],
      sLink: (() => {
        const defaultLinks = [
          { label: "website", url: "" },
          { label: "linkedin", url: "" },
          { label: "twitter", url: "" },
          { label: "upwork", url: "" },
          { label: "other", url: "" },
        ]
        if (Array.isArray(resume.resume?.sLink) && resume.resume.sLink.length > 0) {
          return resume.resume.sLink
            .map((link: { label: string; url: string }, index: number) => ({
              label: link.label || defaultLinks[index]?.label || "website",
              url: link.url || "",
            }))
            .concat(defaultLinks.slice(resume.resume.sLink.length))
        }
        if (resume.resume?.website) {
          defaultLinks[0].url = resume.resume.website
        }
        return defaultLinks
      })(),
      experiences: (() => {
        if (Array.isArray(resume.experiences) && resume.experiences.length > 0) {
          return resume.experiences.map((exp: any) => ({
            company: exp.company || exp.employer || "",
            jobTitle: exp.jobTitle || exp.position || "",
            duration: exp.duration || "",
            startDate: exp.startDate ? exp.startDate.split("T")[0] : "",
            endDate: exp.endDate ? exp.endDate.split("T")[0] : "",
            currentlyWorking: exp.currentlyWorking || false,
            country: exp.country || "",
            city: exp.city || "",
            zip: exp.zip || "",
            jobDescription: exp.jobDescription || "",
            jobCategory: exp.jobCategory || "",
          }))
        }
        return [
          {
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
        ]
      })(),
      educationList: (() => {
        if (Array.isArray(resume.education) && resume.education.length > 0) {
          return resume.education.map((edu: any) => ({
            institution: edu.instituteName || edu.institution || "",
            degree: edu.degree || "",
            fieldOfStudy: edu.fieldOfStudy || "",
            startDate: edu.startDate ? edu.startDate.split("T")[0] : "",
            graduationDate: edu.graduationDate ? edu.graduationDate.split("T")[0] : "",
            currentlyStudying: edu.currentlyStudying || false,
            city: edu.city || "",
            country: edu.country || "",
          }))
        }
        return [
          {
            institution: "",
            degree: "",
            fieldOfStudy: "",
            startDate: "",
            graduationDate: "",
            currentlyStudying: false,
            city: "",
            country: "",
          },
        ]
      })(),
      awardsAndHonors: (() => {
        if (Array.isArray(resume.awardsAndHonors) && resume.awardsAndHonors.length > 0) {
          return resume.awardsAndHonors.map((award: any) => ({
            title: award.title || "",
            programName: award.programName || "",
            year: award.year || (award.createdAt ? new Date(award.createdAt).getFullYear().toString() : award.programeDate || ""),
            description: award.description || "",
          }))
        }
        return [
          {
            title: "",
            programName: "",
            year: "",
            description: "",
          },
        ]
      })(),
    },
  })

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control: form.control,
    name: "experiences",
  })

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control: form.control,
    name: "educationList",
  })

  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAward,
  } = useFieldArray({
    control: form.control,
    name: "awardsAndHonors",
  })

  const {
    fields: sLinkFields,
    append: appendSLink,
    remove: removeSLink,
  } = useFieldArray({
    control: form.control,
    name: "sLink",
  })

  const filteredSkills = skillsList.filter(
    (skill) => skill.toLowerCase().includes(skillSearch.toLowerCase()) && !selectedSkills.includes(skill)
  )

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      const newSkills = [...selectedSkills, skill]
      setSelectedSkills(newSkills)
      form.setValue("skills", newSkills)
      setSkillSearch("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    const newSkills = selectedSkills.filter((skill) => skill !== skillToRemove)
    setSelectedSkills(newSkills)
    form.setValue("skills", newSkills)
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(form.getValues("aboutUs"))
      setCopyUrlSuccess(true)
      setTimeout(() => setCopyUrlSuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  const cleanup = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }
  }

  useEffect(() => {
    return cleanup
  }, [photoPreview])

  // Sync experience countries state with form data
  useEffect(() => {
    setSelectedExpCountries(experienceFields.map((field) => field.country || ""))
  }, [experienceFields])

  // Sync education countries state with form data
  useEffect(() => {
    setSelectedEduCountries(educationFields.map((field) => field.country || ""))
  }, [educationFields])

  const onSubmit = async (data: ResumeFormData) => {
    try {
      setIsSubmitting(true)
      const isValid = await form.trigger()
      if (!isValid) {
        const firstError = Object.values(form.formState.errors)[0]
        toast.error(firstError.message || "Please fill in all required fields")
        return
      }

      const formData = new FormData()
      const resumeObject = {
        type: "candidate",
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        title: data.title || "",
        city: data.city || "",
        zipCode: data.zipCode || "",
        country: data.country || "",
        aboutUs: data.aboutUs,
        skills: data.skills,
        sLink: data.sLink || [],
      }

      formData.append("resume", JSON.stringify(resumeObject))
      formData.append("experiences", JSON.stringify(data.experiences))
      formData.append("educationList", JSON.stringify(data.educationList))
      formData.append("awardsAndHonors", JSON.stringify(data.awardsAndHonors))

      if (photoFile) {
        formData.append("photo", photoFile)
      }

      await onUpdate(formData)
      toast.success("Resume updated successfully!")
    } catch (error) {
      console.error("Error in form submission:", error)
      toast.error("Failed to update resume. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Update Resume</h1>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            const firstError = Object.values(errors)[0]
            if (firstError) {
              toast.error(firstError.message || "Please fill in all required fields")
            }
          })}
          className="space-y-8"
        >
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="text-red-500">
              <pre>{JSON.stringify(form.formState.errors, null, 2)}</pre>
            </div>
          )}

          {/* About Section */}
          <Card className="border-2 border-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-8">
                {/* Photo Upload */}
                <div className="flex-shrink-0">
                  <FormLabel className="text-sm font-medium text-blue-600 mb-2 block">
                    Photo
                  </FormLabel>
                  <div
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => document.getElementById("photo-upload")?.click()}
                  >
                    {(photoPreview || resume.resume.photo) ? (
                      <Image
                        src={photoPreview || resume.resume.photo || "/placeholder.svg"}
                        alt={photoPreview ? "Selected photo preview" : "Current photo"}
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
                          Copy Text
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
                          Word count: {field.value.trim().split(/\s+/).length}/200
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
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select title" />
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
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedCountry(value)
                            form.setValue("city", "") // Reset city when country changes
                          }}
                          value={field.value}
                          disabled={isLoadingCountries}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingCountries ? "Loading countries..." : "Select Country"} />
                          </SelectTrigger>
                          <SelectContent>
                            {countriesData?.map((country) => (
                              <SelectItem key={country.country} value={country.country}>
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

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Zip Code" {...field} />
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
                        <Input type="email" placeholder="Enter Your Email Address" {...field} />
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
                        <Input placeholder="Enter Phone Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Social Links */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Social Links</CardTitle>
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
                                <Input placeholder="e.g. GitHub, Portfolio" {...field} />
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
                                <Input placeholder="https://example.com/..." {...field} />
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
                  {filteredSkills.length > 0 && skillSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {filteredSkills.slice(0, 10).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-gray-100"
                          onClick={() => addSkill(skill)}
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
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
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
                <div key={field.id} className="space-y-4 p-4 border rounded-lg mb-4">
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
                            <Input placeholder="e.g. Software Engineer" {...field} />
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
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                const newCountries = [...selectedExpCountries]
                                newCountries[index] = value
                                setSelectedExpCountries(newCountries)
                                form.setValue(`experiences.${index}.city`, "") // Reset city
                              }}
                              value={field.value}
                              disabled={isLoadingCountries}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingCountries ? "Loading countries..." : "Select Country"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {countriesData?.map((country) => (
                                  <SelectItem key={country.country} value={country.country}>
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
                      name={`experiences.${index}.city`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={
                                experienceCitiesQueries[index]?.isLoading ||
                                !selectedExpCountries[index]
                              }
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    !selectedExpCountries[index]
                                      ? "Select country first"
                                      : experienceCitiesQueries[index]?.isLoading
                                      ? "Loading cities..."
                                      : "Select City"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {experienceCitiesQueries[index]?.data?.map((city) => (
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

                    <FormField
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
                      name={`experiences.${index}.currentlyWorking`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked)
                                if (checked) {
                                  form.setValue(`experiences.${index}.endDate`, "")
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
                              disabled={form.watch(`experiences.${index}.currentlyWorking`)}
                            />
                          </FormControl>
                          <FormMessage />
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
                          <Textarea placeholder="Describe your responsibilities and achievements" {...field} />
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
                      onClick={() => removeExperience(index)}
                    >
                      Remove Experience
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  appendExperience({
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
                  })
                  setSelectedExpCountries([...selectedExpCountries, ""])
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Experience
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
                <div key={field.id} className="space-y-4 p-4 border rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`educationList.${index}.institution`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Harvard University" {...field} />
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a degree" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                                <SelectItem value="master">Master's Degree</SelectItem>
                                <SelectItem value="phd">PhD</SelectItem>
                                <SelectItem value="associate">Associate Degree</SelectItem>
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
                            <Input placeholder="e.g. Computer Science" {...field} />
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
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                const newCountries = [...selectedEduCountries]
                                newCountries[index] = value
                                setSelectedEduCountries(newCountries)
                                form.setValue(`educationList.${index}.city`, "") // Reset city
                              }}
                              value={field.value}
                              disabled={isLoadingCountries}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingCountries ? "Loading countries..." : "Select Country"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {countriesData?.map((country) => (
                                  <SelectItem key={country.country} value={country.country}>
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
                      name={`educationList.${index}.city`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={
                                educationCitiesQueries[index]?.isLoading ||
                                !selectedEduCountries[index]
                              }
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    !selectedEduCountries[index]
                                      ? "Select country first"
                                      : educationCitiesQueries[index]?.isLoading
                                      ? "Loading cities..."
                                      : "Select City"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {educationCitiesQueries[index]?.data?.map((city) => (
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

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`educationList.${index}.currentlyStudying`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked)
                                  if (checked) {
                                    form.setValue(`educationList.${index}.graduationDate`, "")
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Currently Studying</FormLabel>
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
                                disabled={form.watch(`educationList.${index}.currentlyStudying`)}
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
                    institution: "",
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
                <Plus className="h-4 w-4" />
                Add Education
              </Button>
            </CardContent>
          </Card>

          {/* Awards and Honours */}
          <Card>
            <CardHeader>
              <CardTitle>Awards and Honours (Optional)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tell employers what you are in a few impactful sentences.
              </p>
            </CardHeader>
            <CardContent>
              {awardFields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border rounded-lg mb-4">
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
                      onClick={() => removeAward(index)}
                    >
                      Remove Award
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendAward({
                    title: "",
                    programName: "",
                    year: "",
                    description: "",
                  })
                }
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
              {isSubmitting ? (
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
                  Updating...
                </div>
              ) : (
                "Update Resume"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="py-6 text-lg font-medium"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}