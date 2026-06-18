"use client";

import React from "react";
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  WhatsappShareButton,
  WhatsappIcon,
  LinkedinShareButton,
  LinkedinIcon,
  TelegramShareButton,
  TelegramIcon,
} from "next-share";
import { RiShareForwardLine } from "react-icons/ri";
import { FaInstagram, FaTiktok } from "react-icons/fa6";
import { toast } from "sonner";

type Props = {
  jobId: string;
  title?: string;
  summary?: string;
  className?: string;
};

/**
 * Share popover for a job advert. Mirrors the profile share UX
 * (`CandidateSharePopover`) — same trigger, popover, social buttons and copy
 * link — but builds a job URL (`/alljobs/:id`).
 *
 * The base URL prefers `NEXT_PUBLIC_BASE_SHARE_URL` and falls back to the
 * current browser origin, so links resolve correctly even if the env var is
 * not configured.
 */
export default function JobSharePopover({
  jobId,
  title = "Check out this job",
  summary = "Job opening",
  className = "",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const buildUrl = (id: string) => {
    const base =
      process.env.NEXT_PUBLIC_BASE_SHARE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return `${base}/alljobs/${id}`;
  };

  const url = buildUrl(jobId);

  /** responsive positioning state */
  const [alignRight, setAlignRight] = React.useState(false);
  const [placeAbove, setPlaceAbove] = React.useState(false);
  const [useMobileCenter, setUseMobileCenter] = React.useState(false);

  /** tune these if you change popup size/padding */
  const POPUP_WIDTH = 400; // px (approx; matches icon row + copy)
  const POPUP_HEIGHT = 56; // px (approx)
  const EDGE_PAD = 8; // px safe padding from viewport edge

  const recalcPlacement = React.useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Mobile rule: center a compact popup
    const mobile = vw < 400;
    setUseMobileCenter(mobile);

    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Horizontal: align right if overflow on the right
    const wouldOverflowRight = rect.left + POPUP_WIDTH + EDGE_PAD > vw;
    const shouldRight = wouldOverflowRight || rect.left > vw / 2;
    setAlignRight(shouldRight);

    // Vertical: place above if not enough space below
    const roomBelow = vh - rect.bottom;
    const shouldAbove = roomBelow < POPUP_HEIGHT + 16; // 16 = a little gap
    setPlaceAbove(shouldAbove);
  }, []);

  // close on outside click / Esc; recompute on resize/scroll.
  // Only attach the global listeners while the popover is open so we don't run
  // getBoundingClientRect on every page scroll when nothing is shown.
  React.useEffect(() => {
    if (!open) return;

    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => recalcPlacement();
    const onScroll = () => recalcPlacement();

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, recalcPlacement]);

  React.useEffect(() => {
    if (open) recalcPlacement();
  }, [open, recalcPlacement]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Job link copied to clipboard");
    } catch {
      toast.error("Could not copy the link");
    }
    setOpen(false);
  };

  const copyAndOpenPlatform = async (
    platformUrl: string,
    platformName: string,
  ) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`Job link copied. Opening ${platformName}.`);
      window.open(platformUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(`Could not copy the link for ${platformName}`);
    }
    setOpen(false);
  };

  const platformButtonClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60";

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group inline-flex items-center gap-2
                   rounded-full border border-gray-300 bg-white
                   px-3 py-1.5 shadow-sm
                   hover:bg-gray-50 hover:shadow
                   active:translate-y-px
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60
                   transition"
      >
        <RiShareForwardLine className="w-5 h-5 text-gray-700 group-hover:text-gray-900" />
        <span className="text-sm text-gray-700 group-hover:text-gray-900">
          Share job
        </span>
      </button>

      {/* Popup (responsive positioning) */}
      {open && (
        <>
          {/* Desktop / tablet: anchored popover that flips/aligns */}
          {!useMobileCenter && (
            <div
              role="dialog"
              aria-label="Share job"
              className={[
                "absolute z-30 bg-white border shadow-lg rounded-xl p-3",
                "flex items-center gap-2",
                // vertical placement
                placeAbove ? "bottom-[125%] mb-2" : "top-[125%] mt-2",
                // horizontal alignment
                alignRight ? "right-0" : "left-0",
                "w-[min(400px,90vw)]",
              ].join(" ")}
              style={{ maxWidth: 420 }}
            >
              <FacebookShareButton
                url={url}
                quote={title}
                onClick={() => setOpen(false)}
              >
                <FacebookIcon className="w-8 h-8" round />
              </FacebookShareButton>

              <TwitterShareButton
                url={url}
                title={title}
                onClick={() => setOpen(false)}
              >
                <TwitterIcon className="w-8 h-8" round />
              </TwitterShareButton>

              <WhatsappShareButton
                url={url}
                title={title}
                separator=" — "
                onClick={() => setOpen(false)}
              >
                <WhatsappIcon className="w-8 h-8" round />
              </WhatsappShareButton>

              <LinkedinShareButton
                url={url}
                title={title}
                summary={summary}
                onClick={() => setOpen(false)}
              >
                <LinkedinIcon className="w-8 h-8" round />
              </LinkedinShareButton>

              <TelegramShareButton
                url={url}
                title={title}
                onClick={() => setOpen(false)}
              >
                <TelegramIcon className="w-8 h-8" round />
              </TelegramShareButton>

              <button
                type="button"
                onClick={() =>
                  copyAndOpenPlatform("https://www.instagram.com/", "Instagram")
                }
                className={`${platformButtonClass} bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]`}
                title="Share on Instagram"
                aria-label="Share job on Instagram"
              >
                <FaInstagram className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  copyAndOpenPlatform("https://www.tiktok.com/", "TikTok")
                }
                className={`${platformButtonClass} bg-black`}
                title="Share on TikTok"
                aria-label="Share job on TikTok"
              >
                <FaTiktok className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={copyToClipboard}
                className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:bg-gray-50"
                title="Copy link"
              >
                Copy
              </button>
            </div>
          )}

          {/* Small screens: centered compact popover */}
          {useMobileCenter && (
            <div
              role="dialog"
              aria-label="Share job"
              className="absolute z-30 left-1/2 -translate-x-1/2 top-[125%] mt-2
                         bg-white border shadow-lg rounded-xl p-3
                         flex flex-wrap items-center justify-center gap-2
                         w-[min(92vw,360px)]"
            >
              <FacebookShareButton
                url={url}
                quote={title}
                onClick={() => setOpen(false)}
              >
                <FacebookIcon className="w-8 h-8" round />
              </FacebookShareButton>

              <TwitterShareButton
                url={url}
                title={title}
                onClick={() => setOpen(false)}
              >
                <TwitterIcon className="w-8 h-8" round />
              </TwitterShareButton>

              <WhatsappShareButton
                url={url}
                title={title}
                separator=" — "
                onClick={() => setOpen(false)}
              >
                <WhatsappIcon className="w-8 h-8" round />
              </WhatsappShareButton>

              <LinkedinShareButton
                url={url}
                title={title}
                summary={summary}
                onClick={() => setOpen(false)}
              >
                <LinkedinIcon className="w-8 h-8" round />
              </LinkedinShareButton>

              <TelegramShareButton
                url={url}
                title={title}
                onClick={() => setOpen(false)}
              >
                <TelegramIcon className="w-8 h-8" round />
              </TelegramShareButton>

              <button
                type="button"
                onClick={() =>
                  copyAndOpenPlatform("https://www.instagram.com/", "Instagram")
                }
                className={`${platformButtonClass} bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]`}
                title="Share on Instagram"
                aria-label="Share job on Instagram"
              >
                <FaInstagram className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  copyAndOpenPlatform("https://www.tiktok.com/", "TikTok")
                }
                className={`${platformButtonClass} bg-black`}
                title="Share on TikTok"
                aria-label="Share job on TikTok"
              >
                <FaTiktok className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={copyToClipboard}
                className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:bg-gray-50"
                title="Copy link"
              >
                Copy
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
