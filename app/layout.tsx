import type { Metadata } from "next";
import { Inter, Bebas_Neue, Titan_One } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const titanOne = Titan_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-titan",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ufc-fight-predictor-sigma.vercel.app"),
  title: "Pick'em Labs — UFC Fight Analysis",
  description: "AI-powered UFC fight predictions, live odds, and betting insights powered by Claude, GPT-4, and Gemini.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Pick'em Labs — UFC Fight Analysis",
    description: "AI-powered UFC fight predictions, live odds, and betting insights.",
    url: "https://ufc-fight-predictor-sigma.vercel.app",
    siteName: "Pick'em Labs",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pick'em Labs",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pick'em Labs — UFC Fight Analysis",
    description: "AI-powered UFC fight predictions, live odds, and betting insights.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable} ${titanOne.variable}`}>
      <body>{children}</body>
    </html>
  );
}