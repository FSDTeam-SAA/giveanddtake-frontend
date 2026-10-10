"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FacebookIcon, LinkedinIcon, TelegramIcon } from "next-share";
import { FaXTwitter } from "react-icons/fa6";
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

export default function JobShareButton({ jobId, title }: { jobId: string; title: string }) {
  const [nativeSharing, setNativeSharing] = useState(false);
  const [showLink, setShowLink] = useState(false);
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
      <PopoverContent align="end" aria-label="Share job" className="w-auto max-w-[calc(100vw-1rem)] rounded-xl bg-white p-3 shadow-lg" onClick={(event) => event.stopPropagation()}>
        <p className="sr-only">Share this job</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {jobShareLinks(jobId, title).map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.name} title={`Share on ${link.name}`} className="shrink-0 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              <span aria-hidden="true">{socialIcons[link.name]}</span>
            </a>
          ))}
          <Button type="button" variant="outline" size="sm" className="h-7 rounded-full border-gray-300 px-3 text-xs" aria-label="Copy link" onClick={copyLink}>Copy</Button>
          {nativeSharing && <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-full border-gray-300" aria-label="Share via..." title="More sharing options" onClick={share}><RiShareForwardLine className="h-4 w-4" aria-hidden="true" /></Button>}
        </div>
        {showLink && <input aria-label="Job link" className="mt-2 w-full rounded border p-2 text-xs" readOnly value={url} onFocus={(event) => event.target.select()} />}
      </PopoverContent>
    </Popover>
  );
}
