import "../globals.css";
import { SiteHeader } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import ChatbotWidget from "@/components/chatbot-widget";

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
