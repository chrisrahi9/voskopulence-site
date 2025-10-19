// app/_components/ScrollToTop.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();
  const search = useSearchParams();

  // Disable browser's scroll restoration
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Always go to top on first mount
  useEffect(() => {
    // do it twice to beat iOS/Safari restoration
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const t = setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }), 50);
    return () => clearTimeout(t);
  }, []);

  // On route/search change, scroll to top (unless there is a hash)
  useEffect(() => {
    // If the URL contains a hash (e.g. /#about), let the browser jump there.
    if (typeof window !== "undefined" && window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}
