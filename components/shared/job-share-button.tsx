"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FacebookIcon, LinkedinIcon, TelegramIcon } from "next-share";
import { FaInstagram, FaTiktok, FaXTwitter } from "react-icons/fa6";
import { RiShareForwardLine } from "react-icons/ri";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { jobShareLinks, jobShareUrl } from "@/lib/job-sharing";

const socialIcons: Record<string, ReactNode> = {
  Facebook: <FacebookIcon size={32} round />,
  X: <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white"><FaXTwitter className="h-4 w-4" /></span>,
  LinkedIn: <LinkedinIcon size={32} round />,
  Telegram: <TelegramIcon size={32} round />,
};

const copyPlatforms = [
  { name: "Instagram", url: "https://www.instagram.com/", icon: <FaInstagram className="h-5 w-5" />, color: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" },
  { name: "TikTok", url: "https://www.tiktok.com/", icon: <FaTiktok className="h-4 w-4" />, color: "bg-black" },
] as const;

export default function JobShareButton({ jobId, title }: { jobId: string; title: string }) {
  const [nativeSharing, setNativeSharing] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [copyPlatform, setCopyPlatform] = useState<(typeof copyPlatforms)[number] | null>(null);
  const url = jobShareUrl(jobId);
  useEffect(() => setNativeSharing(typeof navigator.share === "function"), []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Job link copied");
    } catch {
      setShowLink(true);
      toast.error("Please select and copy the link below.");
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title, text: `Check out this job: ${title}`, url });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) toast.error("Unable to share. Please copy the job link.");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="rounded-full border-gray-300 bg-white shadow-sm" onClick={(event) => event.stopPropagation()} aria-label={`Share job: ${title}`}>
          <RiShareForwardLine className="mr-2 h-5 w-5" aria-hidden="true" /> Share
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" aria-label="Share job" className="w-auto max-w-[calc(100vw-2rem)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-xl bg-white p-3 shadow-lg" onClick={(event) => event.stopPropagation()}>
        <p className="sr-only">Share this job</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {jobShareLinks(jobId, title).map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.name} title={`Share on ${link.name}`} className="shrink-0 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              <span aria-hidden="true">{socialIcons[link.name]}</span>
            </a>
          ))}
          {copyPlatforms.map((platform) => (
            <button key={platform.name} type="button" aria-label={platform.name} title={`Share on ${platform.name}`} aria-pressed={copyPlatform?.name === platform.name} onClick={() => setCopyPlatform(platform)} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${platform.color}`}>
              <span aria-hidden="true">{platform.icon}</span>
            </button>
          ))}
          <Button type="button" variant="outline" size="sm" className="h-7 rounded-full border-gray-300 px-3 text-xs" aria-label="Copy link" onClick={copyLink}>Copy</Button>
          {nativeSharing && <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-full border-gray-300" aria-label="Share via..." title="More sharing options" onClick={share}><RiShareForwardLine className="h-4 w-4" aria-hidden="true" /></Button>}
        </div>
        {copyPlatform && (
          <div className="mt-3 max-w-xs border-t pt-3 text-sm" role="status">
            <p className="font-medium">Share on {copyPlatform.name}</p>
            <p className="mt-1 text-gray-600">Copy the job link, then open {copyPlatform.name} and paste it where you want to share it.</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={copyLink}>Copy job link</Button>
              <a href={copyPlatform.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Open {copyPlatform.name}</a>
            </div>
          </div>
        )}
        {(showLink || copyPlatform) && <input aria-label="Job link" className="mt-2 w-full rounded border p-2 text-xs" readOnly value={url} onFocus={(event) => event.target.select()} />}
      </PopoverContent>
    </Popover>
  );
}
