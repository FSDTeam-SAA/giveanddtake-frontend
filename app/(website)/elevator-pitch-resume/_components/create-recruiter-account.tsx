"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import apiClient from "@/lib/api-service"

interface FormData {
  firstName: string
  lastName: string
  sureName: string
  emailAddress: string
  phoneNumber: string
  title: string
  bio: string
  location: string
  country: string
  city: string
  zipCode: string
  upworkUrl: string
  linkedIn: string
  xLink: string
  OtherLink: string
  companyId: string
  roleAtCompany: string
  awards: Array<{
    awardTitle: string
    programName: string
    programDate: string
    awardDescription: string
  }>
  photo?: File
  videoFile?: File
  userId?: string
}

interface Country {
  country: string
  cities: string[]
}

export default function CreateRecruiterAccountForm() {
  const { data: session, status: sessionStatus } = useSession()
  const userId = session?.user?.id
  const token = session?.accessToken

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    sureName: "",
    emailAddress: "",
    phoneNumber: "",
    title: "",
    bio: "",
    location: "",
    country: "",
    city: "",
    zipCode: "",
    upworkUrl: "",
    linkedIn: "",
    xLink: "",
    OtherLink: "",
    companyId: "",
    roleAtCompany: "",
    awards: [
      {
        awardTitle: "",
        programName: "",
        programDate: "",
        awardDescription: "",
      },
    ],
    userId: userId || "",
  })

  useEffect(() => {
    if (userId) {
      setFormData((prev) => ({ ...prev, userId }))
    }
  }, [userId])

  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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

  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.country) return
      setIsLoadingCities(true)
      try {
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country: formData.country }),
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
  }, [formData.country])

  const createRecruiterAccount = async (formData: FormData) => {
    const data = new FormData()

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "companyId") {
        return
      }
      if (key === "awards") {
        data.append(key, JSON.stringify(value))
      } else if (key === "photo" || key === "videoFile") {
        if (value instanceof File) {
          data.append(key, value)
        }
      } else if (value !== undefined && value !== null) {
        data.append(key, String(value))
      }
    })

    const response = await apiClient.post("/recruiter/recruiter-account", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  }

  const mutation = useMutation({
    mutationFn: createRecruiterAccount,
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Recruiter account created successfully",
      })
      console.log("Account created:", data)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create recruiter account",
        variant: "destructive",
      })
      console.error("Error:", error)
    },
  })

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (field: "photo" | "videoFile", file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file || undefined }))
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileChange("videoFile", file)
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileChange("photo", file)
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    }
  }

  const handleAwardChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      awards: prev.awards.map((award, i) => (i === index ? { ...award, [field]: value } : award)),
    }))
  }

  const addAward = () => {
    setFormData((prev) => ({
      ...prev,
      awards: [
        ...prev.awards,
        {
          awardTitle: "",
          programName: "",
          programDate: "",
          awardDescription: "",
        },
      ],
    }))
  }

  const removeAward = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submissionData = { ...formData, userId: userId || formData.userId }
    mutation.mutate(submissionData)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Create Recruiter Account</h1>
        <Button variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
          Continue with Google
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-medium">Upload Your Elevator Pitch (Optional)</CardTitle>
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
                <video src={videoPreview} controls className="mx-auto max-w-md rounded-lg" />
                <p className="text-sm text-green-400">Video uploaded: {formData.videoFile?.name}</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Profile Photo</Label>
              <div className="mt-2 flex items-center gap-4">
                {photoPreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Photo uploaded: {formData.photo?.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-1 bg-transparent"
                        onClick={() => document.getElementById("photo-upload")?.click()}
                      >
                        Change Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("photo-upload")?.click()}
                    >
                      Upload Photo
                    </Button>
                  </div>
                )}
                <Input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
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
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="mt-1"
                  required
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
                  onChange={(e) => handleInputChange("emailAddress", e.target.value)}
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
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
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
                <Label htmlFor="location" className="text-sm font-medium">
                  Years of Experience
                </Label>
                <Select>
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

            <div>
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                rows={4}
                className="mt-1"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="country" className="text-sm font-medium">
                  Country
                </Label>
                <Select onValueChange={(value) => handleInputChange("country", value)} disabled={isLoadingCountries}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isLoadingCountries ? "Loading..." : "Select Country"} />
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
                    <SelectValue placeholder={isLoadingCities ? "Loading..." : "Select City"} />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="upworkUrl" className="text-sm font-medium">
                  Upwork
                </Label>
                <Input
                  id="upworkUrl"
                  value={formData.upworkUrl}
                  onChange={(e) => handleInputChange("upworkUrl", e.target.value)}
                  className="mt-1"
                  placeholder="https://upwork.com/..."
                />
              </div>
              <div>
                <Label htmlFor="linkedIn" className="text-sm font-medium">
                  LinkedIn
                </Label>
                <Input
                  id="linkedIn"
                  value={formData.linkedIn}
                  onChange={(e) => handleInputChange("linkedIn", e.target.value)}
                  className="mt-1"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="xLink" className="text-sm font-medium">
                  X
                </Label>
                <Input
                  id="xLink"
                  value={formData.xLink}
                  onChange={(e) => handleInputChange("xLink", e.target.value)}
                  className="mt-1"
                  placeholder="https://x.com/..."
                />
              </div>
              <div>
                <Label htmlFor="OtherLink" className="text-sm font-medium">
                  Other
                </Label>
                <Input
                  id="OtherLink"
                  value={formData.OtherLink}
                  onChange={(e) => handleInputChange("OtherLink", e.target.value)}
                  className="mt-1"
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Company Details <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyId" className="text-sm font-medium">
                  Company
                </Label>
                <Input
                  id="companyId"
                  value={formData.companyId}
                  onChange={(e) => handleInputChange("companyId", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="roleAtCompany" className="text-sm font-medium">
                  Website
                </Label>
                <Input
                  id="roleAtCompany"
                  value={formData.roleAtCompany}
                  onChange={(e) => handleInputChange("roleAtCompany", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Country</Label>
                <Select>
                  <SelectTrigger className="mt-1">
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
              </div>
              <div>
                <Label className="text-sm font-medium">City</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="city1">City 1</SelectItem>
                    <SelectItem value="city2">City 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">State</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="state1">State 1</SelectItem>
                    <SelectItem value="state2">State 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Industry</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Company Size</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Company Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="200+">200+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Company Awards and Honours</CardTitle>
              <Button
                type="button"
                onClick={addAward}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.awards.map((award, index) => (
              <div key={index} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Award {index + 1}</h4>
                  {formData.awards.length > 1 && (
                    <Button type="button" onClick={() => removeAward(index)} variant="ghost" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`awardTitle-${index}`} className="text-sm font-medium">
                      Award Title
                    </Label>
                    <Input
                      id={`awardTitle-${index}`}
                      value={award.awardTitle}
                      onChange={(e) => handleAwardChange(index, "awardTitle", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`programName-${index}`} className="text-sm font-medium">
                      Program Name
                    </Label>
                    <Input
                      id={`programName-${index}`}
                      value={award.programName}
                      onChange={(e) => handleAwardChange(index, "programName", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`programDate-${index}`} className="text-sm font-medium">
                      Award Date
                    </Label>
                    <Input
                      id={`programDate-${index}`}
                      type="date"
                      value={award.programDate}
                      onChange={(e) => handleAwardChange(index, "programDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div></div>
                </div>
                <div>
                  <Label htmlFor={`awardDescription-${index}`} className="text-sm font-medium">
                    Award Description
                  </Label>
                  <Textarea
                    id={`awardDescription-${index}`}
                    value={award.awardDescription}
                    onChange={(e) => handleAwardChange(index, "awardDescription", e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                {index < formData.awards.length - 1 && <hr className="border-gray-200" />}
              </div>
            ))}
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
  )
}
