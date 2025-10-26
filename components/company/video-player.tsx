"use client";

import { useSession } from "next-auth/react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  pitchId: string;
  className?: string;
  poster?: string;
  title?: string;
}

const qualityLabels: Record<string | number, string> = {
  "-1": "Auto",
  360: "360p",
  480: "480p",
  720: "720p",
  1080: "1080p",
};

const MAX_RETRIES = 4;

export function VideoPlayer({
  pitchId,
  className = "",
  poster = "/placeholder.svg?height=300&width=500",
  title = "Video Player",
}: VideoPlayerProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSourceRef = useRef("");

  const resolvedSrc = useMemo(() => {
    const trimmedId = pitchId?.trim();
    if (!trimmedId) return "";
    const base = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
    if (!base) return "";
    return `${base}/elevator-pitch/stream/${trimmedId}`;
  }, [pitchId]);

  latestSourceRef.current = resolvedSrc;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [levels, setLevels] = useState<Array<{ height: number }>>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [volume, setVolume] = useState(1);

  const formatTime = (sec: number) => {
    if (Number.isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  const tryAutoPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = video.muted || true;
    video
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const clearRetryTimeout = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const registerCleanup = (fn: () => void) => {
    const wrapped = () => {
      fn();
      if (cleanupRef.current === wrapped) {
        cleanupRef.current = null;
      }
    };
    cleanupRef.current = wrapped;
    return wrapped;
  };

  const runCleanup = () => {
    if (cleanupRef.current) cleanupRef.current();
  };

  const scheduleRetry = (reason: string) => {
    if (retryCount >= MAX_RETRIES) {
      setError("An error occurred while loading the video.");
      setLoading(false);
      return;
    }
    clearRetryTimeout();
    const next = retryCount + 1;
    const delay = Math.min(1000 * 2 ** (next - 1), 10000);
    setRetryCount(next);
    setLoading(true);
    console.warn(`Retrying video init (#${next}) in ${delay}ms due to: ${reason}`);
    retryTimeoutRef.current = setTimeout(() => {
      setError(null);
      runCleanup();
      initHls(latestSourceRef.current);
    }, delay);
  };

  const initHls = (sourceUrl = resolvedSrc) => {
    const sanitizedSrc = typeof sourceUrl === "string" ? sourceUrl.trim() : "";
    if (!sanitizedSrc) {
      setError("Video source missing.");
      setLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setError("Video element not found.");
      setLoading(false);
      return;
    }

    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // ignore
      }
      hlsRef.current = null;
    }

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };
    const handleCanPlay = () => {
      setLoading(false);
      tryAutoPlay();
    };
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleVideoError = () => scheduleRetry("video-error");

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("error", handleVideoError);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        startLevel: -1,
        autoStartLoad: true,
        xhrSetup: (xhr: XMLHttpRequest) => {
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
        },
      });
      hlsRef.current = hls;

      try {
        hls.attachMedia(video);
        hls.loadSource(sanitizedSrc);

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          const filtered = data.levels.filter((level: { height: number }) =>
            [360, 480, 720, 1080].includes(level.height)
          );
          setLevels(filtered);
          setCurrentLevel(-1);
          setLoading(false);
          setRetryCount(0);
          tryAutoPlay();
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          setCurrentLevel(data.level);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error("HLS Error:", data);
          if (!hlsRef.current) return;

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                scheduleRetry("network");
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                try {
                  hlsRef.current?.recoverMediaError();
                } catch {
                  scheduleRetry("media");
                }
                break;
              default:
                scheduleRetry("unknown-fatal");
            }
          }
        });
      } catch (err) {
        console.error("HLS Setup Error:", err);
        scheduleRetry("setup");
      }

      return registerCleanup(() => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("volumechange", handleVolumeChange);
        video.removeEventListener("error", handleVideoError);
        if (hlsRef.current) {
          try {
            hlsRef.current.destroy();
          } catch {
            // ignore
          }
          hlsRef.current = null;
        }
      });
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sanitizedSrc;
      const onLoadedMetadata = () => {
        setLoading(false);
        setLevels([]);
        setRetryCount(0);
        tryAutoPlay();
      };
      const onError = () => scheduleRetry("native-hls-error");
      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("error", onError);

      return registerCleanup(() => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("volumechange", handleVolumeChange);
        video.removeEventListener("error", handleVideoError);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("error", onError);
      });
    }

    setError("Your browser does not support HLS playback.");
    setRetryCount(MAX_RETRIES);
    setLoading(false);
    return registerCleanup(() => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("error", handleVideoError);
    });
  };

  useEffect(() => {
    clearRetryTimeout();
    setRetryCount(0);
    setError(null);
    setLoading(true);
    initHls(resolvedSrc);
    return () => {
      clearRetryTimeout();
      runCleanup();
    };
  }, [resolvedSrc, token]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => setError("Playback failed. Please try again."));
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error("Play/Pause Error:", err);
      setError("Unable to control playback.");
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    try {
      videoRef.current.muted = !videoRef.current.muted;
    } catch (err) {
      console.error("Mute Error:", err);
      setError("Unable to control volume.");
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    try {
      const newVol = Number.parseFloat(e.target.value);
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    } catch (err) {
      console.error("Volume Change Error:", err);
      setError("Unable to adjust volume.");
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    try {
      const newTime = Number.parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
    } catch (err) {
      console.error("Seek Error:", err);
      setError("Unable to seek video.");
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current || !duration) return;
    try {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
    } catch (err) {
      console.error("Skip Error:", err);
      setError("Unable to skip video.");
    }
  };

  const changeQuality = (level: number) => {
    if (!hlsRef.current) return;
    try {
      hlsRef.current.currentLevel = level;
      setCurrentLevel(level);
    } catch (err) {
      console.error("Quality Change Error:", err);
      setError("Unable to change video quality.");
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          /* ignore */
        });
      } else {
        containerRef.current.requestFullscreen().catch(() => {
          /* ignore */
        });
      }
    } catch (err) {
      console.error("Fullscreen Error:", err);
      setError("Unable to toggle fullscreen.");
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const volumePercent = volume * 100;

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-5xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-2xl group ${className}`}
      role="region"
      aria-label={title}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-blue-500" />
        </div>
      )}

      {error && retryCount >= MAX_RETRIES && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="rounded-lg bg-gray-800 p-6 text-center">
            <p className="mb-4 text-lg text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setRetryCount(0);
                setLoading(true);
                initHls();
              }}
              className="rounded-full bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        poster={poster}
        className="aspect-video w-full object-cover"
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        aria-label="Video content"
      >
        Your browser does not support the video tag.
      </video>

      <div className="absolute bottom-20 left-4 right-4 z-10">
        <div className="relative h-2 rounded-full bg-gray-700">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration}
            step="any"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Video progress"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-300">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:opacity-100"
        role="toolbar"
        aria-label="Video controls"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button
              type="button"
              onClick={() => skip(-10)}
              className="p-2 text-white transition hover:text-blue-400"
              aria-label="Skip backward 10 seconds"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="p-3 text-white transition hover:text-blue-400"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16l13-8z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => skip(10)}
              className="p-2 text-white transition hover:text-blue-400"
              aria-label="Skip forward 10 seconds"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={toggleMute}
              className="text-white transition hover:text-blue-400"
              aria-label={isMuted || volume === 0 ? "Unmute video" : "Mute video"}
            >
              {isMuted || volume === 0 ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H3a1 1 0 01-1-1V10a1 1 0 011-1h2.586l4.586-4.586a2 2 0 012.828 0M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H3a1 1 0 01-1-1V10a1 1 0 011-1h2.586L8 6.586A2 2 0 019.414 6H11"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H3a1 1 0 01-1-1V10a1 1 0 011-1h2.586L8 6.586A2 2 0 019.414 6H11"
                  />
                </svg>
              )}
            </button>
            <div className="relative h-2 w-20 rounded-full bg-gray-700">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-200"
                style={{ width: `${volumePercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Volume control"
              />
            </div>

            {levels.length > 0 && (
              <select
                value={currentLevel}
                onChange={(e) => changeQuality(Number.parseInt(e.target.value, 10))}
                className="cursor-pointer rounded-lg bg-black/70 px-3 py-1.5 text-sm text-white transition-colors hover:bg-black/90"
                aria-label="Select video quality"
              >
                <option value="-1">{qualityLabels[-1]}</option>
                {levels.map((level, index) => (
                  <option key={index} value={index}>
                    {qualityLabels[level.height] || `${level.height}p`}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 text-white transition hover:text-blue-400"
              aria-label="Toggle fullscreen"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
