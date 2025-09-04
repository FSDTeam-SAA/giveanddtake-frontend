"use client";

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

interface JobDetailsStepProps {
  form: UseFormReturn<JobFormData>;
  onNext: () => void;
  onCancel: () => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  selectedCategoryRoles: string[];
  setSelectedCategoryRoles: (roles: string[]) => void;
  jobCategories: any;
  categoriesLoading: boolean;
  categoriesError: string | null;
  countries: Country[];
  isLoadingCountries: boolean;
  cities: string[];
  isLoadingCities: boolean;
}

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
  return (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Job Details
        </h2>
        <div className="space-y-6">
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
                            ? countries.find(
                                (country) => country.country === field.value
                              )?.country
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
                                  form.setValue("country", country.country);
                                  form.setValue("region", "");
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
                                  form.setValue("region", city);
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
                    min="1"
                    placeholder="Enter number of vacancies"
                    className="h-11 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      >
                        {field.value
                          ? jobCategories?.data?.category?.find(
                              (category: JobCategory) =>
                                category._id === field.value
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
                            : categoriesError
                            ? "Error loading categories"
                            : "No category found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {Array.isArray(jobCategories?.data?.category) &&
                            jobCategories.data.category.map(
                              (category: JobCategory) => (
                                <CommandItem
                                  value={category.name}
                                  key={category._id}
                                  onSelect={() => {
                                    form.setValue("categoryId", category._id);
                                    form.setValue("role", "");
                                    setSelectedCategoryRoles(
                                      category.role || []
                                    );
                                  }}
                                >
                                  {category.name}
                                </CommandItem>
                              )
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
                                  form.setValue("role", role);
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

          <FormField
            control={form.control}
            name="compensation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Compensation (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., $50,000 - $70,000"
                    className="h-11 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            onClick={onNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
