import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voskopulence",
  description: "Mediterranean luxury haircare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Sarina&family=League+Spartan:wght@300;400;600&display=swap"
          rel="stylesheet"
        />
        {/* iOS full-screen */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Paint Safari UI */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#004642" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#004642" />
      </head>
      <body>{children}</body>
    </html>
  );
}
