import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query";
import { Roboto } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { DynamicTitle } from "@/components/DynamicTitle";

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="font-sans">
        <DynamicTitle />
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
