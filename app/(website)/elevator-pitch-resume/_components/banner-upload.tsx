"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"

interface BannerUploadProps {
  onFileSelect: (file: File | null) => void
  previewUrl?: string | null
}

export function BannerUpload({ onFileSelect, previewUrl }: BannerUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB")
      return
    }
    onFileSelect(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const removeBanner = () => {
    onFileSelect(null)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-green-600" />
          <div>
            <CardTitle>Upload Banner</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Upload a banner image to enhance your resume profile.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {previewUrl ? (
          <div className="relative">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <Image src={previewUrl || "/placeholder.svg"} alt="Banner preview" fill className="object-cover" />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeBanner}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("banner-upload")?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">Drop your banner image here</p>
            <Button type="button" variant="outline">
              Choose Image
            </Button>
            <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG • Max 10MB</p>
          </div>
        )}
        <input id="banner-upload" type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
      </CardContent>
    </Card>
  )
}
