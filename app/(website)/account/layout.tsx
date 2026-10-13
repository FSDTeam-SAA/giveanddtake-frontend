import type { ReactNode } from "react";
import ProfileLayout from "./account-layout-client";
import { getInternalPageMetadata, INTERNAL_PAGE_TITLES } from "@/lib/seo";

export const metadata = getInternalPageMetadata(INTERNAL_PAGE_TITLES["/account"]);

export default function Layout({ children }: { children: ReactNode }) {
  return <ProfileLayout>{children}</ProfileLayout>;
}
