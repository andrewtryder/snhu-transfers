import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SNHU Transfer Equivalency List",
  description: "Find SNHU transfer equivalencies for your academic journey. Explore accepted courses from AP Exams, Sophia Learning, Study.com, and more.",
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
