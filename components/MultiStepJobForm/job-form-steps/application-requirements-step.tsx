"use client"

import { type UseFormReturn, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check } from "lucide-react"
import type { JobFormData } from "@/types/job";

interface ApplicationRequirement {
  id: string
  label: string
  required: boolean
}

interface ApplicationRequirementsStepProps {
  form: UseFormReturn<JobFormData>
  onNext: () => void
  onCancel: () => void
}

export default function ApplicationRequirementsStep({ form, onNext, onCancel }: ApplicationRequirementsStepProps) {
  const { fields: applicationRequirements, update: updateRequirement } = useFieldArray({
    control: form.control,
    name: "applicationRequirements",
  })

  return (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#000000]">Application Requirements</h2>
        </div>
        <p className="text-xl text-[#000000] mb-6">What personal info would you like to gather about each applicant?</p>
        <div className="space-y-4">
          {applicationRequirements.map((requirement, index) => (
            <div key={requirement.id} className="flex items-center justify-between py-2 border-b pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-[22px] h-[22px] bg-[#2B7FD0] rounded-full flex items-center justify-center">
                  <Check className="text-white w-4 h-4" />
                </div>
                <span className="text-xl text-[#000000] font-normal">{requirement.label}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={!requirement.required ? "default" : "outline"}
                  className={`h-9 px-4 rounded-lg text-sm font-medium ${
                    !requirement.required
                      ? "bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
                      : "border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent"
                  }`}
                  onClick={() => updateRequirement(index, { ...requirement, required: false })}
                >
                  Optional
                </Button>
                <Button
                  type="button"
                  variant={requirement.required ? "default" : "outline"}
                  className={`h-9 px-4 rounded-lg text-sm font-medium ${
                    requirement.required
                      ? "bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
                      : "border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent"
                  }`}
                  onClick={() => updateRequirement(index, { ...requirement, required: true })}
                >
                  Required
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            className="h-11 px-6 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 bg-transparent"
            onClick={onCancel}
          >
            Back
          </Button>
          <Button
            type="button"
            className="h-11 px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 rounded-lg text-white"
            onClick={onNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
