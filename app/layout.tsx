import type { Metadata } from "next";
import { Inter, Bebas_Neue, Titan_One } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";

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
  description:
    "AI-powered UFC fight predictions, live odds, and betting insights powered by Claude, GPT-4, and Gemini.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    other: [{ rel: "manifest", url: "/site.webmanifest" }],
  },
  openGraph: {
    title: "Pick'em Labs — UFC Fight Analysis",
    description:
      "AI-powered UFC fight predictions, live odds, and betting insights.",
    url: "https://ufc-fight-predictor-sigma.vercel.app",
    siteName: "Pick'em Labs",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Pick'em Labs",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pick'em Labs — UFC Fight Analysis",
    description:
      "AI-powered UFC fight predictions, live odds, and betting insights.",
    images: ["/android-chrome-512x512.png"],
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
      className={`${inter.variable} ${bebasNeue.variable} ${titanOne.variable}`}
    >
      <body className="site-body">
        <div className="site-content">{children}</div>
        <Footer />
      </body>
    </html>
  );
}