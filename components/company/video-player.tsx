"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  pitchId: string;
  className?: string;
}

export function VideoPlayer({ pitchId, className = "" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const session = useSession();
  const token = session.data?.accessToken;
  // const userId = session.data?.user?.id;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const hlsUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/elevator-pitch/stream/${pitchId}`;

    // Check if HLS.js is supported
    if (typeof window !== "undefined" && "Hls" in window) {
      const Hls = (window as any).Hls;

      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr: XMLHttpRequest) => {
            // Add auth header if available

            if (token) {
              xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }
          },
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          console.error("HLS Error:", data);
        });

        return () => {
          hls.destroy();
        };
      }
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
    }
  }, [pitchId]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        controls
        className="w-full h-full rounded-lg"
        poster="/placeholder.svg?height=300&width=500"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
