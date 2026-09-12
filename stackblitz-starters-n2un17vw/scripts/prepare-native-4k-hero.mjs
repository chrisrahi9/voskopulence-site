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
    'const HERO_VIDEO_VERSION = "20260912-smooth-slow-v4";'
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
  "  // Native hero playback only. The slow-motion timing is baked into the file.\n" +
  source.slice(effectEndIndex + effectEnd.length);

const videoStartMarker = "            <video\n              ref={videoRef}";
const videoStart = source.indexOf(videoStartMarker);
if (videoStart === -1) throw new Error("Hero video start not found");
const videoEnd = source.indexOf("            />", videoStart);
if (videoEnd === -1) throw new Error("Hero video end not found");

const nativeVideo = `            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-100 pointer-events-none"
              src="https://raw.githubusercontent.com/chrisrahi9/voskopulence-site/fix/video-curtain-stability-20260912/stackblitz-starters-n2un17vw/public/media/hero_web_v4_slow.mp4"
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
if (!source.includes("hero_web_v4_slow.mp4")) {
  throw new Error("Smooth slow-motion hero source missing");
}

await writeFile(pagePath, source);
console.log("SMOOTH_SLOW_HERO_PREPARED", {
  source: "public raw GitHub preview asset",
  sourceFps: 30,
  outputFps: 60,
  speed: "2/3 original",
  browserPlaybackRate: 1,
  controllerIndependent: true,
});
