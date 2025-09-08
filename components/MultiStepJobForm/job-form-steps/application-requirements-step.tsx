"use client";

import { useEffect } from "react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { JobFormData } from "@/types/job";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ApplicationRequirement {
  id: string;
  label: string;
  required: boolean;
}

interface ApplicationRequirementsStepProps {
  form: UseFormReturn<JobFormData>;
  onNext: () => void;
  onCancel: () => void;
}

export default function ApplicationRequirementsStep({
  form,
  onNext,
  onCancel,
}: ApplicationRequirementsStepProps) {
  const {
    fields: applicationRequirements,
    update: updateRequirement,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "applicationRequirements",
  });

  // Ensure all requirements are optional by default and remove PII/duplicated fields
  useEffect(() => {
    if (!applicationRequirements?.length) return;

    // 1) Make every field optional by default
    applicationRequirements.forEach((req, i) => {
      if (req.required) {
        updateRequirement(i, { ...req, required: false });
      }
    });

    // 2) Remove fields we don't want on this page
    const labelsToRemove = new Set([
      "Name",
      "Email",
      "Phone Number",
      // We are replacing Start Date with a dedicated Notice Period dropdown
      "Start Date",
    ]);

    const indicesToRemove = applicationRequirements
      .map((req, i) => (labelsToRemove.has(req.label) ? i : -1))
      .filter((i) => i !== -1)
      // remove from the end to avoid index shifting
      .sort((a, b) => b - a);

    if (indicesToRemove.length) remove(indicesToRemove);

    // 3) Initialize noticePeriod if not already set
    const current = form.getValues("noticePeriod");
    if (current === undefined) {
      form.setValue("noticePeriod", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationRequirements.length]);

  return (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#000000]">
            Application Requirements
          </h2>
        </div>
        <p className="text-xl text-[#000000] mb-6">
          What personal info would you like to gather about each applicant?
        </p>

        {/* Requirements list (all optional by default) */}
        <div className="space-y-4">
          {applicationRequirements.map((requirement, index) => (
            <div
              key={requirement.id}
              className="flex items-center justify-between py-2 border-b pb-6"
            >
              <div className="flex items-center space-x-3">
                <div className="w-[22px] h-[22px] bg-[#2B7FD0] rounded-full flex items-center justify-center">
                  <Check className="text-white w-4 h-4" />
                </div>
                <span className="text-xl text-[#000000] font-normal">
                  {requirement.label}
                </span>
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
                  onClick={() =>
                    updateRequirement(index, {
                      ...requirement,
                      required: false,
                    })
                  }
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
                  onClick={() =>
                    updateRequirement(index, { ...requirement, required: true })
                  }
                >
                  Required
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Notice Period (replaces Start Date) */}
        <div className="mt-8">
          <label className="block text-xl text-[#000000] mb-3">
            Notice Period
          </label>
          <Select
            value={form.watch("noticePeriod") || ""}
            onValueChange={(val) =>
              form.setValue("noticePeriod", val, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder="Select notice period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Immediate">Immediate</SelectItem>
              <SelectItem value="One month">One month</SelectItem>
              <SelectItem value="Three months">Three months</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-4 mt-8">
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
  );
}
