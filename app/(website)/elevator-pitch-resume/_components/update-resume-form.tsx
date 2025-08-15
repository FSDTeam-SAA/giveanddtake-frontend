"use client"

import type React from "react"
import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Resume schema for validation
const resumeSchema = z.object({
  firstName: z.string().min(1, "First name must be at least 1 character"),
  lastName: z.string().min(1, "Last name must be at least 1 character"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  title: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
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
      company: z.string().min(1, "Company is required"), // Changed from employer
      duration: z.string().optional(), // Added duration field
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      zip: z.string().optional(),
      jobTitle: z.string().optional(),
      jobDescription: z.string().optional(),
      jobCategory: z.string().optional(),
    }),
  ),
  educationList: z.array(
    z.object({
      institution: z.string().min(1, "Institution is required"),
      degree: z.string().min(1, "Degree is required"),
      fieldOfStudy: z.string().optional(),
      year: z.string().min(1, "Year is required"), // Changed from graduationYear
    }),
  ),
  awardsAndHonors: z.array(
    z.object({
      title: z.string().min(1, "Award title is required"),
      programName: z.string().optional(),
      year: z.string().min(1, "Year is required"), // Changed from programeDate
      description: z.string().optional(),
    }),
  ),
})

type ResumeFormData = z.infer<typeof resumeSchema>

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
  "Node.js",
  "Python",
  "Java",
  "C++",
  "HTML",
  "CSS",
  "Angular",
  "Vue.js",
  "Express.js",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Git",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "Machine Learning",
  "Data Analysis",
  "Project Management",
  "Agile",
  "Scrum",
  "Leadership",
  "Communication",
  "Problem Solving",
]

export default function UpdateResumeForm({ resume, onCancel, onUpdate }: UpdateResumeFormProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(resume.resume?.skills || [])
  const [skillSearch, setSkillSearch] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredSkills = skillsList.filter(
    (skill) => skill.toLowerCase().includes(skillSearch.toLowerCase()) && !selectedSkills.includes(skill),
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
        // Ensure sLink is always an array with 5 elements
        const defaultLinks = [
          { label: "website", url: "" },
          { label: "linkedin", url: "" },
          { label: "twitter", url: "" },
          { label: "upwork", url: "" },
          { label: "other", url: "" },
        ]

        // Check for sLink in resume.resume.sLink (correct API structure)
        if (Array.isArray(resume.resume?.sLink) && resume.resume.sLink.length > 0) {
          return resume.resume.sLink
            .map((link: { label: string; url: string }, index: number) => ({
              label: link.label || defaultLinks[index]?.label || "website",
              url: link.url || "",
            }))
            .concat(defaultLinks.slice(resume.resume.sLink.length))
        }

        // Fallback: check for legacy website field
        if (resume.resume?.website) {
          defaultLinks[0].url = resume.resume.website
        }

        return defaultLinks
      })(),

      experiences: (() => {
        if (Array.isArray(resume.experiences) && resume.experiences.length > 0) {
          return resume.experiences.map((exp: any) => ({
            company: exp.company || exp.employer || "",
            duration: exp.duration || "",
            startDate: exp.startDate ? exp.startDate.split("T")[0] : "",
            endDate: exp.endDate ? exp.endDate.split("T")[0] : "",
            country: exp.country || "",
            city: exp.city || "",
            zip: exp.zip || "",
            jobTitle: exp.jobTitle || "",
            jobDescription: exp.jobDescription || "",
            jobCategory: exp.jobCategory || "",
          }))
        }
        return [
          {
            position: "",
            company: "",
            duration: "",
            startDate: "",
            endDate: "",
            country: "",
            city: "",
            zip: "",
            jobTitle: "",
            jobDescription: "",
            jobCategory: "",
          },
        ]
      })(),
      educationList: (() => {
        if (Array.isArray(resume.education) && resume.education.length > 0) {
          return resume.education.map((edu: any) => ({
            institution: edu.instituteName || "",
            degree: edu.degree || "",
            fieldOfStudy: edu.fieldOfStudy || "",
            year: edu.year || (edu.graduationDate ? new Date(edu.graduationDate).getFullYear().toString() : ""),
          }))
        }
        return [{ degree: "", institution: "", year: "", fieldOfStudy: "" }]
      })(),
      awardsAndHonors: (() => {
        if (Array.isArray(resume.awardsAndHonors) && resume.awardsAndHonors.length > 0) {
          return resume.awardsAndHonors.map((award: any) => ({
            title: award.title || "",
            programName: award.programName || "",
            year:
              award.year ||
              (award.createdAt ? new Date(award.createdAt).getFullYear().toString() : award.programeDate || ""),
            description: award.description || "",
          }))
        }
        return [{ title: "", programName: "", year: "", description: "" }]
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

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      const newSkills = [...selectedSkills, skill]
      setSelectedSkills(newSkills)
      form.setValue("skills", newSkills)
    }
  }

  const removeSkill = (skillToRemove: string) => {
    const newSkills = selectedSkills.filter((skill) => skill !== skillToRemove)
    setSelectedSkills(newSkills)
    form.setValue("skills", newSkills)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0])
    }
  }

  const onSubmit = async (data: ResumeFormData) => {
    console.log("Form submission started")
    try {
      setIsSubmitting(true)

      // Validate all fields
      const isValid = await form.trigger()
      if (!isValid) {
        console.error("Form validation failed")
        return
      }

      console.log("Form data is valid:", data)

      // Create FormData
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

      // Add resume object as JSON string
      formData.append("resume", JSON.stringify(resumeObject))

      // Add arrays as direct JSON strings (not nested in resume)
      formData.append("experiences", JSON.stringify(data.experiences))
      formData.append("educationList", JSON.stringify(data.educationList))
      formData.append("awardsAndHonors", JSON.stringify(data.awardsAndHonors))

      // Add photo if exists
      if (photoFile) {
        formData.append("photo", photoFile)
      }

      // Log FormData contents for debugging
      for (const [key, value] of formData.entries()) {
        console.log(key, value)
      }

      await onUpdate(formData)
    } catch (error) {
      console.error("Error in form submission:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Update Resume</h1>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo Upload */}

          {Object.keys(form.formState.errors).length > 0 && (
            <div className="text-red-500">
              <pre>{JSON.stringify(form.formState.errors, null, 2)}</pre>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {resume.resume.photo && (
                  <img
                    src={resume.resume.photo || "/placeholder.svg"}
                    alt="Current photo"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div>
                  <Input type="file" accept="image/*" onChange={handlePhotoChange} className="mb-2" />
                  <p className="text-sm text-muted-foreground">Upload a new photo to replace the current one</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input placeholder="Enter Country" {...field} />
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
                        <Input placeholder="Enter City" {...field} />
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
                            // Always set label to "website" when URL changes
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

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="aboutUs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Yourself*</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about yourself..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
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
                          <FormLabel>Company</FormLabel>
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
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Software Engineer" {...field} />
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
                            <Input placeholder="e.g. Germany" {...field} />
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
                onClick={() => appendExperience({ jobTitle: "", company: "", duration: "" })}
              >
                Add Experience
              </Button>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
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
                            <Input placeholder="e.g. Bachelor's Degree" {...field} />
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
                          <FormLabel>Year</FormLabel>
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
                    degree: "",
                    institution: "",
                    year: "",
                  })
                }
              >
                Add Education
              </Button>
            </CardContent>
          </Card>

          {/* Awards and Honours */}
          <Card>
            <CardHeader>
              <CardTitle>Awards and Honours</CardTitle>
            </CardHeader>
            <CardContent>
              {awardFields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`awardsAndHonors.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Award Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Award title" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Award description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {awardFields.length > 1 && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeAward(index)}>
                      Remove Award
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendAward({ title: "", year: "" })}>
                Add Award
              </Button>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Resume"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
