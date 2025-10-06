"use client"

import type { UseFormReturn } from "react-hook-form"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CustomDateInput } from "./custom-date-input"
import { UniversitySelector } from "./university-selector"

// Utility function to compare dates (format: MM/YYYY)
const isDateValid = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return true
  const [startMonth, startYear] = startDate.split("/").map(Number)
  const [endMonth, endYear] = endDate.split("/").map(Number)
  if (startYear > endYear) return false
  if (startYear === endYear && startMonth > endMonth) return false
  return true
}

interface EducationSectionProps {
  form: UseFormReturn<any>
}

export const EducationSection = ({ form }: EducationSectionProps) => {
  const educationList = form.watch("educationList") || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Education</CardTitle>
        <p className="text-sm text-muted-foreground">Showcase your academic background and qualifications.</p>
      </CardHeader>
      <CardContent>
        {educationList.map((education: any, index: number) => {
          if (education.type === "delete") return null

          return (
            <div key={index} className="space-y-4 rounded-lg border p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`educationList.${index}.instituteName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institute Name*</FormLabel>
                      <FormControl>
                        <UniversitySelector
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Search for university..."
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
                      <FormLabel>Degree</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a degree" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
                            <SelectItem value="Master">Master's Degree</SelectItem>
                            <SelectItem value="phd">PhD</SelectItem>
                            <SelectItem value="Associate">Associate Degree</SelectItem>
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
                        <Input placeholder="e.g. Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
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
                          value={field.value || ""}
                          onChange={(value) => {
                            field.onChange(value)
                            const graduationDate = form.getValues(`educationList.${index}.graduationDate`)
                            const currentlyStudying = form.getValues(`educationList.${index}.currentlyStudying`)
                            if (!currentlyStudying && graduationDate && value) {
                              if (!isDateValid(value, graduationDate)) {
                                form.setError(`educationList.${index}.graduationDate`, {
                                  type: "manual",
                                  message: "Graduation date cannot be earlier than start date",
                                })
                              } else {
                                form.clearErrors(`educationList.${index}.graduationDate`)
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

                {!education.currentlyStudying && (
                  <FormField
                    control={form.control}
                    name={`educationList.${index}.graduationDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation Date</FormLabel>
                        <FormControl>
                          <CustomDateInput
                            value={field.value || ""}
                            onChange={(value) => {
                              field.onChange(value)
                              const startDate = form.getValues(`educationList.${index}.startDate`)
                              if (startDate && value) {
                                if (!isDateValid(startDate, value)) {
                                  form.setError(`educationList.${index}.graduationDate`, {
                                    type: "manual",
                                    message: "Graduation date cannot be earlier than start date",
                                  })
                                } else {
                                  form.clearErrors(`educationList.${index}.graduationDate`)
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
                <FormField
                  control={form.control}
                  name={`educationList.${index}.currentlyStudying`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            if (checked) {
                              form.setValue(`educationList.${index}.graduationDate`, "")
                              form.clearErrors(`educationList.${index}.graduationDate`)
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Currently Studying</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              {educationList.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const currentEducation = form.getValues("educationList") || []
                    const educationToRemove = currentEducation[index]
                    if (educationToRemove._id) {
                      const updatedEducation = [...currentEducation]
                      updatedEducation[index] = {
                        ...educationToRemove,
                        type: "delete",
                      }
                      form.setValue("educationList", updatedEducation)
                    } else {
                      const updatedEducation = currentEducation.filter((_: any, i: number) => i !== index)
                      form.setValue("educationList", updatedEducation)
                    }
                  }}
                >
                  Remove Education
                </Button>
              )}
            </div>
          )
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const currentEducation = form.getValues("educationList") || []
            form.setValue("educationList", [
              ...currentEducation,
              {
                type: "create",
                instituteName: "",
                degree: "",
                fieldOfStudy: "",
                startDate: "",
                graduationDate: "",
                currentlyStudying: false,
                city: "",
                country: "",
              },
            ])
          }}
        >
          Add Education
        </Button>
      </CardContent>
    </Card>
  )
}
