import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query";
import { Roboto } from "next/font/google";
import { Toaster } from "sonner";
import { DynamicTitle } from "@/components/DynamicTitle";
import TopLoader from "./TopLoader";
import { Suspense } from "react";

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const SITE_URL = "https://evpitch.com";
const SITE_NAME = "Elevator Video Pitch©";
const SITE_DESCRIPTION =
  "Elevator Video Pitch© (EVP) connects candidates, recruiters and companies through 60-second video pitches. Get hired, find talent and post jobs faster with your Elevator Video Pitch.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Elevator Video Pitch© | Get Hired With a 60-Second Video Pitch",
    template: "%s | Elevator Video Pitch©",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Elevator Video Pitch",
    "EVP",
    "video pitch",
    "video resume",
    "video CV",
    "elevator pitch",
    "get hired",
    "job search",
    "recruitment",
    "hiring platform",
    "find candidates",
    "post a job",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Business",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Elevator Video Pitch© | Get Hired With a 60-Second Video Pitch",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elevator Video Pitch© | Get Hired With a 60-Second Video Pitch",
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: "/assets/fav.ico",
  },
};

/** Sitewide structured data helps Google and AI answer engines understand the brand. */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "EVP",
  url: SITE_URL,
  logo: `${SITE_URL}/assets/evp-logo.jpg`,
  description: SITE_DESCRIPTION,
  contactPoint: {
    "@type": "ContactPoint",
    email: "clientsupport@evpitch.com",
    telephone: "+44 0203 954 2530",
    contactType: "customer support",
    areaServed: "GB",
    availableLanguage: "English",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "124 City Road",
    addressLocality: "London",
    postalCode: "EC1V 2NX",
    addressCountry: "GB",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/all-users?s={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Suspense fallback={null}>
          <DynamicTitle />
          <TopLoader />
        </Suspense>
        <ReactQueryProvider>{children}</ReactQueryProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
