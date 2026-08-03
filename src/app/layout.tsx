import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { SiteLegalFooter } from "@/components/layout/site-legal-footer";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pixel Alley — Midnight companions for your new tab",
    template: "%s · Pixel Alley",
  },
  description:
    "Upload a pet photo and let them wait for you in the Midnight Pixel Alley — your neon new-tab companion.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Pixel Alley",
    description:
      "Upload a pet photo and let them wait for you in the Midnight Pixel Alley.",
    type: "website",
    images: [{ url: "/brand/pixel-alley-cat-logo-512.png", width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f19",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${vt323.variable} dark h-full`}
    >
      <body className="alley-pattern flex min-h-full flex-col font-sans text-foreground antialiased">
        {children}
        <SiteLegalFooter />
      </body>
    </html>
  );
}
