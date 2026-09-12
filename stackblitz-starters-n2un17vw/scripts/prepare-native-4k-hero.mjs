import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const HERO_FILE = "/hero_web_v6_3_seamless.mp4";
const HERO_VERSION = "20260912-v6-3-seamless1080";

source = source
  .replace(
    /const HERO_VIDEO_VERSION = "[^"]+";/,
    `const HERO_VIDEO_VERSION = "${HERO_VERSION}";`
  )
  .replace(
    /const heroMp4Src = [^;]+;/,
    `const heroMp4Src = "${HERO_FILE}?v=${HERO_VERSION}";`
  )
  .replace(
    /const heroPosterSrc = [^;]+;/,
    'const heroPosterSrc = "";'
  );

// Existing HLS playlists still contain the previous hero. Until the adaptive
// v6_3 HLS set is regenerated from this seamless master, every browser uses the
// same baked 1080p60 MP4 while retaining the established Safari/iOS recovery
// controller (muted autoplay, playsInline, visibility/stall recovery).
source = source.replace(
  "    const shouldUseNativeHls = isiOS || isSafariDesktop;",
  [
    "    // Seamless v6_3 production asset; fresh adaptive HLS follows separately.",
    "    const shouldUseNativeHls = false;",
  ].join("\n")
);

// The transition is baked into the media itself. Native <video loop> is now the
// only loop mechanism: no opacity fades, duplicate video layers or manual seeks.
source = source
  .replace('    v.addEventListener("timeupdate", manualLoopIfNearEnd);\n', "")
  .replace('      v.removeEventListener("timeupdate", manualLoopIfNearEnd);\n', "");

// Keep the user-approved iPhone focal framing; desktop remains centered.
source = source.replace(
  'className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[800ms] pointer-events-none"',
  'className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 transition-opacity duration-[800ms] pointer-events-none"'
);

if (!source.includes(HERO_FILE)) {
  throw new Error("Seamless v6_3 hero source was not installed");
}
if (!source.includes("object-[46%_50%] md:object-center")) {
  throw new Error("Approved mobile focal crop was not installed");
}
if (!source.includes("const shouldUseNativeHls = false;")) {
  throw new Error("Legacy HLS guard was not installed");
}
if (source.includes("loopVideoRef")) {
  throw new Error("Dual-video overlap code must not be present");
}
if (source.includes('v.style.opacity = "0.16"')) {
  throw new Error("Old fade-to-background loop must not be present");
}
if (source.includes("hero_web_v6_slow60_seamless.mp4")) {
  throw new Error("Previous processed hero must not be present");
}
if (source.includes("raw.githubusercontent.com/chrisrahi9/voskopulence-site")) {
  throw new Error("Raw GitHub hero delivery must not be present");
}

await writeFile(pagePath, source);
console.log("V6_3_SEAMLESS_HERO_PREPARED", {
  file: HERO_FILE,
  sourceFps: 59.94,
  sourceResolution: "1920x1080",
  playbackRate: 1,
  bakedCrossfadeSeconds: 1.2,
  mobileObjectPosition: "46% 50%",
  nativeLoop: true,
  manualSeekLoop: false,
  duplicateVideoLayer: false,
  iosSafariRecoveryController: true,
  adaptiveHlsPending: true,
});