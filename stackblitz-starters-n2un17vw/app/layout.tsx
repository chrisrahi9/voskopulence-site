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

        {/* Viewport + iOS safe areas */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {/* Keep status bar green from first paint (light & dark) */}
        <meta name="theme-color" content="#004642" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#004642" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#004642" />

        {/* Optional iOS hints */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      <body>
        {/* Permanent status-bar cap (pre-hydration, never blinks) */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0"
          style={{
            height: "env(safe-area-inset-top)",
            background: "#004642",
            opacity: 0.94,
            zIndex: 2147483000, // extremely high so it never gets under other layers
          }}
        />

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
