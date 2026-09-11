"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Lang = "sv" | "en";

export default function LanguageController() {
  const pathname = usePathname();

  useEffect(() => {
    const lang: Lang = pathname === "/sv" || pathname.startsWith("/sv/") ? "sv" : "en";

    // The rendered route owns the language. Persist only the preference so
    // navigation controls can remember it; never mutate page copy in-place.
    try {
      window.localStorage.setItem("voskopulence-language", lang);
      document.cookie = `voskopulence-language=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {}

    document.documentElement.lang = lang;
  }, [pathname]);

  return null;
}
