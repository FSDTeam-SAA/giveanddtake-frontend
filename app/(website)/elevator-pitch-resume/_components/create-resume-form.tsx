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
import { Upload, X, Plus } from "lucide-react"
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
    type: z.literal("candidate"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    title: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    websiteURL: z.string().optional(),
    linkedinURL: z.string().optional(),
    twitterURL: z.string().optional(),
    uploadURL: z.string().optional(),
    otherBusinessURL: z.string().optional(),
    aboutUs: z.string().min(1, "About section is required"),
    skills: z.array(z.string()).min(1, "At least one skill is required"),
    experiences: z.array(
        z.object({
            position: z.string().min(1, "Position is required"),
            company: z.string().min(1, "Company is required"),
            duration: z.string().min(1, "Duration is required"),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            country: z.string().optional(),
            city: z.string().optional(),
            zipCode: z.string().optional(),
            organization: z.string().optional(),
            availabilityToStart: z.string().optional(),
            jobCategories: z.string().optional(),
        }),
    ),
    educationList: z.array(
        z.object({
            degree: z.string().min(1, "Degree is required"),
            institution: z.string().min(1, "Institution is required"),
            year: z.string().min(1, "Year is required"),
            city: z.string().optional(),
            state: z.string().optional(),
            fieldOfStudy: z.string().optional(),
            graduationMonth: z.string().optional(),
        }),
    ),
    awardsAndHonors: z.array(
        z.object({
            title: z.string().min(1, "Award title is required"),
            year: z.string().min(1, "Year is required"),
            programName: z.string().optional(),
            programDate: z.string().optional(),
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
    const [videoFile, setVideoFile] = useState<File | null>(null)

    const form = useForm<ResumeFormData>({
        resolver: zodResolver(resumeSchema),
        defaultValues: {
            type: "candidate",
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            aboutUs: "",
            skills: [],
            experiences: [{ position: "", company: "", duration: "" }],
            educationList: [{ degree: "", institution: "", year: "" }],
            awardsAndHonors: [{ title: "", year: "" }],
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSuccess: (data: any) => {
            console.log("Resume created successfully:", data)
            // Handle success (e.g., show toast, redirect)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            if (error instanceof Error) {
                console.log(error.message)
            }
            console.error("Error creating resume:", error)
        },
    })

    // Fetch countries on component mount
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch("https://countriesnow.space/api/v0.1/countries")
                const data = await response.json()
                if (!data.error) {
                    setCountries(data.data)
                }
            } catch (error) {
                console.error("Error fetching countries:", error)
            }
        }
        fetchCountries()
    }, [])

    // Fetch cities when country is selected
    useEffect(() => {
        const fetchCities = async () => {
            if (!selectedCountry) return
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
            }
        }
        fetchCities()
    }, [selectedCountry])

    // Filter skills based on search
    useEffect(() => {
        if (skillSearch.length >= 2) {
            const filtered = DUMMY_SKILLS.filter(
                (skill) => skill.toLowerCase().includes(skillSearch.toLowerCase()) && !selectedSkills.includes(skill),
            )
            setFilteredSkills(filtered)
        } else {
            setFilteredSkills([])
        }
    }, [skillSearch, selectedSkills])

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
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
            // Here you would typically upload the video to your API
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

    const onSubmit = (data: ResumeFormData) => {
        const formData = new FormData()

        // Prepare resume data
        const resumeData = {
            type: data.type,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            skills: data.skills,
        }

        formData.append("resume", JSON.stringify(resumeData))
        formData.append("experiences", JSON.stringify(data.experiences))
        formData.append("educationList", JSON.stringify(data.educationList))
        formData.append("awardsAndHonors", JSON.stringify(data.awardsAndHonors))
        formData.append("aboutUs", data.aboutUs)

        // Add photo if uploaded
        const photoInput = document.getElementById("photo") as HTMLInputElement
        if (photoInput?.files?.[0]) {
            formData.append("photo", photoInput.files[0])
        }

        createResumeMutation.mutate(formData)
    }

    return (
        <div className="space-y-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Upload Your Elevator Pitch */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Your Elevator Pitch</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Upload a 60 second elevator video pitch introducing your agency and what makes you stand out from the
                                rest.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-black text-white">
                                <Upload className="mx-auto h-12 w-12 mb-4" />
                                <p className="text-lg mb-2">Drop your video here</p>
                                <p className="text-sm mb-4">or</p>
                                <Label htmlFor="video-upload" className="cursor-pointer">
                                    <Button type="button" variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Choose File
                                    </Button>
                                    <Input
                                        id="video-upload"
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={handleVideoUpload}
                                    />
                                </Label>
                                {videoFile && <p className="mt-2 text-sm text-green-400">Selected: {videoFile.name}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* About Us */}
                    <Card>
                        <CardContent className="pt-6">
                            <FormField
                                control={form.control}
                                name="aboutUs"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>About Us*</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Write your description here and tell us"
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                                        <SelectValue placeholder="Select" />
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
                                                <Input placeholder="Enter your first name" {...field} />
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
                                                <Input placeholder="Enter your last name" {...field} />
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
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Country" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {cities.map((city) => (
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
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country*</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={(value : string) => {
                                                        field.onChange(value)
                                                        setSelectedCountry(value)
                                                    }}
                                                    defaultValue={field.value}
                                                >
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
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address*</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="Enter your Email Address" {...field} />
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
                                                <div className="flex">
                                                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                                        <span className="text-sm">🇺🇸</span>
                                                    </div>
                                                    <Input placeholder="Enter phone number" className="rounded-l-none" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="websiteURL"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your Website URL" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="linkedinURL"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>LinkedIn URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your LinkedIn URL" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="twitterURL"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Twitter URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your Twitter URL" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="uploadURL"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Upload URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your Upload URL" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="md:col-span-2 lg:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name="otherBusinessURL"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Other Business URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your Other Business URL" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div className="mt-6">
                                <Label>Photo</Label>
                                <div className="flex items-start gap-4 mt-2">
                                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
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
                                    <Label htmlFor="photo" className="cursor-pointer">
                                        <Button type="button" variant="outline">
                                            Choose File
                                        </Button>
                                        <Input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </Label>
                                </div>
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
                                <div className="relative">
                                    <Input
                                        placeholder="Search and add skills"
                                        value={skillSearch}
                                        onChange={(e) => setSkillSearch(e.target.value)}
                                    />
                                    {filteredSkills.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {filteredSkills.map((skill) => (
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
                                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
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
                                                        <Input placeholder="Enter company name" {...field} />
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
                                                        <Input placeholder="Enter job title" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`experiences.${index}.firstName`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>First Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter first name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`experiences.${index}.lastName`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Last Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter last name" {...field} />
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
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Month" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 12 }, (_, i) => (
                                                                    <SelectItem key={i + 1} value={`${i + 1}`}>
                                                                        {new Date(0, i).toLocaleString("default", { month: "long" })}
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
                                            name={`experiences.${index}.endDate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End Date</FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Year" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 30 }, (_, i) => (
                                                                    <SelectItem key={2024 - i} value={`${2024 - i}`}>
                                                                        {2024 - i}
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
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select City" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {cities.map((city) => (
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
                                            name={`experiences.${index}.zipCode`}
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

                                        <FormField
                                            control={form.control}
                                            name={`experiences.${index}.availabilityToStart`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Availability to Start</FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="immediately">Immediately</SelectItem>
                                                                <SelectItem value="1-week">1 Week</SelectItem>
                                                                <SelectItem value="2-weeks">2 Weeks</SelectItem>
                                                                <SelectItem value="1-month">1 Month</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`experiences.${index}.jobCategories`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Job Categories</FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="technology">Technology</SelectItem>
                                                                <SelectItem value="marketing">Marketing</SelectItem>
                                                                <SelectItem value="design">Design</SelectItem>
                                                                <SelectItem value="sales">Sales</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name={`experiences.${index}.organization`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Organization</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Write here" {...field} />
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
                                onClick={() => appendExperience({ position: "", company: "", duration: "" })}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add more
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Education */}
                    <Card>
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
                                                        <Input placeholder="e.g. Stanford" {...field} />
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
                                                        <Input placeholder="e.g. San Francisco" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`educationList.${index}.state`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>State</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. California" {...field} />
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
                                                    <FormLabel>Select A Degree</FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Degree" />
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
                                            name={`educationList.${index}.graduationMonth`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Graduation Date</FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Month" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 12 }, (_, i) => (
                                                                    <SelectItem key={i + 1} value={`${i + 1}`}>
                                                                        {new Date(0, i).toLocaleString("default", { month: "long" })}
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
                                onClick={() => appendEducation({ degree: "", institution: "", year: "" })}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add more
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Awards and Honours */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Awards and Honours</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                For recognitions that you are in a few impactful sentences.
                            </p>
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
                                                        <Input placeholder="Write here" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

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
                                            name={`awardsAndHonors.${index}.programDate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Program Date</FormLabel>
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
                                                    <FormLabel>Year</FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Year" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 30 }, (_, i) => (
                                                                    <SelectItem key={2024 - i} value={`${2024 - i}`}>
                                                                        {2024 - i}
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
                                onClick={() => appendAward({ title: "", year: "" })}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add more
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                        disabled={createResumeMutation.isPending}
                    >
                        {createResumeMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
