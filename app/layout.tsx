import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elevator Pitch",
  description: "Shape Your Future with the Right Elevator Pitch",
  icons: {
    icon: "/assets/fav.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <ReactQueryProvider>{children}</ReactQueryProvider>
        <Script
          src="https://www.paypal.com/sdk/js?client-id=AXmwL-mntKGqTAb6_DaY5o6qh5R0UTxuMkwDJsgUlHW72W-x5t4SZsgSNi9XOfbGYoxlAHiXlSsjnB_L&currency=USD&intent=capture&disable-funding=paylater,venmo"
          data-sdk-integration-source="button-factory"
          strategy="afterInteractive"
        />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
