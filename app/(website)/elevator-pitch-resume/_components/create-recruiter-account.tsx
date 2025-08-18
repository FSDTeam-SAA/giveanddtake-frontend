"use client"

import type React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
}

const createRecruiterAccount = async (formData: FormData) => {
  const data = new FormData()

  // Add all text fields
  Object.entries(formData).forEach(([key, value]) => {
    if (key === "awards") {
      data.append(key, JSON.stringify(value))
    } else if (key === "photo" || key === "videoFile") {
      if (value) data.append(key, value)
    } else {
      data.append(key, value as string)
    }
  })

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/recruiter/recruiter-account`, {
    method: "POST",
    body: data,
  })

  if (!response.ok) {
    throw new Error("Failed to create recruiter account")
  }

  return response.json()
}

export default function CreateRecruiterAccount() {

    
  const { toast } = useToast()
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
    awards: [{ awardTitle: "", programName: "", programDate: "", awardDescription: "" }],
  })

  const mutation = useMutation({
    mutationFn: createRecruiterAccount,
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Recruiter account created successfully",
      })
      console.log("Account created:", data)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create recruiter account",
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

  const handleAwardChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      awards: prev.awards.map((award, i) => (i === index ? { ...award, [field]: value } : award)),
    }))
  }

  const addAward = () => {
    setFormData((prev) => ({
      ...prev,
      awards: [...prev.awards, { awardTitle: "", programName: "", programDate: "", awardDescription: "" }],
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
    mutation.mutate(formData)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Create Recruiter Account</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Elevator Pitch Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Your Elevator Pitch (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-900">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">Drop your video here</p>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange("videoFile", e.target.files?.[0] || null)}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload">
                <Button type="button" variant="outline" className="cursor-pointer bg-transparent">
                  Choose File
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="sureName">Sure Name</Label>
              <Input
                id="sureName"
                value={formData.sureName}
                onChange={(e) => handleInputChange("sureName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="emailAddress">Email Address</Label>
              <Input
                id="emailAddress"
                type="email"
                value={formData.emailAddress}
                onChange={(e) => handleInputChange("emailAddress", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Current Position</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select onValueChange={(value) => handleInputChange("country", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USA">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="photo">Profile Photo</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange("photo", e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="upworkUrl">Upwork URL</Label>
              <Input
                id="upworkUrl"
                value={formData.upworkUrl}
                onChange={(e) => handleInputChange("upworkUrl", e.target.value)}
                placeholder="https://upwork.com/..."
              />
            </div>
            <div>
              <Label htmlFor="linkedIn">LinkedIn</Label>
              <Input
                id="linkedIn"
                value={formData.linkedIn}
                onChange={(e) => handleInputChange("linkedIn", e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <Label htmlFor="xLink">X (Twitter)</Label>
              <Input
                id="xLink"
                value={formData.xLink}
                onChange={(e) => handleInputChange("xLink", e.target.value)}
                placeholder="https://x.com/..."
              />
            </div>
            <div>
              <Label htmlFor="OtherLink">Other Link</Label>
              <Input
                id="OtherLink"
                value={formData.OtherLink}
                onChange={(e) => handleInputChange("OtherLink", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                value={formData.companyId}
                onChange={(e) => handleInputChange("companyId", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="roleAtCompany">Role at Company</Label>
              <Input
                id="roleAtCompany"
                value={formData.roleAtCompany}
                onChange={(e) => handleInputChange("roleAtCompany", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Awards and Honours */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Company Awards and Honours</CardTitle>
              <Button type="button" onClick={addAward} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Award
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.awards.map((award, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
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
                    <Label htmlFor={`awardTitle-${index}`}>Award Title</Label>
                    <Input
                      id={`awardTitle-${index}`}
                      value={award.awardTitle}
                      onChange={(e) => handleAwardChange(index, "awardTitle", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`programName-${index}`}>Program Name</Label>
                    <Input
                      id={`programName-${index}`}
                      value={award.programName}
                      onChange={(e) => handleAwardChange(index, "programName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`programDate-${index}`}>Program Date</Label>
                    <Input
                      id={`programDate-${index}`}
                      type="date"
                      value={award.programDate}
                      onChange={(e) => handleAwardChange(index, "programDate", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`awardDescription-${index}`}>Award Description</Label>
                    <Textarea
                      id={`awardDescription-${index}`}
                      value={award.awardDescription}
                      onChange={(e) => handleAwardChange(index, "awardDescription", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button type="submit" className="w-full md:w-auto px-12 py-3 text-lg" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating Account..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}
