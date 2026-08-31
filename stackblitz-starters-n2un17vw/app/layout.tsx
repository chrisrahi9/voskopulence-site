import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, League_Spartan, Sarina } from "next/font/google";
import { Suspense } from "react";
import ScrollToTop from "./_components/ScrollToTop";
import PremiumMotionController from "./_components/PremiumMotionController";

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-sans-next",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-editorial-next",
  display: "swap",
});

const sarina = Sarina({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script-next",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Voskopulence — Mediterranean Solid Haircare",
    template: "%s | Voskopulence",
  },
  description:
    "Mediterranean-inspired solid shampoo and conditioner bars developed with naturally derived ingredients and considered formulation principles.",
  openGraph: {
    title: "Voskopulence — Mediterranean Solid Haircare",
    description:
      "Botanical solid haircare inspired by rosemary, cedar, fig and citrus from the Mediterranean coast.",
    siteName: "Voskopulence",
    type: "website",
    images: [
      {
        url: "https://vosko-cdn.b-cdn.net/hero_poster.jpg",
        width: 1200,
        height: 630,
        alt: "Voskopulence Mediterranean haircare",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Voskopulence — Mediterranean Solid Haircare",
    description:
      "Botanical solid haircare inspired by the Mediterranean coast.",
    images: ["https://vosko-cdn.b-cdn.net/hero_poster.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#004642",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${leagueSpartan.variable} ${cormorant.variable} ${sarina.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://vosko-cdn.b-cdn.net" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>

      <body>
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <PremiumMotionController />
        {children}
      </body>
    </html>
  );
}
