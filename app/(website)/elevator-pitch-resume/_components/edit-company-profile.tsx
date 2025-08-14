"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
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
});

type FormData = z.infer<typeof formSchema>;

interface EditCompanyPageProps {
  companyId: string;
}

interface SocialLink {
  id: string;
  url: string;
}

interface Honor {
  id: string;
  title: string;
  description: string;
}

export default function EditCompanyPage({ companyId }: EditCompanyPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { id: "1", url: "" },
  ]);
  const [services, setServices] = useState<string[]>([""]);
  const [honors, setHonors] = useState<Honor[]>([
    { id: "1", title: "", description: "" },
  ]);

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
    },
  });

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/company/user/${companyId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch company");
        }
        const data = await response.json();
        setCompanyData(data);
      } catch (error) {
        console.error("Error fetching company:", error);
        toast.error("Failed to load company data");
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  // Load data when companyData is available
  useEffect(() => {
    if (companyData?.data?.companies?.[0]) {
      const company = companyData.data.companies[0];

      // Load form data
      form.reset({
        cname: company.cname || "",
        country: company.country || "",
        city: company.city || "",
        zipcode: company.zipcode || "",
        cemail: company.cemail || "",
        cPhoneNumber: company.cPhoneNumber || "",
        aboutUs: company.aboutUs || "",
        industry: company.industry || "",
      });

      // Load social links from API response
      if (company.links && company.links.length > 0) {
        setSocialLinks(
          company.links.map((link: string, index: number) => ({
            id: `${index + 1}`,
            url: link,
          }))
        );
      }

      // Load services
      if (company.service && company.service.length > 0) {
        setServices(company.service);
      }

      // Load employees
      if (company.employeesId) {
        setSelectedEmployees(company.employeesId);
      }
    }

    // Load honors data
    if (companyData?.data?.honors && companyData.data.honors.length > 0) {
      setHonors(
        companyData.data.honors.map((honor: any, index: number) => ({
          id: `${index + 1}`,
          title: honor.title || "",
          description: honor.description || "",
        }))
      );
    }
  }, [companyData, form]);

  // Social Links Management
  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { id: Date.now().toString(), url: "" }]);
  };

  const removeSocialLink = (id: string) => {
    if (socialLinks.length > 1) {
      setSocialLinks(socialLinks.filter((link) => link.id !== id));
    }
  };

  const updateSocialLink = (id: string, url: string) => {
    setSocialLinks(
      socialLinks.map((link) => (link.id === id ? { ...link, url } : link))
    );
  };

  // Services Management
  const addService = () => {
    setServices([...services, ""]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, value: string) => {
    const updatedServices = [...services];
    updatedServices[index] = value;
    setServices(updatedServices);
  };

  // Honors Management
  const addHonor = () => {
    setHonors([
      ...honors,
      { id: Date.now().toString(), title: "", description: "" },
    ]);
  };

  const removeHonor = (id: string) => {
    if (honors.length > 1) {
      setHonors(honors.filter((honor) => honor.id !== id));
    }
  };

  const updateHonor = (
    id: string,
    field: "title" | "description",
    value: string
  ) => {
    setHonors(
      honors.map((honor) =>
        honor.id === id ? { ...honor, [field]: value } : honor
      )
    );
  };

  const updateCompany = async (data: any) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyData.data.companies[0]._id}`,
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

  const uploadElevatorPitch = async (file: File) => {
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

  const onSubmit = async (data: FormData) => {
    try {
      setIsUpdating(true);

      // Prepare social links array (filter out empty ones)
      const slinks = socialLinks
        .map((link) => link.url.trim())
        .filter((url) => url !== "");

      // Prepare services array (filter out empty ones)
      const filteredServices = services
        .map((service) => service.trim())
        .filter((service) => service !== "");

      // Prepare honors array (filter out empty ones)
      const filteredHonors = honors
        .filter(
          (honor) =>
            honor.title.trim() !== "" || honor.description.trim() !== ""
        )
        .map((honor) => ({
          title: honor.title.trim(),
          description: honor.description.trim(),
        }));

      const formData = {
        ...data,
        links: slinks,
        service: filteredServices,
        selectedEmployees,
        honors: filteredHonors,
      };

      await updateCompany(formData);
      toast.success("Company updated successfully!");

      if (elevatorPitchFile) {
        await uploadElevatorPitch(elevatorPitchFile);
        toast.success("Elevator pitch updated successfully!");
      }
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Failed to update company");
    } finally {
      setIsUpdating(false);
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
                        <FormControl>
                          <Input {...field} placeholder="Enter Country" />
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
                        <FormLabel className="text-sm font-medium text-gray-900">
                          City*
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter City" />
                        </FormControl>
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
                        <FormControl>
                          <Input {...field} placeholder="Enter Zip Code" />
                        </FormControl>
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

              {/* Social Links - Dynamic Array */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Social Links
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSocialLink}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    Add Link
                  </Button>
                </div>

                <div className="space-y-3">
                  {socialLinks.map((link, index) => (
                    <div key={link.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          value={link.url}
                          onChange={(e) =>
                            updateSocialLink(link.id, e.target.value)
                          }
                          placeholder={`Social Link ${
                            index + 1
                          } (e.g., https://linkedin.com/company/yourcompany)`}
                        />
                      </div>
                      {socialLinks.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSocialLink(link.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Services - Dynamic Array */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Services
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addService}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    Add Service
                  </Button>
                </div>

                <div className="space-y-3">
                  {services.map((service, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          value={service}
                          onChange={(e) => updateService(index, e.target.value)}
                          placeholder={`Service ${index + 1}`}
                        />
                      </div>
                      {services.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Honors - Dynamic Array */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Honors & Awards
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addHonor}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    Add Honor
                  </Button>
                </div>

                <div className="space-y-4">
                  {honors.map((honor) => (
                    <div
                      key={honor.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Honor/Award
                        </h4>
                        {honors.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHonor(honor.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Title
                          </Label>
                          <Input
                            value={honor.title}
                            onChange={(e) =>
                              updateHonor(honor.id, "title", e.target.value)
                            }
                            placeholder="Award/Honor Title"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Description
                          </Label>
                          <Textarea
                            value={honor.description}
                            onChange={(e) =>
                              updateHonor(
                                honor.id,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Description of the award/honor"
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Company"}
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
