"use client";
import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { VideoPlayer } from "@/components/company/video-player";
import { ElevatorPitchUpload } from "./elevator-pitch-upload";
import {
  deleteElevatorPitchVideo,
  uploadElevatorPitch,
} from "@/lib/api-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ApiResponse {
  success: boolean;
  total: number;
  data: PitchData[];
}

interface PitchData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  video: {
    hlsUrl: string;
    encryptionKeyUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function RecruiterElevator({
  recruiter,
}: {
  recruiter: { bio: string };
}) {
  const [loading, setLoading] = useState(true);
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [isElevatorPitchUploaded, setIsElevatorPitchUploaded] =
    useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: session } = useSession();
  const userId = session?.user?.id;
  const token = session?.accessToken;

  useEffect(() => {
    const fetchPitchData = async () => {
      if (!userId || !token) {
        setLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}/elevator-pitch/all/elevator-pitches?type=recruiter`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pitch data");
        }

        const apiResponse: ApiResponse = await response.json();
        const userPitch = apiResponse.data.find(
          (pitch) => pitch.userId._id === userId
        );

        if (userPitch) {
          setPitchData(userPitch);
          setIsElevatorPitchUploaded(true);
        } else {
          setError("No pitch found for current user");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPitchData();
  }, [userId, token]);

  const uploadElevatorPitchMutation = useMutation({
    mutationFn: uploadElevatorPitch,
    onSuccess: () => {
      toast.success("Elevator pitch uploaded successfully!");
      setIsElevatorPitchUploaded(true);
      setElevatorPitchFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload video");
      setIsElevatorPitchUploaded(false);
    },
  });

  const deleteElevatorPitchMutation = useMutation({
    mutationFn: deleteElevatorPitchVideo,
    onSuccess: () => {
      toast.success("Elevator pitch deleted successfully!");
      setIsElevatorPitchUploaded(false);
      setElevatorPitchFile(null);
      setPitchData(null);
      setIsDeleteModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete elevator pitch.");
      console.error("Error deleting elevator pitch:", error);
    },
  });

  const handleElevatorPitchUpload = async () => {
    if (elevatorPitchFile && userId) {
      try {
        await uploadElevatorPitchMutation.mutateAsync({
          videoFile: elevatorPitchFile,
          userId,
        });
      } catch (error) {
        // Error toast is handled in mutation onError
      }
    } else {
      toast.error("Please select a video file to upload");
    }
  };

  const handleDeleteElevatorPitch = async () => {
    if (userId && pitchData) {
      try {
        await deleteElevatorPitchMutation.mutateAsync(userId);
      } catch (error) {
        // Error toast is handled in mutation onError
      }
    }
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="container mx-auto">
      <div className="lg:pb-12 pb-5">
        <h2 className="text-xl lg:text-4xl font-bold text-center my-10">
          Elevator Video Pitch©
        </h2>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Elevator Video Pitch©</CardTitle>
              {isElevatorPitchUploaded && pitchData && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={openDeleteModal}
                  disabled={deleteElevatorPitchMutation.isPending}
                  title="Delete Elevator Pitch"
                  className="bg-gray-200 text-red-500 hover:text-red-600 hover:bg-gray-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Upload or view a short video introducing yourself.
            </p>
          </CardHeader>
          <CardContent>
            {pitchData ? (
              <VideoPlayer
                pitchId={pitchData._id}
                className="w-full mx-auto md:h-[500px]"
              />
            ) : loading ? (
              <div>Loading pitch...</div>
            ) : (
              <>
                <ElevatorPitchUpload
                  onFileSelect={setElevatorPitchFile}
                  selectedFile={elevatorPitchFile}
                />
                <Button
                  type="button"
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleElevatorPitchUpload}
                  disabled={
                    uploadElevatorPitchMutation.isPending || !elevatorPitchFile
                  }
                >
                  {uploadElevatorPitchMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    "Upload Elevator Pitch"
                  )}
                </Button>
                {isElevatorPitchUploaded && (
                  <p className="mt-2 text-sm text-green-600">
                    Elevator pitch uploaded successfully!
                  </p>
                )}
                {!isElevatorPitchUploaded && !elevatorPitchFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    No pitch available
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="lg:space-y-8 space-y-4 py-8">
        <h2 className="text-xl lg:text-2xl font-bold">About Us</h2>
        <div
          className="text-gray-600 text-sm text-start pb-8"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              recruiter?.bio ||
                "We connect top talent with great companies. Our mission is to make hiring simple, fast, and effective for everyone."
            ),
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete your elevator pitch? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                className="px-4 py-2"
              >
                No
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteElevatorPitch}
                disabled={deleteElevatorPitchMutation.isPending}
                className="px-4 py-2"
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
