import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

source = source
  .replace(
    'const DIRECT_ASSETS = "https://cdn.voskopulence.com";',
    'const DIRECT_ASSETS = "https://vosko-cdn.b-cdn.net";'
  )
  .replace(
    'const HERO_VIDEO_VERSION = "20260517-direct-mp4";',
    'const HERO_VIDEO_VERSION = "20260828-premium-1080";'
  );

const effectStart =
  "  // Use native HLS on iOS/Safari and direct MP4 everywhere else.\n  useEffect(() => {";
const effectEnd =
  "  }, [heroMp4Src, heroPosterSrc, heroHlsSrc, heroHlsIos1080Src]);\n";

const effectStartIndex = source.indexOf(effectStart);
const effectEndIndex = source.indexOf(effectEnd, effectStartIndex);
if (effectStartIndex === -1 || effectEndIndex === -1) {
  throw new Error("Legacy hero playback effect markers not found");
}
source =
  source.slice(0, effectStartIndex) +
  "  // Native hero playback only. Safari is allowed to own the media element.\n" +
  source.slice(effectEndIndex + effectEnd.length);

const videoStartMarker = "            <video\n              ref={videoRef}";
const videoStart = source.indexOf(videoStartMarker);
if (videoStart === -1) throw new Error("Hero video start not found");
const videoEnd = source.indexOf("            />", videoStart);
if (videoEnd === -1) throw new Error("Hero video end not found");

const nativeVideo = `            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-100 pointer-events-none"
              src="https://vosko-cdn.b-cdn.net/hero_web_1080_premium_v1.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noplaybackrate"
              style={{
                willChange: "transform",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
            />`;

source =
  source.slice(0, videoStart) +
  nativeVideo +
  source.slice(videoEnd + "            />".length);

if (source.includes("https://cdn.voskopulence.com")) {
  throw new Error("Expired custom CDN hostname still present");
}
if (!source.includes("hero_web_1080_premium_v1.mp4")) {
  throw new Error("Premium 1080 hero source missing");
}

await writeFile(pagePath, source);
console.log("PREMIUM_1080_HERO_PREPARED", {
  source: "hero_web_1080_premium_v1.mp4",
  legacyPlaybackEffectRemoved: true,
  controllerIndependent: true,
});
