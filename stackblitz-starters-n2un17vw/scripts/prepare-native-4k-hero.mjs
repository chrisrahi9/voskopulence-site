import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const DESKTOP_HERO = "/hero_web_v6_3_seamless.mp4";
const MOBILE_HERO = "/hero_web_v6_3_mobile.mp4";
const HERO_POSTER = "/hero_web_v6_3_poster.jpg";
const HERO_VERSION = "20260912-v6-3-mobile1080p60";

source = source
  .replace(
    /const HERO_VIDEO_VERSION = "[^"]+";/,
    `const HERO_VIDEO_VERSION = "${HERO_VERSION}";`
  )
  .replace(
    /const heroMp4Src = [^;]+;/,
    `const heroMp4Src = "${DESKTOP_HERO}?v=${HERO_VERSION}";\n  const heroMobileMp4Src = "${MOBILE_HERO}?v=${HERO_VERSION}";`
  )
  .replace(
    /const heroPosterSrc = [^;]+;/,
    `const heroPosterSrc = "${HERO_POSTER}?v=${HERO_VERSION}";`
  );

// Existing HLS playlists contain old footage. Use matching v6_3 MP4 assets
// until the adaptive HLS ladder is regenerated from this seamless master.
source = source.replace(
  "    const shouldUseNativeHls = isiOS || isSafariDesktop;",
  "    const shouldUseNativeHls = false;"
);

// Mobile gets its own optimized 1080p60 rendition so quality stays premium
// without forcing the heavier desktop file to download first.
source = source.replace(
  "    let destroyed = false;",
  `    const isCompactHero =\n      window.matchMedia?.("(max-width: 767px)")?.matches ?? window.innerWidth < 768;\n\n    let destroyed = false;`
);
source = source.replace(
  `      const expectedSrc = shouldUseNativeHls\n        ? isiOS\n          ? heroHlsIos1080Src\n          : heroHlsSrc\n        : heroMp4Src;`,
  `      const expectedSrc = isCompactHero ? heroMobileMp4Src : heroMp4Src;`
);

// Avoid Safari recovery churn. Reveal only when playback has genuinely begun.
source = source
  .replace('      v.preload = "auto";', '      v.preload = isCompactHero ? "metadata" : "auto";')
  .replace("      }, 200);", "      }, 800);")
  .replace('    v.addEventListener("loadeddata", reveal);\n', "")
  .replace('    v.addEventListener("canplay", reveal);\n', "")
  .replace('    v.addEventListener("suspend", scheduleRecovery);\n', "")
  .replace('      v.removeEventListener("loadeddata", reveal);\n', "")
  .replace('      v.removeEventListener("canplay", reveal);\n', "")
  .replace('      v.removeEventListener("suspend", scheduleRecovery);\n', "")
  .replace("    const revealTimeout = window.setTimeout(() => revealHeroVideo(v), 1200);\n", "")
  .replace("      window.clearTimeout(revealTimeout);\n", "");

// Native loop only: the transition is already baked into the media.
source = source
  .replace('    v.addEventListener("timeupdate", manualLoopIfNearEnd);\n', "")
  .replace('      v.removeEventListener("timeupdate", manualLoopIfNearEnd);\n', "");

// Don't let the browser fetch the desktop asset before JS selects the correct
// rendition. Keep the poster visible until the video emits "playing".
source = source
  .replace("              src={heroMp4Src}\n", "")
  .replace('              preload="auto"\n', '              preload="metadata"\n');

// Lock BOTH the poster layer and video to the exact same focal point on phones.
// This removes the apparent left/right repositioning during poster→video handoff.
source = source.replace(
  'className="absolute inset-0 bg-cover bg-center"',
  'className="absolute inset-0 bg-cover bg-[position:46%_50%] md:bg-center"'
);
source = source.replace(
  'className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[800ms] pointer-events-none"',
  'className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 transition-opacity duration-[800ms] pointer-events-none"'
);

source = source.replace(
  "  }, [heroMp4Src, heroPosterSrc, heroHlsSrc, heroHlsIos1080Src]);",
  "  }, [heroMp4Src, heroMobileMp4Src, heroPosterSrc, heroHlsSrc, heroHlsIos1080Src]);"
);

if (!source.includes(MOBILE_HERO)) throw new Error("Mobile hero source missing");
if (!source.includes(HERO_POSTER)) throw new Error("Matching hero poster missing");
if (!source.includes("isCompactHero ? heroMobileMp4Src : heroMp4Src")) {
  throw new Error("Responsive hero source selection missing");
}
if (source.includes("              src={heroMp4Src}")) {
  throw new Error("Static desktop hero src still present in JSX");
}
if (source.includes('v.addEventListener("suspend", scheduleRecovery)')) {
  throw new Error("Suspend recovery must not remain");
}
if (source.includes('v.addEventListener("loadeddata", reveal)')) {
  throw new Error("Video must not reveal before playback begins");
}
if (!source.includes("bg-[position:46%_50%] md:bg-center")) {
  throw new Error("Poster focal lock missing");
}
if (!source.includes("object-[46%_50%] md:object-center")) {
  throw new Error("Video focal lock missing");
}
if (source.includes("loopVideoRef")) throw new Error("Dual-video loop code leaked in");
if (source.includes('v.style.opacity = "0.16"')) throw new Error("Old fade loop leaked in");

await writeFile(pagePath, source);
console.log("V6_3_PREMIUM_MOBILE_HERO_PREPARED", {
  desktop: DESKTOP_HERO,
  desktopResolution: "1920x1080",
  desktopFps: 59.94,
  mobile: MOBILE_HERO,
  mobileResolution: "1920x1080",
  mobileFps: 59.94,
  mobileTargetBitrateMbps: 7.2,
  poster: HERO_POSTER,
  mobilePreload: "metadata",
  revealEvent: "playing",
  suspendRecovery: false,
  nativeLoop: true,
  posterAndVideoPosition: "46% 50%",
  adaptiveHlsPending: true,
});