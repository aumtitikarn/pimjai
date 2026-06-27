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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pimjai.itstudentservice.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "พิมพ์ใจ (Pimjai) — ฝากข้อความถึงใครก็ได้บนแผนที่โลก",
    template: "%s · พิมพ์ใจ (Pimjai)",
  },
  description:
    "ฝากข้อความและความลับที่ล็อกด้วยรหัสผ่านไว้บนแผนที่โลกแบบไม่ระบุตัวตน ปักหมุดข้อความไว้ที่ไหนก็ได้บนโลก แล้วแชร์ให้คนทั้งโลกได้อ่าน",
  applicationName: "พิมพ์ใจ",
  keywords: [
    "พิมพ์ใจ",
    "Pimjai",
    "ฝากข้อความบนแผนที่",
    "ปักหมุดข้อความ",
    "ฝากข้อความถึงคนที่รัก",
    "ส่งข้อความลับ",
    "ข้อความล็อกรหัสผ่าน",
    "แผนที่ฝากข้อความ",
    "ฝากข้อความไม่ระบุตัวตน",
    "anonymous map message",
    "drop a message on a map",
  ],
  authors: [{ name: "พิมพ์ใจ" }],
  creator: "พิมพ์ใจ",
  publisher: "พิมพ์ใจ",
  category: "social",
  alternates: {
    canonical: "/",
    languages: {
      "th-TH": "/",
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "พิมพ์ใจ (Pimjai)",
    title: "พิมพ์ใจ (Pimjai) — ฝากข้อความถึงใครก็ได้บนแผนที่โลก",
    description:
      "ฝากข้อความและความลับที่ล็อกด้วยรหัสผ่านไว้บนแผนที่โลกแบบไม่ระบุตัวตน ปักหมุดข้อความไว้ที่ไหนก็ได้บนโลก แล้วแชร์ให้คนทั้งโลกได้อ่าน",
    locale: "th_TH",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "พิมพ์ใจ (Pimjai) — ฝากข้อความถึงใครก็ได้บนแผนที่โลก",
    description:
      "ฝากข้อความและความลับที่ล็อกด้วยรหัสผ่านไว้บนแผนที่โลกแบบไม่ระบุตัวตน",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-900 overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
