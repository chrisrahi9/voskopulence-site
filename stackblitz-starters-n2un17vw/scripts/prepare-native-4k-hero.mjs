import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const DESKTOP_HERO = "/hero_web_v6_3_seamless.mp4";
const MOBILE_HERO = "/hero_web_v6_3_mobile.mp4";
const HLS_MASTER = "/hero_hls_v6_3/master.m3u8";
const HERO_POSTER = "/hero_web_v6_3_poster.jpg";
const HERO_VERSION = "20260912-v6-3-desktop-mp4-hls-mobile";

// Keep hls.js out of the initial bundle. Desktop uses direct MP4; Safari mobile uses native HLS.
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

const adaptivePlaybackEffect = `  // Desktop uses a direct progressive 1080p60 MP4 for predictable cold starts.\n  // Compact/mobile screens keep adaptive HLS. No corrective seeking anywhere.\n  useEffect(() => {\n    const v = videoRef.current;\n    if (!v) return;\n\n    const isCompactHero =\n      window.matchMedia?.("(max-width: 767px)")?.matches ?? window.innerWidth < 768;\n    const mobileFallbackMp4 = heroMobileMp4Src;\n    const desktopMp4 = heroMobileMp4Src; // 1920x1080 59.94fps ~7.5Mbps, faststart\n    const canNativeHls = Boolean(v.canPlayType("application/vnd.apple.mpegurl"));\n    let hls: any = null;\n    let disposed = false;\n\n    v.loop = true;\n    v.defaultMuted = true;\n    v.muted = true;\n    v.autoplay = true;\n    v.playsInline = true;\n    v.preload = isCompactHero ? "metadata" : "auto";\n    v.poster = heroPosterSrc;\n    v.setAttribute("loop", "");\n    v.setAttribute("muted", "");\n    v.setAttribute("autoplay", "");\n    v.setAttribute("playsinline", "");\n    v.setAttribute("webkit-playsinline", "");\n\n    const reveal = () => revealHeroVideo(v);\n    v.addEventListener("playing", reveal);\n\n    const tryPlay = () => {\n      if (disposed || document.visibilityState !== "visible") return;\n      const p = v.play?.();\n      if (p && typeof p.catch === "function") p.catch(() => {});\n    };\n\n    const assignMp4 = (src: string) => {\n      if (disposed) return;\n      try { hls?.destroy(); } catch {}\n      hls = null;\n      if (v.getAttribute("src") !== src) {\n        v.setAttribute("src", src);\n        try { v.load(); } catch {}\n      }\n      tryPlay();\n    };\n\n    if (!isCompactHero) {\n      // Desktop: skip manifest parsing, ABR startup estimation and hls.js entirely.\n      // Use the lightweight 1080p60 fast-start MP4 directly.\n      assignMp4(desktopMp4);\n    } else if (canNativeHls) {\n      // iPhone/Safari: native adaptive HLS, no hls.js download.\n      v.setAttribute("src", heroAdaptiveHlsSrc);\n      try { v.load(); } catch {}\n      tryPlay();\n    } else {\n      // Other compact/mobile browsers load hls.js only if needed.\n      import("hls.js")\n        .then(({ default: Hls }) => {\n          if (disposed) return;\n          if (!Hls.isSupported()) {\n            assignMp4(mobileFallbackMp4);\n            return;\n          }\n\n          hls = new Hls({\n            enableWorker: true,\n            startLevel: -1,\n            capLevelToPlayerSize: false,\n            abrBandWidthFactor: 0.9,\n            abrBandWidthUpFactor: 0.8,\n            maxBufferLength: 20,\n            maxMaxBufferLength: 40,\n            maxStarvationDelay: 3,\n            maxLoadingDelay: 3,\n          });\n          hls.attachMedia(v);\n          hls.on(Hls.Events.MEDIA_ATTACHED, () => {\n            if (!disposed) hls?.loadSource(heroAdaptiveHlsSrc);\n          });\n          hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay());\n          hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {\n            if (!disposed && data?.fatal) assignMp4(mobileFallbackMp4);\n          });\n        })\n        .catch(() => assignMp4(mobileFallbackMp4));\n    }\n\n    // Resume only after tab/app visibility returns. Never reload or seek.\n    const onVis = () => {\n      if (document.visibilityState === "visible" && v.paused) tryPlay();\n    };\n    document.addEventListener("visibilitychange", onVis);\n\n    return () => {\n      disposed = true;\n      v.removeEventListener("playing", reveal);\n      document.removeEventListener("visibilitychange", onVis);\n      try { hls?.destroy(); } catch {}\n    };\n  }, [heroMp4Src, heroMobileMp4Src, heroAdaptiveHlsSrc, heroPosterSrc]);`;

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
if (!source.includes('import("hls.js")')) throw new Error("Dynamic mobile hls.js import missing");
if (!source.includes(HLS_MASTER)) throw new Error("Adaptive mobile HLS source missing");
if (!source.includes("if (!isCompactHero)")) throw new Error("Desktop MP4 branch missing");
if (!source.includes("const desktopMp4 = heroMobileMp4Src")) throw new Error("Optimized desktop 1080p MP4 missing");
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
console.log("V6_3_DESKTOP_MP4_MOBILE_HLS_PREPARED", {
  desktop: "1920x1080 59.94fps progressive MP4 ~7.5Mbps",
  desktopHlsJs: false,
  desktopAbrStartup: false,
  mobileHls: HLS_MASTER,
  mobileLadder: [
    "1080p59.94 ~7.0Mbps",
    "720p59.94 ~3.8Mbps",
    "540p29.97 ~1.9Mbps",
  ],
  safariMobileNativeHls: true,
  mp4FastStart: true,
  waitingRecovery: false,
  stalledRecovery: false,
  pauseRecovery: false,
  manualSeek: false,
  focalPosition: "46% 50%",
});