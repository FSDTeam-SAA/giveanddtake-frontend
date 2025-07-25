import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elivator Pitch",
  description: "Shape Your Future with the Right Elevator Pitch"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
