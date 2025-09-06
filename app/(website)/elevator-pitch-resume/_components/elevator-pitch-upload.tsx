"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/company/file-upload"

interface ElevatorPitchUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile?: File | null
}

export function ElevatorPitchUpload({ onFileSelect, selectedFile }: ElevatorPitchUploadProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg font-medium">Upload Your Elevator Pitch</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Share a video introduction to make your resume stand out
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-6">
          <FileUpload
            onFileSelect={onFileSelect}
            accept="video/*"
            maxSize={100 * 1024 * 1024}
            variant="dark"
            className="min-h-[200px]"
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-blue-600/20 p-4">
                <Upload className="h-8 w-8 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-white mb-2">Upload Your Video Pitch</p>
                <p className="text-gray-300 text-sm mb-4">Drop your video here or click to browse</p>
                <p className="text-xs text-gray-400">Supports MP4, MOV, AVI • Max 100MB</p>
              </div>
              <Button type="button" variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                Choose Video File
              </Button>
            </div>
          </FileUpload>
        </div>
        {selectedFile && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{selectedFile.name}</span>
              <span className="text-xs text-blue-600">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
