import './globals.css'

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
      </head>
      <body>{children}</body>
    </html>
  )
}

