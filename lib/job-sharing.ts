export const jobShareUrl = (jobId: string) => `https://evpitch.com/alljobs/${encodeURIComponent(jobId)}`;

export function jobShareLinks(jobId: string, title: string) {
  const url = encodeURIComponent(jobShareUrl(jobId));
  return [
    { name: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { name: "X", url: `https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(title)}` },
    { name: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
    { name: "Telegram", url: `https://t.me/share/url?url=${url}&text=${encodeURIComponent(title)}` },
  ];
}
