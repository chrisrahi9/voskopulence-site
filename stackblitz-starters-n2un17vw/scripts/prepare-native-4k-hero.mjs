import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const DESKTOP_HERO = "/hero_web_v6_3_mobile.mp4";
const MOBILE_FALLBACK = "/hero_web_v6_3_mobile.mp4";
const HLS_MASTER = "/hero_hls_v6_3/master.m3u8";
const HERO_POSTER = "/hero_web_v6_3_poster.jpg";
const HERO_VERSION = "20260913-v6-3-adaptive-viewport-aware";

source = source.replace('import Hls from "hls.js";\n', "");

source = source
  .replace(
    /const HERO_VIDEO_VERSION = "[^"]+";/,
    `const HERO_VIDEO_VERSION = "${HERO_VERSION}";`
  )
  .replace(
    /const heroMp4Src = [^;]+;/,
    `const heroMp4Src = "${DESKTOP_HERO}?v=${HERO_VERSION}";\n  const heroMobileMp4Src = "${MOBILE_FALLBACK}?v=${HERO_VERSION}";\n  const heroAdaptiveHlsSrc = "${HLS_MASTER}?v=${HERO_VERSION}";`
  )
  .replace(
    /const heroPosterSrc = [^;]+;/,
    `const heroPosterSrc = "${HERO_POSTER}?v=${HERO_VERSION}";`
  );

const robustPlaybackEffect = `  // Professional hero delivery:\n  // desktop = stable progressive 1080p60 MP4\n  // compact/mobile = adaptive HLS with native Safari support or lazy hls.js\n  // decoder pauses while hero is well offscreen to keep scrolling fluid\n  useEffect(() => {\n    const v = videoRef.current;\n    if (!v) return;\n\n    const isCompactHero =\n      window.matchMedia?.("(max-width: 767px)")?.matches ?? window.innerWidth < 768;\n    const canNativeHls = Boolean(v.canPlayType("application/vnd.apple.mpegurl"));\n    let hls: any = null;\n    let disposed = false;\n    let heroNearViewport = true;\n    let resumeTimer: ReturnType<typeof setTimeout> | null = null;\n\n    v.loop = true;\n    v.defaultMuted = true;\n    v.muted = true;\n    v.autoplay = true;\n    v.playsInline = true;\n    v.preload = "auto";\n    v.removeAttribute("poster");\n    v.setAttribute("loop", "");\n    v.setAttribute("muted", "");\n    v.setAttribute("autoplay", "");\n    v.setAttribute("playsinline", "");\n    v.setAttribute("webkit-playsinline", "");\n\n    const reveal = () => revealHeroVideo(v, 220);\n    v.addEventListener("playing", reveal);\n\n    const tryPlay = () => {\n      if (disposed || document.visibilityState !== "visible" || !heroNearViewport) return;\n      const p = v.play?.();\n      if (p && typeof p.catch === "function") p.catch(() => {});\n    };\n\n    const assignMp4Once = () => {\n      if (disposed) return;\n      if (v.getAttribute("src") !== heroMobileMp4Src) {\n        v.setAttribute("src", heroMobileMp4Src);\n        try { v.load(); } catch {}\n      }\n      tryPlay();\n    };\n\n    if (!isCompactHero) {\n      v.setAttribute("src", heroMp4Src);\n      try { v.load(); } catch {}\n      tryPlay();\n    } else if (canNativeHls) {\n      v.setAttribute("src", heroAdaptiveHlsSrc);\n      try { v.load(); } catch {}\n      tryPlay();\n    } else {\n      import("hls.js")\n        .then(({ default: Hls }) => {\n          if (disposed) return;\n          if (!Hls.isSupported()) {\n            assignMp4Once();\n            return;\n          }\n          hls = new Hls({\n            enableWorker: true,\n            startLevel: -1,\n            testBandwidth: true,\n            capLevelToPlayerSize: false,\n            abrBandWidthFactor: 0.8,\n            abrBandWidthUpFactor: 0.7,\n            maxBufferLength: 10,\n            maxMaxBufferLength: 20,\n            backBufferLength: 0,\n            maxStarvationDelay: 1.5,\n            maxLoadingDelay: 1.5,\n            fragLoadingTimeOut: 10000,\n            manifestLoadingTimeOut: 7000,\n          });\n          hls.attachMedia(v);\n          hls.on(Hls.Events.MEDIA_ATTACHED, () => {\n            if (!disposed) hls?.loadSource(heroAdaptiveHlsSrc);\n          });\n          hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay());\n          hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {\n            if (!disposed && data?.fatal) {\n              try { hls?.destroy(); } catch {}\n              hls = null;\n              assignMp4Once();\n            }\n          });\n        })\n        .catch(assignMp4Once);\n    }\n\n    const viewportObserver = new IntersectionObserver(\n      ([entry]) => {\n        if (disposed || !entry) return;\n        const wasNear = heroNearViewport;\n        heroNearViewport = entry.isIntersecting;\n        if (!heroNearViewport) {\n          if (!v.paused) { try { v.pause(); } catch {} }\n          if (hls) { try { hls.stopLoad(); } catch {} }\n        } else if (!wasNear) {\n          if (hls) { try { hls.startLoad(-1); } catch {} }\n          tryPlay();\n        }\n      },\n      { root: null, rootMargin: "120% 0px 120% 0px", threshold: 0 }\n    );\n    viewportObserver.observe(v);\n\n    const resumeAfterBackground = () => {\n      if (disposed || document.visibilityState !== "visible" || !heroNearViewport) return;\n      if (resumeTimer) clearTimeout(resumeTimer);\n      const before = v.currentTime;\n      tryPlay();\n      resumeTimer = setTimeout(() => {\n        if (disposed || document.visibilityState !== "visible" || !heroNearViewport) return;\n        const frozen = v.paused || v.readyState < 2 || Math.abs(v.currentTime - before) < 0.02;\n        if (!frozen) return;\n        if (hls) {\n          try { hls.startLoad(-1); } catch {}\n          tryPlay();\n          return;\n        }\n        try { v.load(); } catch {}\n        tryPlay();\n      }, 850);\n    };\n\n    const onVisibility = () => {\n      if (document.visibilityState === "visible") resumeAfterBackground();\n    };\n    const onPageShow = () => resumeAfterBackground();\n    const onFocus = () => resumeAfterBackground();\n    document.addEventListener("visibilitychange", onVisibility);\n    window.addEventListener("pageshow", onPageShow);\n    window.addEventListener("focus", onFocus);\n\n    return () => {\n      disposed = true;\n      viewportObserver.disconnect();\n      if (resumeTimer) clearTimeout(resumeTimer);\n      v.removeEventListener("playing", reveal);\n      document.removeEventListener("visibilitychange", onVisibility);\n      window.removeEventListener("pageshow", onPageShow);\n      window.removeEventListener("focus", onFocus);\n      try { hls?.destroy(); } catch {}\n    };\n  }, [heroMp4Src, heroMobileMp4Src, heroAdaptiveHlsSrc]);`;

const playbackBlock = /  \/\/ Use native HLS on iOS\/Safari and direct MP4 everywhere else\.\n  useEffect\(\(\) => \{[\s\S]*?  \}, \[heroMp4Src, heroPosterSrc, heroHlsSrc, heroHlsIos1080Src\]\);/;
if (!playbackBlock.test(source)) {
  throw new Error("Original hero playback controller block not found");
}
source = source.replace(playbackBlock, robustPlaybackEffect);

source = source
  .replace("              src={heroMp4Src}\n", "")
  .replace(/              poster=\{heroPosterSrc\}\n/, "")
  .replace('              preload="metadata"\n', '              preload="auto"\n');

source = source.replace(
  'className="absolute inset-0 bg-cover bg-center"',
  'className="absolute inset-0 bg-cover bg-[position:46%_50%] md:bg-center"'
);
source = source.replace(
  'className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[800ms] pointer-events-none"',
  'className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 transition-opacity duration-[220ms] pointer-events-none"'
);

if (source.includes('import Hls from "hls.js";')) throw new Error("Static hls.js import still present");
if (!source.includes('import("hls.js")')) throw new Error("Lazy mobile hls.js import missing");
if (!source.includes(HLS_MASTER)) throw new Error("Adaptive HLS source missing");
if (!source.includes("IntersectionObserver")) throw new Error("Viewport lifecycle missing");
if (!source.includes("resumeAfterBackground")) throw new Error("Lifecycle recovery missing");
if (source.includes("manualLoopIfNearEnd")) throw new Error("Manual loop seek still present");
if (source.includes('addEventListener("ended"')) throw new Error("Ended restart still present");
if (source.includes("loopVideoRef")) throw new Error("Dual video layer still present");
if (!source.includes("bg-[position:46%_50%] md:bg-center")) throw new Error("Poster focal lock missing");
if (!source.includes("object-[46%_50%] md:object-center")) throw new Error("Video focal lock missing");

await writeFile(pagePath, source);
console.log("V6_3_VIEWPORT_AWARE_ADAPTIVE_HERO_PREPARED", {
  desktop: "1080p60 direct MP4",
  mobile: "adaptive HLS four-level ladder",
  viewportPause: true,
  preResumeMargin: "120% viewport",
  lifecycleWatchdog: true,
  manualSeek: false,
  dualVideo: false,
  focalPosition: "46% 50%",
});