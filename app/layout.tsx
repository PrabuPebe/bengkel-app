import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pitcare.auto"),
  title: "PitCare Auto — Sistem Manajemen Bengkel Modern",
  description:
    "Sistem operasional otomotif modern berstandar enterprise: Work Order Servis, Billing Kasir, Manajemen Suku Cadang, dan Live Service Tracking PitCare Auto.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "PitCare Auto — Sistem Manajemen Bengkel Modern",
    description:
      "Platform terintegrasi operasional otomotif PitCare Auto: Work Order Servis, Kasir POS, Manajemen Inventaris Suku Cadang, dan Live Tracking Publik.",
    url: "https://pitcare.auto",
    siteName: "PitCare Auto",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FFF8D4] text-[#313647] selection:bg-[#A3B087]/40 selection:text-[#313647] font-sans">
        {children}
      </body>
    </html>
  );
}
