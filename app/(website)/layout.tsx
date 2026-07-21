import type { Metadata } from "next";
import "../globals.css";
import { SiteHeader } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import ChatbotWidget from "@/components/chatbot-widget";

export const metadata: Metadata = {
  // `absolute` prevents the root title template from double-branding pages that
  // don't set their own title. Child pages that DO set a title (e.g.
  // /pages/[slug]) still inherit the root "%s | Elevator Video Pitch©" template.
  title: {
    absolute: "Elevator Video Pitch© | Get Hired With a 60-Second Video Pitch",
  },
  description: "Shape Your Future with the Right Elevator Video Pitch©",
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
      <ChatbotWidget />
    </div>
  );
}
