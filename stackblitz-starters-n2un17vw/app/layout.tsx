import './globals.css'
import type { Metadata } from "next";
import { Suspense } from "react";
import ScrollToTop from "./_components/ScrollToTop";

export const metadata: Metadata = {
  title: 'Voskopulence',
  description: 'Mediterranean luxury haircare',
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

        {/* Viewport + safe areas */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {/* Keep iOS Safari status-bar color stable during first scroll */}
        <meta name="theme-color" content="#004642" />

        {/* Helpful iOS hints (safe to include even if not a PWA) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      <body>
        {/* Wrap any client component that might read routing state */}
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>

        {/* Permanent status-bar fill (sits under iOS camera area) */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 h-[env(safe-area-inset-top)] bg-[#004642] z-[100]"
        />

        {/* Also wrap children so any page using useSearchParams is safe */}
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
