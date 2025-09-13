"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Upload, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/company/file-upload";
import { useState } from "react";

interface ElevatorPitchUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  uploadedVideoUrl?: string | null;
  onDelete?: () => void;
  isUploaded?: boolean;
}

export function ElevatorPitchUpload({
  onFileSelect,
  selectedFile,
  uploadedVideoUrl,
  onDelete,
  isUploaded = false,
}: ElevatorPitchUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    onFileSelect(file);
  };

  const handleDelete = () => {
    setPreviewUrl(null);
    onFileSelect(null);
    if (onDelete) {
      onDelete();
    }
  };

  const videoUrl = uploadedVideoUrl || previewUrl;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg font-medium">
                Upload Your Elevator Pitch
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Share a video introduction to make your resume stand out
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {videoUrl ? (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                src={videoUrl}
                controls
                className="w-full h-64 object-contain"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedFile?.name || "Uploaded Video"}
                </span>
                {selectedFile && (
                  <span className="text-xs text-blue-600">
                    ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFileSelect(null)}
              className="w-full"
            >
              Upload Different Video
            </Button>
          </div>
        ) : (
          <div className="rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            <FileUpload
              onFileSelect={handleFileSelect}
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
                  <p className="text-lg font-medium text-white mb-2">
                    Upload Your Video Pitch
                  </p>
                  <p className="text-gray-300 text-sm mb-4">
                    Drop your video here or click to browse
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports MP4, MOV, AVI • Max 100MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  Choose Video File
                </Button>
              </div>
            </FileUpload>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
