import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const DESKTOP_HERO = "/hero_web_v6_3_seamless.mp4";
const MOBILE_HERO = "/hero_web_v6_3_mobile.mp4";
const HERO_POSTER = "/hero_web_v6_3_poster.jpg";
const HERO_VERSION = "20260913-v6-3-direct-mp4-robust";

// The hero no longer uses HLS/hls.js. One progressive MP4 source per viewport
// is more deterministic on true cold starts, especially on mobile Safari.
source = source.replace('import Hls from "hls.js";\n', "");

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

const directPlaybackEffect = `  // One-source hero playback. No HLS, no ABR, no corrective seeking.\n  useEffect(() => {\n    const v = videoRef.current;\n    if (!v) return;\n\n    const isCompactHero =\n      window.matchMedia?.("(max-width: 767px)")?.matches ?? window.innerWidth < 768;\n    const expectedSrc = isCompactHero ? heroMobileMp4Src : heroMp4Src;\n    let disposed = false;\n\n    v.loop = true;\n    v.defaultMuted = true;\n    v.muted = true;\n    v.autoplay = true;\n    v.playsInline = true;\n    v.preload = "auto";\n    // The separate background poster is the only poster layer. Keeping the\n    // video element itself poster-free avoids a Safari compositing handoff.\n    v.removeAttribute("poster");\n    v.setAttribute("loop", "");\n    v.setAttribute("muted", "");\n    v.setAttribute("autoplay", "");\n    v.setAttribute("playsinline", "");\n    v.setAttribute("webkit-playsinline", "");\n\n    const reveal = () => revealHeroVideo(v);\n    v.addEventListener("playing", reveal);\n\n    const tryPlay = () => {\n      if (disposed || document.visibilityState !== "visible") return;\n      const p = v.play?.();\n      if (p && typeof p.catch === "function") p.catch(() => {});\n    };\n\n    // Assign exactly once. Never swap sources while the browser is buffering.\n    if (v.getAttribute("src") !== expectedSrc) {\n      v.setAttribute("src", expectedSrc);\n      try { v.load(); } catch {}\n    }\n    tryPlay();\n\n    // Resume only after returning to the tab/app. Never reload or seek.\n    const onVis = () => {\n      if (document.visibilityState === "visible" && v.paused) tryPlay();\n    };\n    document.addEventListener("visibilitychange", onVis);\n\n    return () => {\n      disposed = true;\n      v.removeEventListener("playing", reveal);\n      document.removeEventListener("visibilitychange", onVis);\n    };\n  }, [heroMp4Src, heroMobileMp4Src]);`;

const playbackBlock = /  \/\/ Use native HLS on iOS\/Safari and direct MP4 everywhere else\.\n  useEffect\(\(\) => \{[\s\S]*?  \}, \[heroMp4Src, heroPosterSrc, heroHlsSrc, heroHlsIos1080Src\]\);/;
if (!playbackBlock.test(source)) {
  throw new Error("Original hero playback controller block not found");
}
source = source.replace(playbackBlock, directPlaybackEffect);

source = source
  .replace("              src={heroMp4Src}\n", "")
  .replace(/              poster=\{heroPosterSrc\}\n/, "")
  .replace('              preload="metadata"\n', '              preload="auto"\n')
  .replace('              preload="auto"\n', '              preload="auto"\n');

source = source.replace(
  'className="absolute inset-0 bg-cover bg-center"',
  'className="absolute inset-0 bg-cover bg-[position:46%_50%] md:bg-center"'
);
source = source.replace(
  'className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[800ms] pointer-events-none"',
  'className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 transition-opacity duration-[300ms] pointer-events-none"'
);

if (source.includes('import Hls from "hls.js";')) throw new Error("Static hls.js import still present");
if (source.includes('import("hls.js")')) throw new Error("Dynamic hls.js import still present");
if (source.includes("heroAdaptiveHlsSrc")) throw new Error("HLS source still present");
if (source.includes("canNativeHls")) throw new Error("Native HLS detection still present");
if (source.includes('poster={heroPosterSrc}')) throw new Error("Video poster attribute still present");
if (!source.includes('v.removeAttribute("poster")')) throw new Error("Video poster removal missing");
if (!source.includes('v.preload = "auto"')) throw new Error("Auto preload missing");
if (source.includes('addEventListener("waiting"')) throw new Error("Waiting recovery still present");
if (source.includes('addEventListener("stalled"')) throw new Error("Stalled recovery still present");
if (source.includes('addEventListener("pause"')) throw new Error("Pause recovery still present");
if (source.includes("manualLoopIfNearEnd")) throw new Error("Manual loop seek still present");
if (source.includes('addEventListener("ended"')) throw new Error("Ended restart still present");
if (source.includes("loopVideoRef")) throw new Error("Dual video layer still present");
if (!source.includes("bg-[position:46%_50%] md:bg-center")) throw new Error("Poster focal lock missing");
if (!source.includes("object-[46%_50%] md:object-center")) throw new Error("Video focal lock missing");

await writeFile(pagePath, source);
console.log("V6_3_DIRECT_MP4_HERO_PREPARED", {
  mobile: "1920x1080 59.94fps progressive MP4 ~7.5Mbps faststart",
  desktop: "1920x1080 progressive MP4",
  hls: false,
  abr: false,
  autoPreload: true,
  singlePosterLayer: true,
  sourceAssignments: 1,
  waitingRecovery: false,
  stalledRecovery: false,
  pauseRecovery: false,
  manualSeek: false,
  focalPosition: "46% 50%",
});