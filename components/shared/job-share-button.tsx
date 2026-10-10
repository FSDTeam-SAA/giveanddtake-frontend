"use client";

import { useEffect, useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { jobShareLinks, jobShareUrl } from "@/lib/job-sharing";

export default function JobShareButton({ jobId, title }: { jobId: string; title: string }) {
  const [nativeSharing, setNativeSharing] = useState(false);
  const url = jobShareUrl(jobId);
  useEffect(() => setNativeSharing(typeof navigator.share === "function"), []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Job link copied");
    } catch {
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
        <Button type="button" variant="outline" size="sm" onClick={(event) => event.stopPropagation()} aria-label={`Share job: ${title}`}>
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64" onClick={(event) => event.stopPropagation()}>
        <p className="mb-3 font-semibold">Share this job</p>
        <div className="grid grid-cols-2 gap-2">
          {jobShareLinks(jobId, title).map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded border px-3 py-2 text-center text-sm hover:bg-muted">
              {link.name}
            </a>
          ))}
        </div>
        {nativeSharing && <Button type="button" variant="outline" className="mt-3 w-full" onClick={share}>Share via...</Button>}
        <Button type="button" variant="outline" className="mt-3 w-full" onClick={copyLink}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
        <input aria-label="Job link" className="mt-2 w-full rounded border p-2 text-xs" readOnly value={url} onFocus={(event) => event.target.select()} />
      </PopoverContent>
    </Popover>
  );
}
