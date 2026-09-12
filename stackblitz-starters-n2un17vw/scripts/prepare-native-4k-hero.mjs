import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const DESKTOP_HERO = "/hero_web_v6_3_seamless.mp4";
const MOBILE_HERO = "/hero_web_v6_3_mobile.mp4";
const HLS_MASTER = "/hero_hls_v6_3/master.m3u8";
const HERO_POSTER = "/hero_web_v6_3_poster.jpg";
const HERO_VERSION = "20260912-v6-3-adaptive-hls2";

// Keep hls.js out of Safari's initial bundle. Safari plays HLS natively.
source = source.replace('import Hls from "hls.js";\n', "");

source = source
  .replace(
    /const HERO_VIDEO_VERSION = "[^"]+";/,
    `const HERO_VIDEO_VERSION = "${HERO_VERSION}";`
  )
  .replace(
    /const heroMp4Src = [^;]+;/,
    `const heroMp4Src = "${DESKTOP_HERO}?v=${HERO_VERSION}";\n  const heroMobileMp4Src = "${MOBILE_HERO}?v=${HERO_VERSION}";\n  const heroAdaptiveHlsSrc = "${HLS_MASTER}?v=${HERO_VERSION}";`
  )
  .replace(
    /const heroPosterSrc = [^;]+;/,
    `const heroPosterSrc = "${HERO_POSTER}?v=${HERO_VERSION}";`
  );

const adaptivePlaybackEffect = `  // Adaptive HLS hero playback with zero corrective seeking.\n  useEffect(() => {\n    const v = videoRef.current;\n    if (!v) return;\n\n    const isCompactHero =\n      window.matchMedia?.("(max-width: 767px)")?.matches ?? window.innerWidth < 768;\n    const fallbackMp4 = isCompactHero ? heroMobileMp4Src : heroMp4Src;\n    const canNativeHls = Boolean(v.canPlayType("application/vnd.apple.mpegurl"));\n    let hls: any = null;\n    let disposed = false;\n\n    v.loop = true;\n    v.defaultMuted = true;\n    v.muted = true;\n    v.autoplay = true;\n    v.playsInline = true;\n    v.preload = isCompactHero ? "metadata" : "auto";\n    v.poster = heroPosterSrc;\n    v.setAttribute("loop", "");\n    v.setAttribute("muted", "");\n    v.setAttribute("autoplay", "");\n    v.setAttribute("playsinline", "");\n    v.setAttribute("webkit-playsinline", "");\n\n    const reveal = () => revealHeroVideo(v);\n    v.addEventListener("playing", reveal);\n\n    const tryPlay = () => {\n      if (disposed || document.visibilityState !== "visible") return;\n      const p = v.play?.();\n      if (p && typeof p.catch === "function") p.catch(() => {});\n    };\n\n    const useMp4Fallback = () => {\n      if (disposed) return;\n      try { hls?.destroy(); } catch {}\n      hls = null;\n      if (v.getAttribute("src") !== fallbackMp4) {\n        v.setAttribute("src", fallbackMp4);\n        try { v.load(); } catch {}\n      }\n      tryPlay();\n    };\n\n    if (canNativeHls) {\n      // Safari/iPhone: native adaptive HLS, no hls.js download.\n      v.setAttribute("src", heroAdaptiveHlsSrc);\n      try { v.load(); } catch {}\n      tryPlay();\n    } else {\n      // Other browsers load hls.js only if/when needed.\n      import("hls.js")\n        .then(({ default: Hls }) => {\n          if (disposed) return;\n          if (!Hls.isSupported()) {\n            useMp4Fallback();\n            return;\n          }\n\n          hls = new Hls({\n            enableWorker: true,\n            startLevel: -1,\n            capLevelToPlayerSize: false,\n            abrBandWidthFactor: 0.9,\n            abrBandWidthUpFactor: 0.8,\n            maxBufferLength: 20,\n            maxMaxBufferLength: 40,\n            maxStarvationDelay: 3,\n            maxLoadingDelay: 3,\n          });\n          hls.attachMedia(v);\n          hls.on(Hls.Events.MEDIA_ATTACHED, () => {\n            if (!disposed) hls?.loadSource(heroAdaptiveHlsSrc);\n          });\n          hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay());\n          hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {\n            if (!disposed && data?.fatal) useMp4Fallback();\n          });\n        })\n        .catch(() => useMp4Fallback());\n    }\n\n    // Resume only after tab/app visibility returns. Never reload or seek.\n    const onVis = () => {\n      if (document.visibilityState === "visible" && v.paused) tryPlay();\n    };\n    document.addEventListener("visibilitychange", onVis);\n\n    return () => {\n      disposed = true;\n      v.removeEventListener("playing", reveal);\n      document.removeEventListener("visibilitychange", onVis);\n      try { hls?.destroy(); } catch {}\n    };\n  }, [heroMp4Src, heroMobileMp4Src, heroAdaptiveHlsSrc, heroPosterSrc]);`;

const playbackBlock = /  \/\/ Use native HLS on iOS\/Safari and direct MP4 everywhere else\.\n  useEffect\(\(\) => \{[\s\S]*?  \}, \[heroMp4Src, heroPosterSrc, heroHlsSrc, heroHlsIos1080Src\]\);/;
if (!playbackBlock.test(source)) {
  throw new Error("Original hero playback controller block not found");
}
source = source.replace(playbackBlock, adaptivePlaybackEffect);

source = source
  .replace("              src={heroMp4Src}\n", "")
  .replace('              preload="auto"\n', '              preload="metadata"\n');

source = source.replace(
  'className="absolute inset-0 bg-cover bg-center"',
  'className="absolute inset-0 bg-cover bg-[position:46%_50%] md:bg-center"'
);
source = source.replace(
  'className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[800ms] pointer-events-none"',
  'className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 transition-opacity duration-[800ms] pointer-events-none"'
);

if (source.includes('import Hls from "hls.js";')) throw new Error("Static hls.js import still present");
if (!source.includes('import("hls.js")')) throw new Error("Dynamic hls.js import missing");
if (!source.includes(HLS_MASTER)) throw new Error("Adaptive HLS source missing");
if (!source.includes("canNativeHls")) throw new Error("Native HLS detection missing");
if (source.includes('addEventListener("waiting"')) throw new Error("Waiting recovery still present");
if (source.includes('addEventListener("stalled"')) throw new Error("Stalled recovery still present");
if (source.includes('addEventListener("pause"')) throw new Error("Pause recovery still present");
if (source.includes("manualLoopIfNearEnd")) throw new Error("Manual loop seek still present");
if (source.includes('addEventListener("ended"')) throw new Error("Ended restart still present");
if (source.includes("loopVideoRef")) throw new Error("Dual video layer still present");
if (!source.includes("bg-[position:46%_50%] md:bg-center")) throw new Error("Poster focal lock missing");
if (!source.includes("object-[46%_50%] md:object-center")) throw new Error("Video focal lock missing");

await writeFile(pagePath, source);
console.log("V6_3_ADAPTIVE_HLS_HERO_PREPARED", {
  master: HLS_MASTER,
  ladder: [
    "1080p59.94 ~7.0Mbps",
    "720p59.94 ~3.8Mbps",
    "540p29.97 ~1.9Mbps",
  ],
  safariNativeHls: true,
  lazyHlsJsElsewhere: true,
  mp4Fallback: MOBILE_HERO,
  waitingRecovery: false,
  stalledRecovery: false,
  pauseRecovery: false,
  manualSeek: false,
  focalPosition: "46% 50%",
});