import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const PALE_BLUE_MEDIA_BG = "bg-[#DBEAFE]";
export const PALE_BLUE_MEDIA_TEXT = "text-[#1E3A8A]";

const PLACEHOLDER_SOURCES = [
  "/placeholder.svg",
  "/default-logo.png",
  "via.placeholder.com",
];

export function isRealMediaUrl(src?: string | null): src is string {
  const value = src?.trim();

  if (!value) return false;

  return !PLACEHOLDER_SOURCES.some((placeholder) =>
    value.includes(placeholder),
  );
}

export function getMediaInitials(...values: Array<string | undefined | null>) {
  const initials = values
    .flatMap((value) => value?.trim().split(/\s+/) ?? [])
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials || "GT";
}

type MediaPlaceholderProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  initials?: string;
};

export function MediaPlaceholder({
  className,
  label,
  initials,
  ...props
}: MediaPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        className,
        PALE_BLUE_MEDIA_BG,
        PALE_BLUE_MEDIA_TEXT,
      )}
      {...props}
    >
      {initials ? (
        <span className="font-semibold uppercase">{initials}</span>
      ) : label ? (
        <span className="text-xs font-medium">{label}</span>
      ) : null}
    </div>
  );
}
