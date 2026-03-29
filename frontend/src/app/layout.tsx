import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DealDrop — Save More, Waste Less",
  description:
    "Hyperlocal flash-sale marketplace. Discover near-expiry deals from local retailers, reserve instantly, and pick up fresh savings.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#F4500B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body className="font-sans antialiased bg-surface text-charcoal min-h-screen">
        <ToastProvider>
          <Providers>{children}</Providers>
        </ToastProvider>
      </body>
    </html>
  );
}
