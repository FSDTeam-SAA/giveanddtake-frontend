"use client"

import type { UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Info } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import TextEditor from "../TextEditor"
import CustomCalendar from "../CustomCalendar"
import type { JobFormData } from "@/types/job";

interface JobDescriptionStepProps {
  form: UseFormReturn<JobFormData>
  onNext: () => void
  onCancel: () => void
  publishNow: boolean
  setPublishNow: (value: boolean) => void
  selectedDate: Date | null
  setSelectedDate: (date: Date | null) => void
}

export default function JobDescriptionStep({
  form,
  onNext,
  onCancel,
  publishNow,
  setPublishNow,
  selectedDate,
  setSelectedDate,
}: JobDescriptionStepProps) {
  return (
    <div className="bg-white p-6 rounded-md">
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-none">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-[#000000] mb-6">Job Description</h2>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Job Description<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <TextEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <p className="text-sm text-gray-600">Character count: {field.value.length}/2000</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-none">
            <CardContent className="p-6">
              <div className="flex items-start space-x-2 mb-4">
                <Info className="h-5 w-5 text-[#9EC7DC]" />
                <h3 className="text-base font-semibold text-[#9EC7DC]">TIP</h3>
              </div>
              <p className="text-base text-[#000000] mb-4">
                Job boards will often reject jobs that do not have quality job descriptions. To ensure that your job
                description matches the requirements for job boards, consider the following guidelines:
              </p>
              <ul className="list-disc list-inside text-base text-[#000000] space-y-2">
                <li>Job descriptions should be clear, well-written, and informative</li>
                <li>Job descriptions with 700-2000 characters get the most interaction</li>
                <li>Do not use discriminatory language</li>
                <li>Do not post offensive or inappropriate content</li>
                <li>Be honest about the job requirement details</li>
                <li>Help the candidate understand the expectations for this role</li>
              </ul>
              <p className="text-base text-[#000000] mt-4">
                For more tips on writing good job descriptions,{" "}
                <a href="#" className="text-[#9EC7DC] hover:underline">
                  read our help article.
                </a>
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[#000000]">Publish Now</h3>
                <Switch
                  checked={publishNow}
                  onCheckedChange={setPublishNow}
                  className="data-[state=checked]:bg-[#2B7FD0]"
                />
              </div>
              {!publishNow && (
                <div className="border rounded-lg p-3">
                  <FormField
                    control={form.control}
                    name="publishDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold mb-3">Schedule Publish</FormLabel>
                        <FormControl>
                          <CustomCalendar
                            selectedDate={field.value ? new Date(field.value) : undefined}
                            onDateSelect={(date) => {
                              setSelectedDate(date as any)
                              field.onChange(date?.toISOString())
                            }}
                          />
                        </FormControl>
                        {field.value && (
                          <p className="text-sm text-gray-600 mt-2">
                            Selected date: {new Date(field.value).toLocaleDateString()}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-6">
        <Button
          type="button"
          className="border border-[#2B7FD0] h-11 px-6 text-[#2B7FD0] hover:bg-transparent bg-transparent"
          variant="outline"
          onClick={onCancel}
        >
          Back
        </Button>
        <Button type="button" className="h-11 px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/85" onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  )
}
