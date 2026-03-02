// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: "Wedding Invitation Flyer Generator",
  description: "Generate wedding invitation flyers with QR codes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} font-sans`}>{children}</body>
    </html>
  );
}
