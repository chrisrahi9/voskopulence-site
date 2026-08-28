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
    'const HERO_VIDEO_VERSION = "20260828-fast-1080";'
  )
  .replace(
    'object-cover opacity-0 transition-opacity duration-[800ms] pointer-events-none',
    'object-cover opacity-100 transition-opacity duration-[450ms] pointer-events-none'
  );

const startMarker =
  "  // Use native HLS on iOS/Safari and direct MP4 everywhere else.\n  useEffect(() => {";
const endMarker =
  "  }, [heroMp4Src, heroPosterSrc, heroHlsSrc, heroHlsIos1080Src]);\n";

const start = source.indexOf(startMarker);
if (start === -1) {
  throw new Error("Could not find legacy hero playback effect start marker");
}
const endStart = source.indexOf(endMarker, start);
if (endStart === -1) {
  throw new Error("Could not find legacy hero playback effect end marker");
}
const end = endStart + endMarker.length;
source =
  source.slice(0, start) +
  "  // Hero playback is owned by HeroVideoController. The server-rendered MP4\n" +
  "  // remains intact so the browser can start fetching before hydration.\n" +
  source.slice(end);

if (source.includes("https://cdn.voskopulence.com")) {
  throw new Error("Expired custom CDN hostname still present in page.tsx");
}

await writeFile(pagePath, source);
console.log("FAST_HERO_PREPARED", {
  bunnyOrigin: "https://vosko-cdn.b-cdn.net",
  legacyPlaybackEffectRemoved: true,
  serverRenderedMp4VisibleImmediately: true,
});
