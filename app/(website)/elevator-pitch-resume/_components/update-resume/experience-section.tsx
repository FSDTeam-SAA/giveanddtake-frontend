"use client"

import type { UseFormReturn } from "react-hook-form"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CustomDateInput } from "./custom-date-input"

// Utility function to compare dates (format: MM/YYYY)
const isDateValid = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return true
  const [startMonth, startYear] = startDate.split("/").map(Number)
  const [endMonth, endYear] = endDate.split("/").map(Number)
  if (startYear > endYear) return false
  if (startYear === endYear && startMonth > endMonth) return false
  return true
}

interface ExperienceSectionProps {
  form: UseFormReturn<any>
}

export const ExperienceSection = ({ form }: ExperienceSectionProps) => {
  const experiences = form.watch("experiences") || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experience (Optional)</CardTitle>
        <p className="text-sm text-muted-foreground">Highlight your work journey and key achievements.</p>
      </CardHeader>
      <CardContent>
        {experiences.map((experience: any, index: number) => {
          if (experience.type === "delete") return null

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
                        <Input placeholder="e.g. IBM" {...field} />
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
                        <Input placeholder="e.g. Software Engineer" {...field} />
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
                              field.onChange(value)
                              const endDate = form.getValues(`experiences.${index}.endDate`)
                              const currentlyWorking = form.getValues(`experiences.${index}.currentlyWorking`)
                              if (!currentlyWorking && endDate && value) {
                                if (!isDateValid(value, endDate)) {
                                  form.setError(`experiences.${index}.endDate`, {
                                    type: "manual",
                                    message: "End date cannot be earlier than start date",
                                  })
                                } else {
                                  form.clearErrors(`experiences.${index}.endDate`)
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
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <CustomDateInput
                              value={field.value || ""}
                              onChange={(value) => {
                                field.onChange(value)
                                const startDate = form.getValues(`experiences.${index}.startDate`)
                                if (startDate && value) {
                                  if (!isDateValid(startDate, value)) {
                                    form.setError(`experiences.${index}.endDate`, {
                                      type: "manual",
                                      message: "End date cannot be earlier than start date",
                                    })
                                  } else {
                                    form.clearErrors(`experiences.${index}.endDate`)
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
                            field.onChange(checked)
                            if (checked) {
                              form.setValue(`experiences.${index}.endDate`, "")
                              form.clearErrors(`experiences.${index}.endDate`)
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Currently Working</FormLabel>
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
                      <Textarea placeholder="Describe your responsibilities and achievements" {...field} />
                    </FormControl>
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
                    const currentExperiences = form.getValues("experiences") || []
                    const experienceToRemove = currentExperiences[index]

                    if (experienceToRemove._id) {
                      const updatedExperiences = [...currentExperiences]
                      updatedExperiences[index] = {
                        ...experienceToRemove,
                        type: "delete",
                      }
                      form.setValue("experiences", updatedExperiences)
                    } else {
                      const updatedExperiences = currentExperiences.filter((_: any, i: number) => i !== index)
                      form.setValue("experiences", updatedExperiences)
                    }
                  }}
                >
                  Remove Experience
                </Button>
              )}
            </div>
          )
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const currentExperiences = form.getValues("experiences") || []
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
            ])
          }}
        >
          Add Experience
        </Button>
      </CardContent>
    </Card>
  )
}
