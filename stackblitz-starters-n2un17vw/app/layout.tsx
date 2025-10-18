import './globals.css'
import type { Metadata } from "next";

export const metadata: Metadata = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#004642" },
    { media: "(prefers-color-scheme: dark)",  color: "#004642" },
  ],
};
export const metadata = {
  title: 'Voskopulence',
  description: 'Mediterranean luxury haircare',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts: Sarina + League Spartan (300/400/600) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Sarina&family=League+Spartan:wght@300;400;600&display=swap"
          rel="stylesheet"
        />

        {/* ✅ Important for iOS full-screen safe areas */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}


