import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const HERO_FILE = "hero_web_v6_2.mp4";
const HERO_VERSION = "20260912-v6-2-4k25";

// Use the Bunny pull-zone hostname directly for the preview so the new upload is
// served from the same CDN origin that already backs the site's media routes.
source = source
  .replace(
    /const DIRECT_ASSETS = "[^"]+";/,
    'const DIRECT_ASSETS = "https://vosko-cdn.b-cdn.net";'
  )
  .replace(
    /const HERO_VIDEO_VERSION = "[^"]+";/,
    `const HERO_VIDEO_VERSION = "${HERO_VERSION}";`
  )
  .replace(
    /const heroMp4Src = heroDirectAsset\("\/[^"]+"\);/,
    `const heroMp4Src = heroDirectAsset("/${HERO_FILE}");`
  )
  // Avoid flashing the poster from the previous beach clip before the new
  // footage has decoded. The hero fades in from the site's own background.
  .replace(
    'const heroPosterSrc = heroDirectAsset("/hero_poster.jpg");',
    'const heroPosterSrc = "";'
  );

// Preserve the established iPhone/Safari playback controller (muted autoplay,
// playsInline, visibility recovery, stalled/waiting recovery and the fade-in),
// but do NOT point Safari at the old HLS rendition because that playlist still
// contains the previous hero. This preview therefore uses the matching Bunny
// MP4 on every browser so desktop and iPhone show exactly the same v6_2 clip.
source = source.replace(
  "    const shouldUseNativeHls = isiOS || isSafariDesktop;",
  [
    "    // v6_2 preview: preserve Safari/iOS reliability handling, but use the",
    "    // matching Bunny MP4 instead of the legacy HLS playlist (old footage).",
    "    const shouldUseNativeHls = false;",
  ].join("\n")
);

// Keep the stock master's native cadence and use the browser's native loop.
source = source
  .replace('    v.addEventListener("timeupdate", manualLoopIfNearEnd);\n', "")
  .replace('      v.removeEventListener("timeupdate", manualLoopIfNearEnd);\n', "");

if (!source.includes(HERO_FILE)) {
  throw new Error(`Hero source ${HERO_FILE} was not installed`);
}
if (!source.includes("const shouldUseNativeHls = false;")) {
  throw new Error("Preview Safari/iOS source guard was not installed");
}
if (source.includes("hero_web_v6_slow60_seamless.mp4")) {
  throw new Error("Previous processed slow-motion hero is still present");
}
if (source.includes("raw.githubusercontent.com/chrisrahi9/voskopulence-site")) {
  throw new Error("Raw GitHub hero delivery is still present");
}

await writeFile(pagePath, source);
console.log("BUNNY_NATIVE_HERO_PREPARED", {
  file: HERO_FILE,
  cdn: "https://vosko-cdn.b-cdn.net",
  sourceFps: 25,
  sourceResolution: "3840x2160",
  playbackRate: 1,
  manualNearEndSeek: false,
  iosSafariRecoveryController: true,
  legacyHlsForThisPreview: false,
});
