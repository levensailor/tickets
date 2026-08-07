import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = publicEnv.appName;
const siteUrl = publicEnv.siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
  description:
    "Band Guru — buy and sell tickets for local music events in Wilmington, North Carolina.",
  icons: {
    icon: [
      { url: "/icon-1024.png", sizes: "1024x1024", type: "image/png" },
      { url: "/icon.png", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "1024x1024", type: "image/png" }],
  },
  openGraph: {
    title: appName,
    description:
      "Buy and sell tickets for local music events in Wilmington, North Carolina.",
    url: siteUrl,
    siteName: appName,
    images: [{ url: "/icon-1024.png", width: 1024, height: 1024, alt: appName }],
  },
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
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          <p>
            {appName} — Wilmington, NC music events ·{" "}
            <a href={siteUrl} className="hover:text-foreground hover:underline">
              band.guru
            </a>
          </p>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className="hover:text-foreground hover:underline">
              Terms of Service
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/data-deletion"
              className="hover:text-foreground hover:underline"
            >
              Data Deletion
            </Link>
          </p>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
