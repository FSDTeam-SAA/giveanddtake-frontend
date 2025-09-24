// pages/EditCompanyPage.tsx
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
import { FileUpload } from "@/components/company/file-upload";
import { EmployeeSelector } from "@/components/company/employee-selector";
import { useSession } from "next-auth/react";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import { SocialLinksSection } from "./social-links-section";
import { useRouter } from "next/navigation";

// Fixed platforms for SocialLinksSection
const FIXED_PLATFORMS = [
  "LinkedIn",
  "Twitter",
  "Upwork",
  "Facebook",
  "TikTok",
  "Instagram",
] as const;

// Form schema with sLink
const formSchema = z.object({
  cname: z.string().min(1, "Company name is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  zipcode: z.string().min(1, "Zip code is required"),
  cemail: z.string().email("Invalid email address"),
  cPhoneNumber: z.string().min(1, "Phone number is required"),
  aboutUs: z.string().min(1, "About us is required"),
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
});

type FormData = z.infer<typeof formSchema>;

interface EditCompanyPageProps {
  companyId: string;
}

interface Honor {
  id: string;
  _id?: string;
  title: string;
  issuer: string;
  programeDate: string;
  description: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

function EditCompanyPage({ companyId }: EditCompanyPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([""]);
  const [honors, setHonors] = useState<Honor[]>([
    {
      id: "1",
      title: "",
      issuer: "",
      programeDate: "",
      description: "",
      isNew: true,
    },
  ]);
  const [originalHonors, setOriginalHonors] = useState<Honor[]>([]);

  const router = useRouter();

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
      sLink: FIXED_PLATFORMS.map((label) => ({
        label,
        url: "",
      })),
    },
  });

  const session = useSession();
  const token = session?.data?.accessToken || "";

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

  useEffect(() => {
    if (companyData?.data?.companies?.[0]) {
      const company = companyData.data.companies[0];

      // Map API sLink to fixed platforms
      const sLink = FIXED_PLATFORMS.map((label) => {
        const matchingLink = company.sLink?.find(
          (link: { label: string; url: string; _id: string }) => link.label === label
        );
        return {
          _id: matchingLink?._id,
          label,
          url: matchingLink?.url || "",
          type: matchingLink?._id ? "update" : "create",
        };
      });

      form.reset({
        cname: company.cname || "",
        country: company.country || "",
        city: company.city || "",
        zipcode: company.zipcode || "",
        cemail: company.cemail || "",
        cPhoneNumber: company.cPhoneNumber || "",
        aboutUs: company.aboutUs || "",
        sLink,
      });

      if (company.service && company.service.length > 0) {
        setServices(company.service);
      }

      if (company.employeesId) {
        setSelectedEmployees(company.employeesId);
      }
    }

    if (companyData?.data?.honors && companyData.data.honors.length > 0) {
      const loadedHonors = companyData.data.honors.map(
        (honor: any, index: number) => ({
          id: `existing-${index}`,
          _id: honor._id,
          title: honor.title || "",
          issuer: honor.issuer || "",
          programeDate: honor.programeDate
            ? new Date(honor.programeDate).toISOString().split("T")[0]
            : "",
          description: honor.description || "",
          isNew: false,
        })
      );
      setHonors(loadedHonors);
      setOriginalHonors([...loadedHonors]);
    }
  }, [companyData, form]);

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

  const addHonor = () => {
    setHonors([
      ...honors,
      {
        id: `new-${Date.now()}`,
        title: "",
        issuer: "",
        programeDate: "",
        description: "",
        isNew: true,
      },
    ]);
  };

  const removeHonor = (id: string) => {
    const honorToRemove = honors.find((h) => h.id === id);

    if (honorToRemove?.isNew) {
      setHonors(honors.filter((honor) => honor.id !== id));
    } else {
      setHonors(
        honors.map((honor) =>
          honor.id === id ? { ...honor, isDeleted: true } : honor
        )
      );
    }
  };

  const updateHonor = (
    id: string,
    field: "title" | "issuer" | "programeDate" | "description",
    value: string
  ) => {
    setHonors(
      honors.map((honor) =>
        honor.id === id ? { ...honor, [field]: value } : honor
      )
    );
  };

  const updateCompany = async (data: any) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key === "honors" || key === "sLink") {
        formData.append(key, JSON.stringify(data[key]));
      } else if (Array.isArray(data[key])) {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    if (logoFile) {
      formData.append("clogo", logoFile);
    }

    if (bannerFile) {
      formData.append("banner", bannerFile);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/company/${companyData.data.companies[0]._id}`,
      {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update company");
    }

    return response.json();
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsUpdating(true);

      const filteredServices = services
        .map((service) => service.trim())
        .filter((service) => service !== "");

      const processedHonors = honors
        .filter((honor) => !honor.isDeleted)
        .filter(
          (honor) =>
            honor.title.trim() !== "" || honor.description.trim() !== ""
        )
        .map((honor) => {
          const baseHonor = {
            title: honor.title.trim(),
            issuer: honor.issuer.trim(),
            programeDate: honor.programeDate,
            description: honor.description.trim(),
          };

          if (honor.isNew) {
            return {
              ...baseHonor,
              type: "create",
            };
          } else {
            const original = originalHonors.find(
              (orig) => orig._id === honor._id
            );
            const isModified =
              !original ||
              original.title !== honor.title ||
              original.issuer !== honor.issuer ||
              original.programeDate !== honor.programeDate ||
              original.description !== honor.description;

            return {
              ...baseHonor,
              _id: honor._id,
              type: isModified ? "update" : "update",
            };
          }
        });

      const deletedHonors = originalHonors
        .filter((original) => {
          const stillExists = honors.find(
            (h) => h._id === original._id && !h.isDeleted
          );
          return !stillExists;
        })
        .map((honor) => ({
          _id: honor._id,
          type: "delete",
        }));

      const allHonors = [...processedHonors, ...deletedHonors];

      // Process social links
      const originalSLinks = companyData?.data?.companies[0]?.sLink || [];
      const processedSocialLinks = data.sLink.map((link) => {
        const originalLink = originalSLinks.find(
          (orig: { _id: string; label: string; url: string }) => orig._id === link._id || orig.label === link.label
        );
        return {
          _id: link._id,
          type: link._id
            ? link.url
              ? "update"
              : "delete"
            : "create",
          label: link.label,
          url: link.url || "",
        };
      });

      const formData = {
        ...data,
        sLink: processedSocialLinks,
        service: filteredServices,
        employeesId: selectedEmployees,
        honors: allHonors,
      };

      await updateCompany(formData);
      toast.success("Company updated successfully!");
      router.push("/elevator-pitch-resume");
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
    <div className="">
      <div className="container mx-auto px-2">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-16">
            <h1 className="text-[48px] font-bold text-[#131313] mb-2 text-center">
              Edit Company/Business Account
            </h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Company Banner
                </Label>
                <div className="aspect-[4/1]">
                  <FileUpload
                    onFileSelect={setBannerFile}
                    defaultUrl={companyData.data.companies[0].banner}
                    accept="image/*"
                    className="h-full"
                  >
                    <div className="w-full h-full bg-primary text-white flex items-center justify-center text-sm font-medium rounded-lg">
                      Company Banner
                    </div>
                  </FileUpload>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">
                    Company Logo
                  </Label>
                  <div className="aspect-square">
                    <FileUpload
                      onFileSelect={setLogoFile}
                      defaultUrl={companyData.data.companies[0].clogo}
                      accept="image/*"
                      className="h-full"
                    >
                      <div className="w-full h-full bg-primary text-white flex items-center justify-center text-sm font-medium rounded-lg">
                        Company Logo
                      </div>
                    </FileUpload>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <FormField
                    control={form.control}
                    name="aboutUs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          About Us*
                        </FormLabel>
                        <FormControl>
                          <TextEditor
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

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
                          <Input
                            {...field}
                            placeholder="Enter Zip/Postal Code"
                          />
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
              </div>

              {/* Social Links Section */}
              <SocialLinksSection form={form} />

              <div className="space-y-4">
                <div className="">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Services
                  </h3>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addService}
                  className="flex items-center gap-2 bg-transparent"
                >
                  Add more
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  View your company employees
                </h3>
                <EmployeeSelector
                  selectedEmployees={selectedEmployees}
                  onEmployeesChange={setSelectedEmployees}
                  companyUserId={companyId}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Company Awards and Honours
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
                  {honors
                    .filter((honor) => !honor.isDeleted)
                    .map((honor) => (
                      <div
                        key={honor.id}
                        className={`space-y-3 ${
                          honor.isNew ? "border-l-4 border-green-500 pl-4" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            Honor/Award
                            {honor.isNew && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                New
                              </span>
                            )}
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHonor(honor.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Award Title
                            </Label>
                            <Input
                              value={honor.title}
                              onChange={(e) =>
                                updateHonor(honor.id, "title", e.target.value)
                              }
                              placeholder="Award/Honor Title"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Award Issuer
                              </Label>
                              <Input
                                value={honor.issuer}
                                onChange={(e) =>
                                  updateHonor(honor.id, "issuer", e.target.value)
                                }
                                placeholder="Award/Honor Issuer"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Award Date
                              </Label>
                              <Input
                                type="date"
                                value={honor.programeDate}
                                onChange={(e) =>
                                  updateHonor(honor.id, "programeDate", e.target.value)
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Award Short Description
                            </Label>
                            <Textarea
                              value={honor.description}
                              onChange={(e) =>
                                updateHonor(honor.id, "description", e.target.value)
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

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-blue-700 text-white py-3 text-lg font-medium"
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

export default EditCompanyPage;