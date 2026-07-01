import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'))),
  title: "SNHU Transfer Equivalency List",
  description: "Find SNHU transfer equivalencies for your academic journey. Explore accepted courses from AP Exams, Sophia Learning, Study.com, and more.",
  keywords: ["SNHU", "transfer equivalency", "college credits", "Southern New Hampshire University", "AP Exams", "Sophia Learning", "Study.com", "transfer credits"],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "SNHU Transfer Equivalency List",
    description: "Easily find transfer equivalencies for your academic journey at Southern New Hampshire University.",
    type: "website",
    locale: "en_US",
    siteName: "SNHU Transfers",
  },
  twitter: {
    card: "summary_large_image",
    title: "SNHU Transfer Equivalency List",
    description: "Easily find transfer equivalencies for your academic journey at Southern New Hampshire University.",
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
