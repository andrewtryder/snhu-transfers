import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SNHU Transfer Equivalency List",
    template: "%s | SNHU Transfers",
  },
  description:
    "Search unofficial SNHU transfer equivalencies and accepted transfer credits by course number, subject, provider, and academic level for Southern New Hampshire University (SNHU).",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SNHU Transfer Equivalency List",
    description:
      "Search unofficial SNHU transfer equivalencies and accepted transfer credits by course, provider, subject, and level.",
    url: "/",
    type: "website",
    locale: "en_US",
    siteName: "SNHU Transfers",
  },
  twitter: {
    card: "summary",
    title: "SNHU Transfer Equivalency List",
    description:
      "Search unofficial SNHU transfer equivalencies and accepted transfer credits by course, provider, subject, and level.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geist.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
