import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import ScrollToTop from "./_components/ScrollToTop";

export const metadata: Metadata = {
  title: "Voskopulence",
  description: "Mediterranean luxury haircare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts: Sarina + League Spartan (300/400/600) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Sarina&family=League+Spartan:wght@300;400;600&display=swap"
          rel="stylesheet"
        />

        {/* Viewport + iOS safe areas (prevents the first-scroll top-strip repaint) */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        {/* Keep iOS Safari status-bar color stable during transitions */}
        <meta name="theme-color" content="#004642" />
        {/* Helpful iOS hints (safe even if not a PWA) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      <body>
        {/* Wrap any client component that might read routing state */}
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>

        {/* Your app */}
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}
