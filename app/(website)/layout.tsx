import type { Metadata } from "next";
import "../globals.css";
import { SiteHeader } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

export const metadata: Metadata = {
  title: "Elevator Pitch",
  description: "Shape Your Future with the Right Elevator Pitch",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <SiteHeader />
      {children}
      <Footer />
    </div>
  );
}
