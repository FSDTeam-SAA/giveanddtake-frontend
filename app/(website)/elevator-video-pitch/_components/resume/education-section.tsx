"use client";
import { UniversitySelector } from "@/components/profile/university-selector";
import { useQualifications } from "@/hooks/use-qualifications";

import { useResumeEntryCities } from "@/hooks/use-resume-entry-cities";
import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import CustomDateInput from "@/components/custom-date-input";
import type { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

interface Country {
  country: string;
  cities: string[];
}

interface Option {
  value: string;
  label: string;
}

function Combobox({
  options,
  value,
  onChange,
  placeholder,
  minSearchLength = 0,
  disabled = false,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minSearchLength?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  const displayedOptions = filteredOptions.slice(0, 100);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label ?? placeholder
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < minSearchLength ? (
              <CommandEmpty>
                Type at least {minSearchLength} characters to search.
              </CommandEmpty>
            ) : displayedOptions.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {displayedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredOptions.length > 100 && (
              <CommandItem disabled>
                More results available. Refine your search.
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface EducationSectionProps {
  form: UseFormReturn<any>;
  educationFields: FieldArrayWithId<any, "educationList", "id">[];
  appendEducation: (value: any) => void;
  removeEducation: (index: number) => void;
}

// Utility function to compare dates (format: MM/YYYY)
const isDateValid = (startDate: string, graduationDate: string): boolean => {
  if (!startDate || !graduationDate) return true; // Skip if either date is empty
  const [startMonth, startYear] = startDate.split("/").map(Number);
  const [gradMonth, gradYear] = graduationDate.split("/").map(Number);

  if (startYear > gradYear) return false;
  if (startYear === gradYear && startMonth > gradMonth) return false;
  return true;
};

export function EducationSection({
  form,
  educationFields,
  appendEducation,
  removeEducation,
}: EducationSectionProps) {
  const qualifications = useQualifications();
  const {
    selectedCountries: selectedEducationCountries,
    citiesData: educationCitiesData,
    loadingCities: loadingEducationCities,
  } = useResumeEntryCities(form, "educationList");

  // Fetch countries
  const { data: countriesData, isLoading: isLoadingCountries } = useQuery<
    Country[]
  >({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/countries`
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch countries");
      return data.data as Country[];
    },
  });

  // Validate dates whenever startDate or graduationDate changes
  useEffect(() => {
    educationFields.forEach((_, index) => {
      const startDate = form.getValues(`educationList.${index}.startDate`);
      const graduationDate = form.getValues(
        `educationList.${index}.graduationDate`
      );
      const currentlyStudying = form.getValues(
        `educationList.${index}.currentlyStudying`
      );

      if (!currentlyStudying && startDate && graduationDate) {
        if (!isDateValid(startDate, graduationDate)) {
          form.setError(`educationList.${index}.graduationDate`, {
            type: "manual",
            message: "Graduation date cannot be earlier than start date",
          });
        } else {
          form.clearErrors(`educationList.${index}.graduationDate`);
        }
      }
    });
  }, [form, educationFields]);

  const countryOptions = useMemo(
    () =>
      countriesData?.map((c) => ({ value: c.country, label: c.country })) || [],
    [countriesData]
  );

  const educationCityOptions = useMemo(() => {
    return educationCitiesData.map(
      (cities) => cities?.map((c) => ({ value: c, label: c })) || []
    );
  }, [educationCitiesData]);

  return (
    <div>
      <div className="mb-4">
        <CardTitle>Education*</CardTitle>
      </div>
      <div className="space-y-4">
        {educationFields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`educationList.${index}.instituteName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name*</FormLabel>
                    <FormControl>
                      <UniversitySelector
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        placeholder="Institution Name"
                      />
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
                    <FormLabel>Qualification</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""} // Ensure value is empty string if undefined
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Qualification" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualifications.options(field.value).map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
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
                name={`educationList.${index}.fieldOfStudy`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Of Study</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Field Of Study"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`educationList.${index}.country`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Combobox
                        options={countryOptions}
                        value={field.value || ""}
                        onChange={(value) => {
                          field.onChange(value);
                          form.setValue(`educationList.${index}.city`, "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        placeholder={
                          isLoadingCountries
                            ? "Loading countries..."
                            : "Country"
                        }
                        minSearchLength={0}
                        disabled={isLoadingCountries}
                      />
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
                      <Combobox
                        options={educationCityOptions[index] || []}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={
                          !selectedEducationCountries[index]
                            ? "Select country first"
                            : loadingEducationCities[index]
                            ? "Loading cities..."
                            : "City"
                        }
                        minSearchLength={2}
                        disabled={
                          loadingEducationCities[index] ||
                          !selectedEducationCountries[index]
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name={`educationList.${index}.currentlyStudying`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked: boolean) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue(
                                `educationList.${index}.graduationDate`,
                                ""
                              );
                              form.clearErrors(
                                `educationList.${index}.graduationDate`
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Currently Studying
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`educationList.${index}.startDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <CustomDateInput
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            // Trigger validation for graduation date
                            const gradDate = form.getValues(
                              `educationList.${index}.graduationDate`
                            );
                            const currentlyStudying = form.getValues(
                              `educationList.${index}.currentlyStudying`
                            );
                            if (!currentlyStudying && gradDate && value) {
                              if (!isDateValid(value, gradDate)) {
                                form.setError(
                                  `educationList.${index}.graduationDate`,
                                  {
                                    type: "manual",
                                    message:
                                      "Graduation date cannot be earlier than start date",
                                  }
                                );
                              } else {
                                form.clearErrors(
                                  `educationList.${index}.graduationDate`
                                );
                              }
                            }
                          }}
                          placeholder="MM/YYYY"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`educationList.${index}.graduationDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Graduation Date
                        {form.watch(`educationList.${index}.instituteName`) &&
                        form.watch(`educationList.${index}.startDate`) &&
                        !form.watch(`educationList.${index}.currentlyStudying`)
                          ? " *"
                          : ""}
                      </FormLabel>
                      <FormControl>
                        <CustomDateInput
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            // Validate against start date
                            const startDate = form.getValues(
                              `educationList.${index}.startDate`
                            );
                            const currentlyStudying = form.getValues(
                              `educationList.${index}.currentlyStudying`
                            );
                            if (!currentlyStudying && startDate && value) {
                              if (!isDateValid(startDate, value)) {
                                form.setError(
                                  `educationList.${index}.graduationDate`,
                                  {
                                    type: "manual",
                                    message:
                                      "Graduation date cannot be earlier than start date",
                                  }
                                );
                              } else {
                                form.clearErrors(
                                  `educationList.${index}.graduationDate`
                                );
                              }
                            }
                          }}
                          placeholder="MM/YYYY"
                          disabled={form.watch(
                            `educationList.${index}.currentlyStudying`
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {educationFields.length > 1 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeEducation(index)}
              >
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
              instituteName: "",
              degree: "",
              fieldOfStudy: "",
              startDate: "",
              graduationDate: "",
              currentlyStudying: false,
              city: "",
              country: "",
            })
          }
          className="flex items-center gap-2"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
