import type { ReactNode } from "react";
import { getPublicPageMetadata } from "@/lib/seo";

export const metadata = getPublicPageMetadata("/recruiter-pricing");

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
