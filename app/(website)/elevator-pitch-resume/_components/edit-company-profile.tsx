"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { FileUpload } from "@/components/company/file-upload";

const formSchema = z.object({
  cname: z.string().min(1, "Company name is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  zipcode: z.string().min(1, "Zip code is required"),
  cemail: z.string().email("Invalid email address"),
  cPhoneNumber: z.string().min(1, "Phone number is required"),
  aboutUs: z.string().min(1, "About us is required"),
  industry: z.string().min(1, "Industry is required"),
  linkedin: z.string().optional().or(z.literal("")),
  twitter: z.string().optional().or(z.literal("")),
  upwork: z.string().optional().or(z.literal("")),
  otherBusiness: z.string().optional().or(z.literal("")),
  otherProfessional: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface EditCompanyPageProps {
  companyId: string;
}

const fetchCompany = async (companyId: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/company/user/${companyId}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch company");
  }
  return response.json();
};

const updateCompany = async (companyId: string, data: any) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update company");
  }

  return response.json();
};

const uploadElevatorPitch = async (companyId: string, file: File) => {
  const formData = new FormData();
  formData.append("video", file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyId}/elevator-pitch`,
    {
      method: "PUT",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload elevator pitch");
  }

  return response.json();
};

export default function EditCompanyPage({ companyId }: EditCompanyPageProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [websites, setWebsites] = useState<string[]>([""]);
  const [services, setServices] = useState<string[]>([""]);
  const [awards, setAwards] = useState([
    {
      title: "",
      issuer: "",
      issueDate: "",
      description: "",
    },
  ]);

  const { data: companyData, isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => fetchCompany(companyId),
    enabled: !!companyId,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: (data: any) => {
      if (!companyData?.companies?.[0]?._id) {
        throw new Error("Company ID not found");
      }
      return updateCompany(companyData.companies[0]._id, data);
    },
    onSuccess: () => {
      toast.success("Company updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update company");
    },
  });

  const uploadElevatorPitchMutation = useMutation({
    mutationFn: (file: File) => uploadElevatorPitch(companyId, file),
    onSuccess: () => {
      toast.success("Elevator pitch updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload video");
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cname: "",
      country: "",
      city: "",
      zipcode: "",
      cemail: "",
      cPhoneNumber: "",
      aboutUs: "",
      industry: "",
      linkedin: "",
      twitter: "",
      upwork: "",
      otherBusiness: "",
      otherProfessional: "",
    },
  });

  useEffect(() => {
    if (companyData?.companies?.[0]) {
      const company = companyData.companies[0];
      form.reset({
        cname: company.cname || "",
        country: company.country || "",
        city: company.city || "",
        zipcode: company.zipcode || "",
        cemail: company.cemail || "",
        cPhoneNumber: company.cPhoneNumber || "",
        aboutUs: company.aboutUs || "",
        industry: company.industry || "",
        linkedin: company.linkedin || "",
        twitter: company.twitter || "",
        upwork: company.upwork || "",
        otherBusiness: company.otherBusiness || "",
        otherProfessional: company.otherProfessional || "",
      });

      // Populate other fields
      if (company.links) setWebsites(company.links);
      if (company.service) setServices(company.service);
      if (company.employeesId) setSelectedEmployees(company.employeesId);
      if (companyData.honors) {
        setAwards(
          companyData.honors.map((honor: any) => ({
            title: honor.title || "",
            issuer: honor.issuer || "",
            issueDate: honor.issueDate || "",
            description: honor.description || "",
          }))
        );
      }
    }
  }, [companyData, form]);

  const addAward = () => {
    setAwards([
      ...awards,
      { title: "", issuer: "", issueDate: "", description: "" },
    ]);
  };

  const removeAward = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index));
  };

  const updateAward = (index: number, field: string, value: string) => {
    const updatedAwards = [...awards];
    updatedAwards[index] = { ...updatedAwards[index], [field]: value };
    setAwards(updatedAwards);
  };

  const onSubmit = async (data: FormData) => {
    const formData = {
      ...data,
      websites,
      services,
      selectedEmployees,
      awards,
    };

    try {
      await updateCompanyMutation.mutateAsync(formData);

      if (elevatorPitchFile) {
        await uploadElevatorPitchMutation.mutateAsync(elevatorPitchFile);
      }
    } catch (error) {
      console.error("Error updating company:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading company data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Edit Company Profile
            </h1>
            <p className="text-gray-600">
              Update your company information and settings
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Elevator Pitch Upload */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Update Company Elevator Pitch
                    </h2>
                    <p className="text-sm text-gray-600 max-w-2xl">
                      Upload a 60-second elevator video pitch introducing your
                      company and what should make candidates want to join you!
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    Upload/Change Elevator Pitch
                  </Button>
                </div>

                <FileUpload
                  onFileSelect={setElevatorPitchFile}
                  accept="video/*"
                  maxSize={100 * 1024 * 1024}
                  variant="dark"
                />
              </div>

              {/* Company Logo and About */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">
                    Company Logo
                  </Label>
                  <div className="aspect-square">
                    <FileUpload
                      onFileSelect={setLogoFile}
                      accept="image/*"
                      className="h-full"
                    >
                      <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium rounded-lg">
                        photo/recruiter logo
                      </div>
                    </FileUpload>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-2">
                  <FormField
                    control={form.control}
                    name="aboutUs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          About Us*
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Write your description here (400 words)"
                            className="min-h-[140px] resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Company Details */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="cname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900">
                        Company Name*
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your Company Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          Country*
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="usa">USA</SelectItem>
                            <SelectItem value="canada">Canada</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                            <SelectItem value="germany">Germany</SelectItem>
                            <SelectItem value="france">France</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          City*
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select City" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new-york">New York</SelectItem>
                            <SelectItem value="los-angeles">
                              Los Angeles
                            </SelectItem>
                            <SelectItem value="chicago">Chicago</SelectItem>
                            <SelectItem value="houston">Houston</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          Zip Code / Postal Code*
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Enter code" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="10001">10001</SelectItem>
                            <SelectItem value="90210">90210</SelectItem>
                            <SelectItem value="60601">60601</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cemail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          Email Address*
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter Your Email Address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cPhoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          Phone number*
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="+1 (555) 234567 2340"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900">
                        Industry*
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Social Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          LinkedIn
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter LinkedIn URL" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          Twitter
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter Twitter URL" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="upwork"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          Upwork
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter Upwork URL" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="otherProfessional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          Other Professional Website
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter Website Address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="otherBusiness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900">
                        Other Business
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Business URL" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                  disabled={updateCompanyMutation.isPending}
                >
                  {updateCompanyMutation.isPending
                    ? "Updating..."
                    : "Update Company"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="px-8 py-3 bg-transparent"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
