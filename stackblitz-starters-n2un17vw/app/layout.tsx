import "./globals.css";
import type { Metadata, Viewport } from "next";
import { League_Spartan, Sarina } from "next/font/google";
import { Suspense } from "react";
import ScrollToTop from "./_components/ScrollToTop";
import PremiumMotionController from "./_components/PremiumMotionController";

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-sans-next",
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
    default: "Voskopulence",
    template: "%s | Voskopulence",
  },
  description: "Mediterranean luxury haircare",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#004642",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${leagueSpartan.variable} ${sarina.variable}`}>
      <head>
        <link rel="preconnect" href="https://vosko-cdn.b-cdn.net" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
