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
        {/* iOS full-screen safe areas */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body>
        {/* Wrap any client component that might read routing state */}
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>

        {/* Also wrap children so any page using useSearchParams is safe */}
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
