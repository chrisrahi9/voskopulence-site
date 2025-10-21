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
        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Sarina&family=League+Spartan:wght@300;400;600&display=swap"
          rel="stylesheet"
        />

        {/* Viewport + iOS */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#004642" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#004642" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#004642" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* --- Freeze the initial safe-area inset into a CSS var (pre-hydration) --- */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    // Create a probe element to read the initial env(safe-area-inset-top) in px
    var probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;right:0;height:env(safe-area-inset-top);visibility:hidden;pointer-events:none;';
    document.documentElement.appendChild(probe);
    var h = getComputedStyle(probe).height;
    document.documentElement.style.setProperty('--safe-top-fixed', h || '0px');
    probe.parentNode && probe.parentNode.removeChild(probe);
  } catch(e){}
})();
            `.trim(),
          }}
        />
        <style
          // Fallback in case the script fails for any reason
          dangerouslySetInnerHTML={{
            __html: `
:root { --safe-top-fixed: env(safe-area-inset-top); }
            `.trim(),
          }}
        />
      </head>

      <body>
        {/* Permanent status-bar cap that uses the FROZEN value (never "rolls") */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0"
          style={{
            height: "var(--safe-top-fixed)",
            background: "#004642",
            opacity: 0.94,
            zIndex: 2147483000,
            transform: "translateZ(0)",
            contain: "layout paint",
          }}
        />

        {/* Router helpers */}
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>

        {/* App */}
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}
