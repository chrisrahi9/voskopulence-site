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
        <meta name="theme-color" content="#004642" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#004642" media="(prefers-color-scheme: dark)">
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      <body>
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
