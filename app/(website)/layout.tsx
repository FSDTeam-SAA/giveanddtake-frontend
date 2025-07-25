import type { Metadata } from "next";
import "../globals.css";
import { SiteHeader } from "@/components/shared/site-header";
import { Footer } from "@/components/shared/footer";

export const metadata: Metadata = {
  title: "Elevator Pitch",
  description: "Shape Your Future with the Right Elevator Pitch"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <Footer />
      </body>
    </html>
  );
}
