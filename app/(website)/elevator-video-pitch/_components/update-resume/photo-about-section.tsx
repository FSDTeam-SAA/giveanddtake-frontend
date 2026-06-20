"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { KeyboardEvent } from "react"
import type { UseFormReturn } from "react-hook-form"
import { PhotoUpload } from "./photo-upload"
import TextEditor from "@/components/MultiStepJobForm/TextEditor"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface PhotoAboutSectionProps {
  form: UseFormReturn<any>
  photoPreview: string | null
  onPhotoSelect: (file: File | null) => void
}

const ABOUT_WORD_LIMIT = 200

function getWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean)
}

function limitWords(value: string) {
  const words = getWords(value)
  return words.length > ABOUT_WORD_LIMIT
    ? words.slice(0, ABOUT_WORD_LIMIT).join(" ")
    : value
}

function shouldBlockTyping(
  event: KeyboardEvent<HTMLTextAreaElement>,
  value: string
) {
  const target = event.currentTarget
  const hasSelection = target.selectionStart !== target.selectionEnd
  const isShortcut = event.ctrlKey || event.metaKey || event.altKey
  const allowedKeys = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "Tab",
    "Escape",
  ]

  return (
    getWords(value).length >= ABOUT_WORD_LIMIT &&
    event.key.length === 1 &&
    !hasSelection &&
    !isShortcut &&
    !allowedKeys.includes(event.key)
  )
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
            <div className="flex justify-center md:justify-start">
              <PhotoUpload onFileSelect={onPhotoSelect} previewUrl={photoPreview} />
            </div>
          </div>

          {/* About Me Section */}
          <div className="flex-1 w-full">
            <FormField
              control={form.control}
              name="aboutUs"
              render={({ field }) => {
                const value = field.value ?? ""
                const wordCount = getWords(value).length

                return (
                  <FormItem>
                    <FormLabel className="text-blue-600 font-medium">About Me</FormLabel>
                    <FormControl>
                      <Textarea
                        value={value}
                        placeholder="Write a short introduction about yourself — your strengths, experience, and what you're looking for."
                        onKeyDown={(event) => {
                          if (shouldBlockTyping(event, value)) {
                            event.preventDefault()
                          }
                        }}
                        onChange={(event) =>
                          field.onChange(limitWords(event.target.value))
                        }
                        className="mt-2 min-h-[180px] md:min-h-[250px] resize-y leading-relaxed"
                      />
                    </FormControl>
                    <div className="mt-1.5 flex justify-end">
                      <span
                        className={cn(
                          "text-xs",
                          wordCount >= ABOUT_WORD_LIMIT
                            ? "text-red-500"
                            : "text-muted-foreground"
                        )}
                      >
                        {wordCount}/{ABOUT_WORD_LIMIT} words
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
