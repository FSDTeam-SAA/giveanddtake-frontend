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
import { EmployeeSelector } from "@/components/company/employee-selector";
import { useSession } from "next-auth/react";

const formSchema = z.object({
  cname: z.string().min(1, "Company name is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  zipcode: z.string().min(1, "Zip code is required"),
  cemail: z.string().email("Invalid email address"),
  cPhoneNumber: z.string().min(1, "Phone number is required"),
  aboutUs: z.string().min(1, "About us is required"),
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
  _id?: string; // Backend ID for existing honors
  title: string;
  issuer: string;
  programeDate: string;
  description: string;
  isNew?: boolean; // Track if this is a new honor
  isDeleted?: boolean; // Track if this honor should be deleted
}

function EditCompanyPage({ companyId }: EditCompanyPageProps) {
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
    },
  });

  const sesison = useSession();
  const token = sesison?.data?.accessToken || "";

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

      form.reset({
        cname: company.cname || "",
        country: company.country || "",
        city: company.city || "",
        zipcode: company.zipcode || "",
        cemail: company.cemail || "",
        cPhoneNumber: company.cPhoneNumber || "",
        aboutUs: company.aboutUs || "",
      });

      if (company.links && company.links.length > 0) {
        setSocialLinks(
          company.links.map((link: string, index: number) => ({
            id: `${index + 1}`,
            url: link,
          }))
        );
      }

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
      if (key === "honors") {
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

  const uploadElevatorPitch = async (file: File) => {
    const formData = new FormData();
    formData.append("video", file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/company/${companyId}/elevator-pitch`,
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

      const slinks = socialLinks
        .map((link) => link.url.trim())
        .filter((url) => url !== "");

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

      console.log("Processed honors for backend:", allHonors);

      const formData = {
        ...data,
        links: slinks,
        service: filteredServices,
        employeesId: selectedEmployees,
        honors: allHonors,
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

  console.log("companyData", honors);
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                      <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium rounded-lg">
                        photo/Company logo
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

                {/* <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900">
                        Industry*
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
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
                /> */}
              </div>

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
                                  updateHonor(
                                    honor.id,
                                    "issuer",
                                    e.target.value
                                  )
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
                                  updateHonor(
                                    honor.id,
                                    "programeDate",
                                    e.target.value
                                  )
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

export default EditCompanyPage;
