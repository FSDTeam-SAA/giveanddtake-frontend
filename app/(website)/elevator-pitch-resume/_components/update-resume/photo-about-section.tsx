"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { UseFormReturn } from "react-hook-form"
import { PhotoUpload } from "./photo-upload"
import TextEditor from "@/components/MultiStepJobForm/TextEditor"

interface PhotoAboutSectionProps {
  form: UseFormReturn<any>
  photoPreview: string | null
  onPhotoSelect: (file: File | null) => void
}

export function PhotoAboutSection({ form, photoPreview, onPhotoSelect }: PhotoAboutSectionProps) {
  return (
    <div className="w-full">
      <div className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
          {/* Photo Section */}
          <div className="flex-shrink-0 w-full md:w-auto ">
            <FormLabel className="text-sm font-medium text-blue-600 mb-2 block">
              Profile Photo
            </FormLabel>
            <div className="flex justify-center md:justify-start border border-gray-400 py-6 rounded">
              <PhotoUpload onFileSelect={onPhotoSelect} previewUrl={photoPreview} />
            </div>
          </div>

          {/* About Me Section */}
          <div className="flex-1 w-full">
            <FormField
              control={form.control}
              name="aboutUs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-600 font-medium">About Me</FormLabel>
                  <FormControl>
                    <div className="mt-2">
                      <TextEditor value={field.value ?? ""} onChange={field.onChange} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
