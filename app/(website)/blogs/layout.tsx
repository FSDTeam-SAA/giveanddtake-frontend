import type { ReactNode } from "react";
import { getPublicPageMetadata } from "@/lib/seo";

export const metadata = getPublicPageMetadata("/blogs");

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
