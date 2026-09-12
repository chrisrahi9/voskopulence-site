import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const DESKTOP_HERO = "/hero_web_v6_3_seamless.mp4";
const MOBILE_HERO = "/hero_web_v6_3_mobile.mp4";
const HERO_POSTER = "/hero_web_v6_3_poster.jpg";
const HERO_VERSION = "20260912-v6-3-mobilefix1";

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

// The old HLS playlists contain previous footage, so use the matching v6_3 MP4
// assets until a new adaptive set is generated.
source = source.replace(
  "    const shouldUseNativeHls = isiOS || isSafariDesktop;",
  "    const shouldUseNativeHls = false;"
);

// Pick a much lighter 720p30 encode on phones. Do this before assigning a src,
// otherwise mobile browsers may begin downloading the 1080p60 desktop file.
source = source.replace(
  "    let destroyed = false;",
  `    const isCompactHero =\n      window.matchMedia?.("(max-width: 767px)")?.matches ?? window.innerWidth < 768;\n\n    let destroyed = false;`
);
source = source.replace(
  `      const expectedSrc = shouldUseNativeHls\n        ? isiOS\n          ? heroHlsIos1080Src\n          : heroHlsSrc\n        : heroMp4Src;`,
  `      const expectedSrc = isCompactHero ? heroMobileMp4Src : heroMp4Src;`
);

// Mobile Safari treats "suspend" as a normal loading decision. Recovering on
// every suspend/waiting event was causing repeated start attempts and visible
// flashing. Reveal only once frames are truly playing.
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

// Prevent the static JSX src from making phones fetch the desktop asset before
// the effect has selected the correct rendition. The poster remains visible
// until the actual video emits "playing".
source = source
  .replace("              src={heroMp4Src}\n", "")
  .replace('              preload="auto"\n', '              preload="metadata"\n');

// Use the matching poster underneath the transparent video while it buffers.
source = source.replace(
  "style={{ backgroundImage: `url(${heroPosterSrc})`, filter: \"brightness(0.9)\" }}",
  "style={{ backgroundImage: `url(${heroPosterSrc})`, filter: \"brightness(0.9)\" }}"
);

// Keep the approved iPhone focal framing; desktop remains centered.
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
  throw new Error("Suspend recovery must not remain on mobile");
}
if (source.includes('v.addEventListener("loadeddata", reveal)')) {
  throw new Error("Video must not reveal before playback begins");
}
if (!source.includes("object-[46%_50%] md:object-center")) {
  throw new Error("Approved mobile focal crop missing");
}
if (source.includes("loopVideoRef")) throw new Error("Dual-video loop code leaked in");
if (source.includes('v.style.opacity = "0.16"')) throw new Error("Old fade loop leaked in");

await writeFile(pagePath, source);
console.log("V6_3_RESPONSIVE_HERO_PREPARED", {
  desktop: DESKTOP_HERO,
  desktopResolution: "1920x1080",
  desktopFps: 59.94,
  mobile: MOBILE_HERO,
  mobileResolution: "1280x720",
  mobileFps: 29.97,
  mobileTargetBitrateMbps: 3.2,
  poster: HERO_POSTER,
  mobilePreload: "metadata",
  revealEvent: "playing",
  suspendRecovery: false,
  nativeLoop: true,
  mobileObjectPosition: "46% 50%",
});