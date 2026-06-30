import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SNHU Transfer List",
  description: "A list of the courses SNHU will transfer in, sorted by the classes themselves.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
