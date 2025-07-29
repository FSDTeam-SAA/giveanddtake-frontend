"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  maxSize?: number
  className?: string
  children?: React.ReactNode
  variant?: "default" | "dark"
}

export function FileUpload({
  onFileSelect,
  accept = "*/*",
  maxSize = 10 * 1024 * 1024,
  className,
  children,
  variant = "default",
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / 1024 / 1024}MB`)
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }

  const removeFile = () => {
    setSelectedFile(null)
    onFileSelect(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  if (variant === "dark") {
    return (
      <div className={cn("relative", className)}>
        <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={handleChange} />

        {selectedFile ? (
          <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-gray-50">
            <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "bg-gray-900 rounded-lg p-12 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center",
              dragActive && "bg-gray-800",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
          >
            <Upload className="mx-auto h-12 w-12 text-white mb-4" />
            <p className="text-white mb-4">Drop your files here</p>
            <Button
              type="button"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-gray-900"
            >
              Choose File
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={handleChange} />

      {selectedFile ? (
        <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-gray-50">
          <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors",
            dragActive && "border-blue-500 bg-blue-50",
            "hover:border-gray-400",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          {children || (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Drop your files here</p>
              <Button type="button" variant="outline">
                Choose File
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
