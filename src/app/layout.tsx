import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Waypoint", template: "%s · Waypoint" },
  description: "Waypoint: your career, mapped. A private place to share your professional profile.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Waypoint", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FBF8F4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-dvh font-sans text-foreground antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" offset={16} />
      </body>
    </html>
  );
}
