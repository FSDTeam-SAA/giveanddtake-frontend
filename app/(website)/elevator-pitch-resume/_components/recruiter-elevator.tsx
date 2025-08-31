"use client";
import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { useSession } from "next-auth/react";
import { VideoPlayer } from "@/components/company/video-player";

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

  const { data: session } = useSession();

  useEffect(() => {
    const fetchPitchData = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}/elevator-pitch/all/elevator-pitches?type=recruiter`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pitch data");
        }

        const apiResponse: ApiResponse = await response.json();

        // Find the pitch that matches the current user's ID
        const userPitch = apiResponse.data.find(
          (pitch) => pitch.userId._id === session.user?.id
        );

        if (userPitch) {
          setPitchData(userPitch);
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
  }, [session]);

  console.log(recruiter);
  return (
    <div>
      <div className="lg:pb-12 pb-5">
        <h2 className="text-xl lg:text-4xl font-bold text-center mb-24">
          Elevator Pitch
        </h2>
        <div className=" rounded-lg ">
          {pitchData ? (
            <VideoPlayer
              pitchId={pitchData._id}
              className="w-full mx-auto"
            />
          ) : loading ? (
            <div>Loading pitch...</div>
          ) : error ? (
            <div className="text-red-500">Error: {error}</div>
          ) : (
            <div>No pitch available</div>
          )}
        </div>
      </div>
      <div className="lg:space-y-8 space-y-4  py-8">
        <h2 className="text-xl lg:text-2xl font-bold">About Us</h2>

        <div
          className="text-gray-600 text-sm text-start"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              recruiter?.bio ||
                "We connect top talent with great companies. Our mission is to make hiring simple, fast, and effective for everyone."
            ),
          }}
        />
      </div>
    </div>
  );
}
