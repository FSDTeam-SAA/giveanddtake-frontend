"use client";

import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronsUpDown } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { JobFormData } from "@/types/job";

interface JobCategory {
  _id: string;
  name: string;
  role: string[];
  categoryIcon: string;
}

interface Country {
  country: string;
  cities: string[];
}

interface JobCategoriesResponse {
  success: boolean;
  message: string;
  data: {
    category: JobCategory[];
  };
}

interface JobDetailsStepProps {
  form: UseFormReturn<JobFormData & { compensationCurrency?: "USD" | "EUR" }>;
  onNext: () => void;
  onCancel: () => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  selectedCategoryRoles: string[];
  setSelectedCategoryRoles: (roles: string[]) => void;
  jobCategories: JobCategoriesResponse;
  categoriesLoading: boolean;
  categoriesError: string | null;
  countries: Country[];
  isLoadingCountries: boolean;
  cities: string[];
  isLoadingCities: boolean;
}

// Helpers
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const digitsOnly = (s: string) => s.replace(/[^0-9.]/g, "");

export default function JobDetailsStep({
  form,
  onNext,
  onCancel,
  selectedCountry,
  setSelectedCountry,
  selectedCategoryRoles,
  setSelectedCategoryRoles,
  jobCategories,
  categoriesLoading,
  categoriesError,
  countries,
  isLoadingCountries,
  cities,
  isLoadingCities,
}: JobDetailsStepProps) {
  // --- Compensation display state (allows $ / € and commas while storing a number) ---
  const currency = form.watch("compensationCurrency") || "USD";
  const initialComp = form.getValues("compensation");
  const [compensationDisplay, setCompensationDisplay] = useState<string>(
    typeof initialComp === "number" && !Number.isNaN(initialComp)
      ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
          initialComp
        )
      : ""
  );

  const currencySymbol = useMemo(
    () => (currency === "EUR" ? "€" : "$"),
    [currency]
  );

  return (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Job Details
        </h2>
        {categoriesError && (
          <div className="text-red-600 mb-4 text-center">
            {categoriesError}
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        )}
        <div className="space-y-6">
          {/* Job Title */}
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Job Title<span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter job title"
                    className="h-11 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Department */}
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Department
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter department"
                    className="h-11 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Country & City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Country<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "h-11 justify-between border-gray-300 focus:border-[#2B7FD0]",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? countries.find((c) => c.country === field.value)
                                ?.country
                            : "Select country"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingCountries
                              ? "Loading countries..."
                              : "No country found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {countries.map((country) => (
                              <CommandItem
                                value={country.country}
                                key={country.country}
                                onSelect={() => {
                                  form.setValue("country", country.country, {
                                    shouldValidate: true,
                                  });
                                  form.setValue("region", "", {
                                    shouldValidate: true,
                                  });
                                  setSelectedCountry(country.country);
                                }}
                              >
                                {country.country}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    City<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!selectedCountry || isLoadingCities}
                          className={cn(
                            "h-11 justify-between border-gray-300 focus:border-[#2B7FD0]",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ||
                            (isLoadingCities
                              ? "Loading cities..."
                              : "Select city")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search city..." />
                        <CommandList>
                          <CommandEmpty>No city found.</CommandEmpty>
                          <CommandGroup>
                            {cities.map((city) => (
                              <CommandItem
                                value={city}
                                key={city}
                                onSelect={() => {
                                  form.setValue("region", city, {
                                    shouldValidate: true,
                                  });
                                }}
                              >
                                {city}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Vacancies (clamped 1..50, never 0) */}
          <FormField
            control={form.control}
            name="vacancy"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Number of Vacancies
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={50}
                    step={1}
                    placeholder="Enter number of vacancies (1–50)"
                    className="h-11 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                    value={field.value && field.value > 0 ? field.value : ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        field.onChange(undefined);
                        return;
                      }
                      const n = clamp(Number(raw), 1, 50);
                      field.onChange(Number.isNaN(n) ? undefined : n);
                    }}
                    onBlur={(e) => {
                      const n = clamp(Number(e.target.value || 1), 1, 50);
                      field.onChange(n);
                    }}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Allowed range: 1–50.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Employment & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Employment Type<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#2B7FD0]">
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Experience Level<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#2B7FD0]">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Location Type & Career Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="locationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Location Type<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#2B7FD0]">
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="careerStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Career Stage<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#2B7FD0]">
                        <SelectValue placeholder="Select career stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="New Entry">New Entry</SelectItem>
                      <SelectItem value="Experienced Professional">
                        Experienced Professional
                      </SelectItem>
                      <SelectItem value="Career Returner">
                        Career Returner
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Category */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium text-gray-700">
                  Job Category<span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-11 justify-between border-gray-300 focus:border-[#2B7FD0]",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={categoriesLoading || categoriesError !== null}
                      >
                        {field.value
                          ? jobCategories?.data?.category?.find(
                              (c) => c._id === field.value
                            )?.name
                          : "Select category"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandList>
                        <CommandEmpty>
                          {categoriesLoading
                            ? "Loading categories..."
                            : "No category found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {jobCategories?.data?.category?.length ? (
                            jobCategories.data.category.map((category) => (
                              <CommandItem
                                value={category.name}
                                key={category._id}
                                onSelect={() => {
                                  form.setValue("categoryId", category._id, {
                                    shouldValidate: true,
                                  });
                                  form.setValue("role", "", {
                                    shouldValidate: true,
                                  });
                                  setSelectedCategoryRoles(category.role || []);
                                }}
                              >
                                {category.name}
                              </CommandItem>
                            ))
                          ) : (
                            <CommandEmpty>
                              No categories available.
                            </CommandEmpty>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role (dependent) */}
          {selectedCategoryRoles.length > 0 && (
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Role<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "h-11 justify-between border-gray-300 focus:border-[#2B7FD0]",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Select role"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search role..." />
                        <CommandList>
                          <CommandEmpty>No role found.</CommandEmpty>
                          <CommandGroup>
                            {selectedCategoryRoles.map((role) => (
                              <CommandItem
                                value={role}
                                key={role}
                                onSelect={() => {
                                  form.setValue("role", role, {
                                    shouldValidate: true,
                                  });
                                }}
                              >
                                {role}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Compensation: currency + amount with commas; stores numeric amount in form.compensation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Currency selector */}
            <FormField
              control={form.control}
              name="compensationCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Currency
                  </FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v as "USD" | "EUR")}
                    defaultValue={field.value || "USD"}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#2B7FD0]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount input with friendly formatting */}
            <FormField
              control={form.control}
              name="compensation"
              render={() => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Compensation (Optional)
                  </FormLabel>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none select-none">
                      {currencySymbol}
                    </span>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g., 50,000"
                      className="h-11 pl-8 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                      value={compensationDisplay}
                      onChange={(e) => {
                        const raw = e.target.value;
                        // Allow user to type $/€ and commas but store number
                        const sanitized = digitsOnly(raw);
                        const n = sanitized === "" ? NaN : Number(sanitized);
                        if (!Number.isNaN(n)) {
                          form.setValue("compensation", n, {
                            shouldValidate: true,
                          });
                        } else {
                          form.setValue("compensation", undefined, {
                            shouldValidate: true,
                          });
                        }
                        // Keep original characters but normalize commas/format
                        // format only the digits part to pretty commas
                        const pretty = sanitized
                          ? new Intl.NumberFormat(undefined, {
                              maximumFractionDigits: 2,
                            }).format(Number(sanitized))
                          : "";
                        // If user typed a symbol, preserve it visually (we already show a prefix symbol)
                        setCompensationDisplay(pretty);
                      }}
                      onBlur={() => {
                        const current = form.getValues("compensation");
                        if (
                          typeof current === "number" &&
                          !Number.isNaN(current)
                        ) {
                          setCompensationDisplay(
                            new Intl.NumberFormat(undefined, {
                              maximumFractionDigits: 2,
                            }).format(current)
                          );
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can type commas (e.g., 50,000). Choose USD or EUR.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Expiration */}
          <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Job Posting Expiration (Days)
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-[#2B7FD0]">
                      <SelectValue placeholder="Select expiration period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Company URL */}
          <FormField
            control={form.control}
            name="companyUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Company Website (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com"
                    className="h-11 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            className="border border-[#2B7FD0] h-11 px-6 text-[#2B7FD0] hover:bg-transparent bg-transparent"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-11 px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/85"
            onClick={() => {
              // Ensure vacancy is clamped before proceeding
              const v = form.getValues("vacancy");
              if (typeof v === "number") {
                form.setValue("vacancy", clamp(v, 1, 50), {
                  shouldValidate: true,
                });
              }
              onNext();
            }}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
