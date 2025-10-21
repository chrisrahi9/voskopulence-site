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
        <link
          href="https://fonts.googleapis.com/css2?family=Sarina&family=League+Spartan:wght@300;400;600&display=swap"
          rel="stylesheet"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#004642" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      <body>
        {/* fixed, always-green safe-area strip */}
        <div
          className="fixed top-0 inset-x-0 pointer-events-none"
          style={{
            height: "env(safe-area-inset-top)",
            backgroundColor: "#004642",
            opacity: 0.94,
            zIndex: 9999,
          }}
          aria-hidden="true"
        />

        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
