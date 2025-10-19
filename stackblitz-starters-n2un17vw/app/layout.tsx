import './globals.css'
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Voskopulence",
  description: "Mediterranean luxury haircare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="ios-prepaint"> {/* 👈 start with prepaint class */}
      <head>
        {/* Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Sarina&family=League+Spartan:wght@300;400;600&display=swap"
          rel="stylesheet"
        />

        {/* iOS full-screen safe areas */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Paint iOS browser UI with your brand color too */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#004642" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#004642" />

        {/* Immediately swap classes on the very first tick (beforeInteractive) */}
        <Script id="swap-ios-prepaint" strategy="beforeInteractive">{`
          (function () {
            var doc = document.documentElement;
            // Use the reliable, env()-based class going forward
            doc.classList.add('ios-statusbar-fix');
            doc.classList.remove('ios-prepaint');
          })();
        `}</Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
