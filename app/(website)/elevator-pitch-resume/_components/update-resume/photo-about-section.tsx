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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-8">
          <div className="flex-shrink-0">
            <FormLabel className="text-sm font-medium text-blue-600 mb-2 block">Photo</FormLabel>
            <PhotoUpload onFileSelect={onPhotoSelect} previewUrl={photoPreview} />
          </div>

          <div className="flex-1">
            <FormField
              control={form.control}
              name="aboutUs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-600 font-medium">About Me</FormLabel>
                  <FormControl>
                    <TextEditor value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
