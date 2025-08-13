"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Copy, Check } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { createResume } from "@/lib/api-service"

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
]

const resumeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  title: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  aboutUs: z.string().min(1, "About section is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  sLink: z
    .array(
      z.object({
        label: z.string(),
        url: z.string().url("Invalid URL"),
      }),
    )
    .optional(),
  experiences: z.array(
    z.object({
      company: z.string().min(1, "Company is required"),
      position: z.string().min(1, "Position is required"),
      duration: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      zip: z.string().optional(),
      jobDescription: z.string().optional(),
      jobCategory: z.string().optional(),
    }),
  ),
  educationList: z.array(
    z.object({
      institution: z.string().min(1, "Institution is required"),
      degree: z.string().min(1, "Degree is required"),
      fieldOfStudy: z.string().optional(),
      year: z.string().min(1, "Year is required"),
    }),
  ),
  awardsAndHonors: z.array(
    z.object({
      title: z.string().min(1, "Award title is required"),
      programName: z.string().optional(),
      year: z.string().min(1, "Year is required"),
      description: z.string().optional(),
    }),
  ),
})

type ResumeFormData = z.infer<typeof resumeSchema>

interface Country {
  country: string
  cities: string[]
}

export default function CreateResumeForm() {
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [skillSearch, setSkillSearch] = useState("")
  const [filteredSkills, setFilteredSkills] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [copyUrlSuccess, setCopyUrlSuccess] = useState(false)
  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const { data: session } = useSession()

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
      sLink: [
        { label: "website", url: "" },
        { label: "linkedin", url: "" },
        { label: "twitter", url: "" },
        { label: "upwork", url: "" },
        { label: "other", url: "" },
      ],
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
        },
      ],
      educationList: [
        {
          institution: "",
          degree: "",
          fieldOfStudy: "",
          year: "",
        },
      ],
      awardsAndHonors: [
        {
          title: "",
          programName: "",
          year: "",
          description: "",
        },
      ],
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

  const createResumeMutation = useMutation({
    mutationFn: createResume,
    onSuccess: (data: any) => {
      toast.success(data?.message || "Resume created successfully!")
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create resume. Please try again.")
      if (error instanceof Error) {
        console.log(error.message)
      }
      console.error("Error creating resume:", error)
    },
  })

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true)
      try {
        const response = await fetch("https://countriesnow.space/api/v0.1/countries")
        const data = await response.json()
        if (!data.error) {
          setCountries(data.data)
        }
      } catch (error) {
        console.error("Error fetching countries:", error)
      } finally {
        setIsLoadingCountries(false)
      }
    }
    fetchCountries()
  }, [])

  // Fetch cities when country is selected
  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedCountry) return
      setIsLoadingCities(true)
      try {
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country: selectedCountry }),
        })
        const data = await response.json()
        if (!data.error) {
          setCities(data.data)
        }
      } catch (error) {
        console.error("Error fetching cities:", error)
      } finally {
        setIsLoadingCities(false)
      }
    }
    fetchCities()
  }, [selectedCountry])

  // Filter skills based on search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (skillSearch.length >= 1) {
        const filtered = DUMMY_SKILLS.filter(
          (skill) => skill.toLowerCase().includes(skillSearch.toLowerCase()) && !selectedSkills.includes(skill),
        )
        setFilteredSkills(filtered)
      } else {
        setFilteredSkills([])
      }
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [skillSearch, selectedSkills])

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
      console.log("Video file selected:", file.name)
    }
  }

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

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyUrlSuccess(true)
      setTimeout(() => setCopyUrlSuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
    }
  }

  const onSubmit = (data: ResumeFormData) => {
    const formData = new FormData()

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
    }

    formData.append("resume", JSON.stringify(resumeData))
    formData.append("experiences", JSON.stringify(data.experiences))
    formData.append("educationList", JSON.stringify(data.educationList))
    formData.append("awardsAndHonors", JSON.stringify(data.awardsAndHonors))
    formData.append("userId", session?.user?.id as string)

    // Add photo if uploaded
    if (photoFile) {
      formData.append("photo", photoFile)
    }

    // Add video if uploaded
    if (videoFile) {
      formData.append("video", videoFile)
    }

    createResumeMutation.mutate(formData)
  }

  return (
    <div className="p-6 space-y-8">
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
          {/* Upload Your Elevator Pitch */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upload Your Elevator Pitch</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a 60-second elevator video pitch introducing your agency and what makes you stand out from the
                  rest.
                </p>
              </div>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => document.getElementById("video-upload")?.click()}
              >
                Upload/Change Elevator Pitch
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-900 text-white">
                {videoPreview ? (
                  <div className="space-y-4">
                    <video src={videoPreview} controls className="mx-auto max-w-md rounded-lg" />
                    <p className="text-sm text-green-400">Video uploaded: {videoFile?.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 mb-4" />
                    <p className="text-lg mb-2">Drop your files here</p>
                    <p className="text-sm mb-4">or</p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                      onClick={() => document.getElementById("video-upload")?.click()}
                    >
                      Choose File
                    </Button>
                  </>
                )}
                <Input id="video-upload" type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
              </div>
            </CardContent>
          </Card>

          {/* About Us Section */}
          <Card className="border-2 border-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-8">
                {/* Photo Upload */}
                <div className="flex-shrink-0">
                  <Label className="text-sm font-medium text-blue-600 mb-2 block">Photo/Recruiter logo</Label>
                  <div
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => document.getElementById("photo-upload")?.click()}
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Preview"
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
                    <FormLabel className="text-blue-600 font-medium">About Us*</FormLabel>
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
                          <Textarea
                            placeholder="Write your description here (max 400 words)"
                            className="min-h-[200px] resize-none"
                            {...field}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select
                          onValueChange={(value: string) => {
                            field.onChange(value)
                            setSelectedCountry(value)
                          }}
                          defaultValue={field.value}
                          disabled={isLoadingCountries}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingCountries ? "Loading countries..." : "Select Country"} />
                          </SelectTrigger>
                          {!isLoadingCountries && (
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.country} value={country.country}>
                                  {country.country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          )}
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
                      <FormLabel>City*</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                          {!isLoadingCities && selectedCountry && (
                            <SelectContent>
                              {cities.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          )}
                        </Select>
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
                      <FormLabel>Phone number*</FormLabel>
                      <FormControl>
                        <Input placeholder="+49 72517 3740" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sLink.0.label"
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                <FormField
                  control={form.control}
                  name="sLink.0.url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Your Website URL"
                          value={field.value || ""}
                          onChange={(e) => {
                            form.setValue("sLink.0.label", "website")
                            field.onChange(e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sLink.1.label"
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                <FormField
                  control={form.control}
                  name="sLink.1.url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Your LinkedIn URL"
                          value={field.value || ""}
                          onChange={(e) => {
                            form.setValue("sLink.1.label", "linkedin")
                            field.onChange(e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sLink.2.label"
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                <FormField
                  control={form.control}
                  name="sLink.2.url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Your Twitter URL"
                          value={field.value || ""}
                          onChange={(e) => {
                            form.setValue("sLink.2.label", "twitter")
                            field.onChange(e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sLink.3.label"
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                <FormField
                  control={form.control}
                  name="sLink.3.url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upwork URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Your Upwork URL"
                          value={field.value || ""}
                          onChange={(e) => {
                            form.setValue("sLink.3.label", "upwork")
                            field.onChange(e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sLink.4.label"
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                <FormField
                  control={form.control}
                  name="sLink.4.url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Business URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Your Other Business URL"
                          value={field.value || ""}
                          onChange={(e) => {
                            form.setValue("sLink.4.label", "other")
                            field.onChange(e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <p className="text-sm text-muted-foreground">Showcase your strengths and what sets you apart.</p>
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
                            addSkill(skill)
                            setSkillSearch("")
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
              <CardTitle>Experience</CardTitle>
              <p className="text-sm text-muted-foreground">Highlight your work journey and key achievements.</p>
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
                          <FormLabel>Employer</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. IBM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`experiences.${index}.position`}
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
                            <Input type="date" {...field} />
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((country) => (
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
                            <Input placeholder="e.g. Berlin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`experiences.${index}.zip`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 10115" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`experiences.${index}.jobCategory`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Category</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. IT" {...field} />
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
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeExperience(index)}>
                      Remove Experience
                    </Button>
                  )}
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
              <p className="text-sm text-muted-foreground">Showcase your academic background and qualifications.</p>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      name={`educationList.${index}.year`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Graduation Year</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1900"
                              max={new Date().getFullYear()}
                              placeholder="e.g. 2020"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {educationFields.length > 1 && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeEducation(index)}>
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
                    year: "",
                  })
                }
                className="flex items-center gap-2"
              >
                Add more +
              </Button>
            </CardContent>
          </Card>

          {/* Awards and Honours */}
          <Card>
            <CardHeader>
              <CardTitle>Awards and Honours</CardTitle>
              <p className="text-sm text-muted-foreground">Tell employers what you are in a few impactful sentences.</p>
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
                            <FormLabel>Year Received</FormLabel>
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
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeAward(index)}>
                      Remove Award
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => appendAward({ title: "", programName: "", year: "", description: "" })}
                className="flex items-center gap-2"
              >
                Add Award
              </Button>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-medium"
            disabled={createResumeMutation.isPending || form.formState.isSubmitting}
          >
            {createResumeMutation.isPending || form.formState.isSubmitting ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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
  )
}
