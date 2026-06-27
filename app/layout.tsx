import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pimjai (พิมพ์ใจ) — Drop a message anywhere on Earth",
  description:
    "Anonymously drop text messages and password-locked secrets anywhere on the global map.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b1220",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-900 overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
