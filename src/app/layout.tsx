import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

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
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
