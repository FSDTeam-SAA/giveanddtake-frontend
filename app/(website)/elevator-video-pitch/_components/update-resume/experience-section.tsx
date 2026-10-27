"use client";

import { useResumeEntryCities } from "@/hooks/use-resume-entry-cities";
import type { UseFormReturn } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CustomDateInput } from "./custom-date-input";
import { Combobox } from "@/components/ui/combo-box";

interface Country {
  country: string;
  cities: string[];
}

interface Option {
  value: string;
  label: string;
}

// Utility function to compare dates (format: MM/YYYY)
const isDateValid = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return true;
  const [startMonth, startYear] = startDate.split("/").map(Number);
  const [endMonth, endYear] = endDate.split("/").map(Number);
  if (startYear > endYear) return false;
  if (startYear === endYear && startMonth > endMonth) return false;
  return true;
};

interface ExperienceSectionProps {
  form: UseFormReturn<any>;
}

export const ExperienceSection = ({ form }: ExperienceSectionProps) => {
  const experiences = form.watch("experiences") || [];
  const {
    selectedCountries: selectedExperienceCountries,
    citiesData: experienceCitiesData,
    loadingCities: loadingExperienceCities,
  } = useResumeEntryCities(form, "experiences");

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

  // Validate dates whenever startDate or endDate changes
  useEffect(() => {
    experiences.forEach((_: any, index: number) => {
      const startDate = form.getValues(`experiences.${index}.startDate`);
      const endDate = form.getValues(`experiences.${index}.endDate`);
      const currentlyWorking = form.getValues(
        `experiences.${index}.currentlyWorking`
      );

      if (!currentlyWorking && startDate && endDate) {
        if (!isDateValid(startDate, endDate)) {
          form.setError(`experiences.${index}.endDate`, {
            type: "manual",
            message: "End date cannot be earlier than start date",
          });
        } else {
          form.clearErrors(`experiences.${index}.endDate`);
        }
      }
    });
  }, [form, experiences]);

  const countryOptions = useMemo(
    () =>
      countriesData?.map((c) => ({ value: c.country, label: c.country })) || [],
    [countriesData]
  );

  const experienceCityOptions = useMemo(() => {
    return experienceCitiesData.map(
      (cities) => cities?.map((c) => ({ value: c, label: c })) || []
    );
  }, [experienceCitiesData]);

  return (
    <div>
      <div className="mb-4 space-y-2">
        <h3>Experience (Optional)</h3>
        <p className="text-sm text-muted-foreground">
          Highlight your work journey and key achievements.
        </p>
      </div>
      <div>
        {experiences.map((experience: any, index: number) => {
          if (experience.type === "delete") return null;

          return (
            <div key={index} className="space-y-4 rounded-lg border p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`experiences.${index}.company`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`experiences.${index}.jobTitle`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Job Title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country Field */}
                <FormField
                  control={form.control}
                  name={`experiences.${index}.country`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Combobox
                          options={countryOptions}
                          value={field.value || ""}
                          onChange={(value) => {
                            field.onChange(value);
                            form.setValue(`experiences.${index}.city`, "", {
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

                {/* City Field */}
                <FormField
                  control={form.control}
                  name={`experiences.${index}.city`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Combobox
                          options={experienceCityOptions[index] || []}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder={
                            !selectedExperienceCountries[index]
                              ? "Select country first"
                              : loadingExperienceCities[index]
                              ? "Loading cities..."
                              : "City"
                          }
                          minSearchLength={2}
                          disabled={
                            loadingExperienceCities[index] ||
                            !selectedExperienceCountries[index]
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`experiences.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <CustomDateInput
                            value={field.value || ""}
                            onChange={(value) => {
                              field.onChange(value);
                              const endDate = form.getValues(
                                `experiences.${index}.endDate`
                              );
                              const currentlyWorking = form.getValues(
                                `experiences.${index}.currentlyWorking`
                              );
                              if (!currentlyWorking && endDate && value) {
                                if (!isDateValid(value, endDate)) {
                                  form.setError(
                                    `experiences.${index}.endDate`,
                                    {
                                      type: "manual",
                                      message:
                                        "End date cannot be earlier than start date",
                                    }
                                  );
                                } else {
                                  form.clearErrors(
                                    `experiences.${index}.endDate`
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

                  {!experience.currentlyWorking && (
                    <FormField
                      control={form.control}
                      name={`experiences.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            End Date
                            {form.watch(`experiences.${index}.company`) &&
                            form.watch(`experiences.${index}.jobTitle`) &&
                            !form.watch(`experiences.${index}.currentlyWorking`)
                              ? " *"
                              : ""}
                          </FormLabel>
                          <FormControl>
                            <CustomDateInput
                              value={field.value || ""}
                              onChange={(value) => {
                                field.onChange(value);
                                const startDate = form.getValues(
                                  `experiences.${index}.startDate`
                                );
                                if (startDate && value) {
                                  if (!isDateValid(startDate, value)) {
                                    form.setError(
                                      `experiences.${index}.endDate`,
                                      {
                                        type: "manual",
                                        message:
                                          "End date cannot be earlier than start date",
                                      }
                                    );
                                  } else {
                                    form.clearErrors(
                                      `experiences.${index}.endDate`
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
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`experiences.${index}.currentlyWorking`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue(`experiences.${index}.endDate`, "");
                              form.clearErrors(`experiences.${index}.endDate`);
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Current Position</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`experiences.${index}.jobDescription`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Job Description"
                        {...field}
                      />
                    </FormControl>
                  <p className="text-sm text-gray-500">{(field.value ?? "").length}/1400 characters</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {experiences.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const currentExperiences =
                      form.getValues("experiences") || [];
                    const experienceToRemove = currentExperiences[index];

                    if (experienceToRemove._id) {
                      const updatedExperiences = [...currentExperiences];
                      updatedExperiences[index] = {
                        ...experienceToRemove,
                        type: "delete",
                      };
                      form.setValue("experiences", updatedExperiences);
                    } else {
                      const updatedExperiences = currentExperiences.filter(
                        (_: any, i: number) => i !== index
                      );
                      form.setValue("experiences", updatedExperiences);
                    }
                  }}
                >
                  Remove Experience
                </Button>
              )}
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const currentExperiences = form.getValues("experiences") || [];
            form.setValue("experiences", [
              ...currentExperiences,
              {
                type: "create",
                company: "",
                jobTitle: "",
                duration: "",
                startDate: "",
                endDate: "",
                currentlyWorking: false,
                country: "",
                city: "",
                zip: "",
                jobDescription: "",
                jobCategory: "",
              },
            ]);
          }}
        >
          Add Experience
        </Button>
      </div>
    </div>
  );
};
