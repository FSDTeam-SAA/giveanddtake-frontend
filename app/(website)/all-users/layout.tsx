import type { ReactNode } from "react";
import { getInternalPageMetadata, INTERNAL_PAGE_TITLES } from "@/lib/seo";

export const metadata = getInternalPageMetadata(INTERNAL_PAGE_TITLES["/all-users"]);

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
