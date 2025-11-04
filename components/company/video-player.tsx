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
const AUTOPLAY_MAX_ATTEMPTS = 2;
const CONTROLS_HIDE_DELAY = 2000;

export function VideoPlayer({
  pitchId,
  className = "",
  poster = "/assets/thumbnail.png",
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
  const seekingRef = useRef(false);

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
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    if (!video || !video.paused) return;
    if (autoplayAttemptsRef.current >= AUTOPLAY_MAX_ATTEMPTS) return;

    autoplayAttemptsRef.current += 1;
    video.defaultMuted = false;
    video.muted = false;

    const playPromise = video.play();
    playPromise?.catch(() => {
      // Autoplay blocked – user must interact
    });
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
      if (cleanupRef.current === wrapped) cleanupRef.current = null;
    };
    cleanupRef.current = wrapped;
    return wrapped;
  };

  const runCleanup = () => {
    cleanupRef.current?.();
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
  }, [isPlaying, clearControlsHideTimeout]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handlePointerActivity = useCallback(
    (event?: React.PointerEvent<HTMLDivElement>) => {
      if (event && controlsContainerRef.current?.contains(event.target as Node)) {
        return;
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
      if (relatedTarget && event.currentTarget.contains(relatedTarget)) return;
      controlsInteractionRef.current = false;
      scheduleControlsHide();
    },
    [scheduleControlsHide]
  );

  const initHls = (sourceUrl = resolvedSrc) => {
    const sanitizedSrc = sourceUrl.trim();
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
      try { hlsRef.current.destroy(); } catch {}
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
      if (!seekingRef.current) {
        setVolume(video.volume);
        setIsMuted(video.muted);
      }
    };
    const handleVideoError = () => scheduleRetry("video-error");

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("error", handleVideoError);

    video.defaultMuted = false;
    video.muted = false;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        startLevel: -1,
        autoStartLoad: true,
        xhrSetup: (xhr) => {
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
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
          if (!hlsRef.current || !data.fatal) return;

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              scheduleRetry("network");
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              try { hlsRef.current.recoverMediaError(); } catch { scheduleRetry("media"); }
              break;
            default:
              scheduleRetry("unknown-fatal");
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
          try { hlsRef.current.destroy(); } catch {}
          hlsRef.current = null;
        }
      });
    }

    // Native HLS (Safari)
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

  // Initialize HLS
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

  // Controls visibility
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      clearControlsHideTimeout();
      return;
    }
    scheduleControlsHide();
    return () => clearControlsHideTimeout();
  }, [isPlaying, scheduleControlsHide, clearControlsHideTimeout]);

  // Global keydown
  useEffect(() => {
    const handleKeyDown = () => revealControls();
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [revealControls]);

  // Cleanup on unmount
  useEffect(() => () => clearControlsHideTimeout(), [clearControlsHideTimeout]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreen = !!document.fullscreenElement;
      setIsFullscreen(fullscreen);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => setError("Playback failed."));
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setIsMuted(next);
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = parseFloat(e.target.value);
    const shouldMute = newVol === 0;
    seekingRef.current = false;
    video.volume = newVol;
    video.muted = shouldMute;
    setVolume(newVol);
    setIsMuted(shouldMute);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    seekingRef.current = true;
    const prevMuted = video.muted;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    if (video.muted !== prevMuted) {
      video.muted = prevMuted;
      setIsMuted(prevMuted);
    }
    seekingRef.current = false;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      setError("Fullscreen not supported.");
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  return (
    <div
      ref={containerRef}
      className={`
        relative w-full mx-auto
        ${isFullscreen ? 'h-screen' : 'aspect-video max-w-5xl'}
        bg-black rounded-xl overflow-hidden shadow-2xl group
        ${className}
      `}
      style={isFullscreen ? { height: '100vh' } : {}}
      role="region"
      aria-label={title}
      onPointerMove={handlePointerActivity}
      onPointerEnter={handlePointerActivity}
      onPointerDown={handlePointerActivity}
      onPointerLeave={handleMouseLeave}
    >
      {/* Optional: Subtle fallback gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 pointer-events-none" />

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-white/15" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && retryCount >= MAX_RETRIES && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-4">
          <div className="rounded-lg bg-gray-800 p-6 text-center max-w-sm">
            <p className="mb-4 text-lg text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setRetryCount(0);
                setLoading(true);
                initHls();
              }}
              className="rounded-full bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Video Element - Full 16:9 Cover */}
      <video
        ref={videoRef}
        poster={poster}
        className={`
          absolute inset-0 w-full h-full
          object-cover
          bg-black transition-all duration-300
          ${loading ? 'opacity-0' : 'opacity-100'}
        `}
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

      {/* Controls */}
      <div
        className={`
          pointer-events-none absolute inset-x-0 bottom-0 z-10
          transition-all duration-300 ease-out
          ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}
      >
        <div className="bg-gradient-to-t from-black/85 via-black/60 to-transparent px-3 pb-4 pt-8 sm:px-4 sm:pt-10">
          <div
            ref={controlsContainerRef}
            className={`
              flex flex-nowrap items-center gap-2 overflow-x-auto text-white text-xs sm:gap-3 sm:text-sm
              ${showControls ? "pointer-events-auto" : "pointer-events-none"}
            `}
            role="toolbar"
            aria-label="Video controls"
            onPointerEnter={handleControlsPointerEnter}
            onPointerLeave={handleControlsPointerLeave}
            onPointerDown={handleControlsPointerEnter}
            onFocusCapture={handleControlsFocus}
            onBlurCapture={handleControlsBlur}
            aria-hidden={!showControls}
          >
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={isPlaying ? "Pause" : "Play"}
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

            {/* Timestamp */}
            <span className="hidden font-mono text-[13px] tabular-nums sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Progress Bar */}
            <div className="flex basis-[45%] max-w-[180px] flex-1 items-center sm:basis-auto sm:max-w-full">
              <div className="relative h-1 w-full rounded-full bg-white/25 sm:h-1.5">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
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
                  aria-label="Seek"
                />
              </div>
            </div>

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="text-white transition hover:text-blue-400"
              aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H3a1 1 0 01-1-1V10a1 1 0 011-1h2.586l4.586-4.586a2 2 0 012.828 0M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H3a1 1 0 01-1-1V10a1 1 0 011-1h2.586L8 6.586A2 2 0 019.414 6H11" />
                </svg>
              ) : (
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H3a1 1 0 01-1-1V10a1 1 0 011-1h2.586L8 6.586A2 2 0 019.414 6H11" />
                </svg>
              )}
            </button>

            {/* Volume Slider (Desktop) */}
            <div className="relative h-1.5 w-16 rounded-full bg-white/20 sm:w-28 hidden sm:block">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                style={{ width: `${volumePercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeSliderChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Volume"
              />
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Toggle fullscreen"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;