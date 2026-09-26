import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shanvi Hospitality CRM | Tour Operations & Lead Engine",
  description: "Enterprise Travel CRM, DMC Lead Pipeline, Itinerary Builder, and Booking Operations for Shanvi Hospitality.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shanvi CRM",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B35",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="/register-sw.js" defer />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
