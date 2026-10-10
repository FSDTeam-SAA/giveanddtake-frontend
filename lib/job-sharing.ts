export const jobShareUrl = (jobId: string) => `https://evpitch.com/alljobs/${encodeURIComponent(jobId)}`;

export function jobShareLinks(jobId: string, title: string) {
  const url = encodeURIComponent(jobShareUrl(jobId));
  const text = encodeURIComponent(`${title}\n${jobShareUrl(jobId)}`);
  return [
    { name: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
    { name: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { name: "WhatsApp", url: `https://wa.me/?text=${text}` },
    { name: "X", url: `https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(title)}` },
  ];
}
