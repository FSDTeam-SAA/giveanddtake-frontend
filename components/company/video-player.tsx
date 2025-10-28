"use client";

import { useSession } from "next-auth/react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  pitchId: string;
  className?: string;
  poster?: string;
  title?: string;
}

const MAX_RETRIES = 4;
const AUTOPLAY_MAX_ATTEMPTS = 3;
const CONTROLS_HIDE_DELAY = 2000;

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
  const controlsContainerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSourceRef = useRef("");
  const autoplayAttemptsRef = useRef(0);

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
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsInteractionRef = useRef(false);

  const formatTime = (sec: number) => {
    if (Number.isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  const tryAutoPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    video.autoplay = true;
    setIsMuted(true);

    if (!video.paused) return;

    if (autoplayAttemptsRef.current >= AUTOPLAY_MAX_ATTEMPTS) {
      return;
    }

    autoplayAttemptsRef.current += 1;

    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch((err) => {
        console.warn("Autoplay blocked or failed:", err);
        if (autoplayAttemptsRef.current < AUTOPLAY_MAX_ATTEMPTS) {
          setTimeout(() => {
            tryAutoPlay();
          }, 500);
        }
      });
    }
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
    const delay = 4000; 
    setRetryCount(next);
    setLoading(true);
    console.warn(`Retrying video init (#${next}) in ${delay}ms due to: ${reason}`);
    retryTimeoutRef.current = setTimeout(() => {
      setError(null);
      runCleanup();
      initHls(latestSourceRef.current);
    }, delay);
  };

  const clearControlsHideTimeout = useCallback(() => {
    if (controlsHideTimeoutRef.current) {
      clearTimeout(controlsHideTimeoutRef.current);
      controlsHideTimeoutRef.current = null;
    }
  }, []);

  const scheduleControlsHide = useCallback(() => {
    clearControlsHideTimeout();
    if (!isPlaying) return;
    controlsHideTimeoutRef.current = setTimeout(() => {
      if (!controlsInteractionRef.current) {
        setShowControls(false);
      }
    }, CONTROLS_HIDE_DELAY);
  }, [clearControlsHideTimeout, isPlaying]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handlePointerActivity = useCallback(
    (event?: React.PointerEvent<HTMLDivElement>) => {
      if (event && controlsContainerRef.current) {
        const target = event.target as Node | null;
        if (target && controlsContainerRef.current.contains(target)) {
          return;
        }
      }
      controlsInteractionRef.current = false;
      revealControls();
    },
    [revealControls]
  );

  const handleMouseLeave = useCallback(() => {
    controlsInteractionRef.current = false;
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handleControlsPointerEnter = useCallback(() => {
    controlsInteractionRef.current = true;
    setShowControls(true);
    clearControlsHideTimeout();
  }, [clearControlsHideTimeout]);

  const handleControlsPointerLeave = useCallback(() => {
    controlsInteractionRef.current = false;
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handleControlsFocus = useCallback(() => {
    controlsInteractionRef.current = true;
    setShowControls(true);
    clearControlsHideTimeout();
  }, [clearControlsHideTimeout]);

  const handleControlsBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const relatedTarget = event.relatedTarget as Node | null;
      if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
        return;
      }
      controlsInteractionRef.current = false;
      scheduleControlsHide();
    },
    [scheduleControlsHide]
  );

  const initHls = (sourceUrl = resolvedSrc) => {
    const sanitizedSrc = typeof sourceUrl === "string" ? sourceUrl.trim() : "";
    if (!sanitizedSrc) {
      setError("Video source missing.");
      setLoading(false);
      return;
    }

    autoplayAttemptsRef.current = 0;

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

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          setRetryCount(0);
          tryAutoPlay();
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

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      clearControlsHideTimeout();
      return;
    }
    scheduleControlsHide();
    return () => {
      clearControlsHideTimeout();
    };
  }, [isPlaying, scheduleControlsHide, clearControlsHideTimeout]);

  useEffect(() => {
    const handleKeyDown = () => {
      revealControls();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [revealControls]);

  useEffect(
    () => () => {
      clearControlsHideTimeout();
    },
    [clearControlsHideTimeout]
  );

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) {
        video.play().catch(() => setError("Playback failed. Please try again."));
      } else {
        video.pause();
      }
    } catch (err) {
      console.error("Play/Pause Error:", err);
      setError("Unable to control playback.");
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    try {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    } catch (err) {
      console.error("Mute Error:", err);
      setError("Unable to control volume.");
    }
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    try {
      const newVol = Number.parseFloat(e.target.value);
      const shouldMute = newVol === 0;
      videoRef.current.volume = newVol;
      videoRef.current.muted = shouldMute;
      setVolume(newVol);
      setIsMuted(shouldMute);
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
  const volumePercent = isMuted ? 0 : volume * 100;

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-5xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-2xl group ${className}`}
      role="region"
      aria-label={title}
      onPointerMove={handlePointerActivity}
      onPointerEnter={handlePointerActivity}
      onPointerDown={handlePointerActivity}
      onPointerLeave={handleMouseLeave}
    >
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-white/15" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
          </div>
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
        className={`w-full h-auto max-h-[80vh] object-contain bg-black transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
        playsInline
        autoPlay
        muted={isMuted}
        preload="auto"
        crossOrigin="anonymous"
        onClick={togglePlay}
        onPlay={() => {
          autoplayAttemptsRef.current = 0;
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        aria-label="Video content"
      >
        Your browser does not support the video tag.
      </video>

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 transition-all duration-300 ease-out ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-gradient-to-t from-black/85 via-black/60 to-transparent px-3 pb-4 pt-8 sm:px-4 sm:pt-10">
          <div
            className={`flex flex-nowrap items-center gap-2 overflow-x-auto text-white text-xs sm:gap-3 sm:text-sm ${
              showControls ? "pointer-events-auto" : "pointer-events-none"
            }`}
            ref={controlsContainerRef}
            role="toolbar"
            aria-label="Video controls"
            onPointerEnter={handleControlsPointerEnter}
            onPointerLeave={handleControlsPointerLeave}
            onPointerDown={handleControlsPointerEnter}
            onFocusCapture={handleControlsFocus}
            onBlurCapture={handleControlsBlur}
            aria-hidden={!showControls}
          >
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16l13-8z" />
                </svg>
              )}
            </button>

            <span className="hidden font-mono text-[13px] tabular-nums sm:block sm:text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex basis-[45%] max-w-[180px] flex-1 items-center sm:basis-auto sm:max-w-full">
              <div className="relative h-1 w-full rounded-full bg-white/25 sm:h-1.5">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step="any"
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Video progress"
                />
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={toggleMute}
                className="text-white transition hover:text-blue-400"
                aria-label={isMuted || volume === 0 ? "Unmute video" : "Mute video"}
              >
                {isMuted || volume === 0 ? (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H3a1 1 0 01-1-1V10a1 1 0 011-1h2.586l4.586-4.586a2 2 0 012.828 0M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H3a1 1 0 01-1-1V10a1 1 0 011-1h2.586L8 6.586A2 2 0 019.414 6H11"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H3a1 1 0 01-1-1V10a1 1 0 011-1h2.586L8 6.586A2 2 0 019.414 6H11"
                    />
                  </svg>
                )}
              </button>
              <div className="relative h-1.5 w-16 rounded-full bg-white/20 sm:w-28">
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
                  onChange={handleVolumeSliderChange}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Volume control"
                />
              </div>
            </div>

         

            <button
              type="button"
              onClick={toggleFullscreen}
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Toggle fullscreen"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
