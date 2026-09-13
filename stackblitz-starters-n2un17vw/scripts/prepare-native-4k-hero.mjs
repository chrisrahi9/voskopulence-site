import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const DESKTOP_HERO = "/hero_web_v6_3_seamless.mp4";
const MOBILE_HERO = "/hero_web_v6_3_mobile.mp4";
const MOBILE_720_HLS = "/hero_hls_v6_3/720p/playlist.m3u8";
const HERO_POSTER = "/hero_web_v6_3_poster.jpg";
const HERO_VERSION = "20260913-v6-3-trial-hybrid-fallback";

// Trial only: preserve the robust direct-MP4 path, but allow one controlled
// mobile downgrade if the 1080p cold start clearly cannot sustain playback.
source = source.replace('import Hls from "hls.js";\n', "");

source = source
  .replace(
    /const HERO_VIDEO_VERSION = "[^"]+";/,
    `const HERO_VIDEO_VERSION = "${HERO_VERSION}";`
  )
  .replace(
    /const heroMp4Src = [^;]+;/,
    `const heroMp4Src = "${DESKTOP_HERO}?v=${HERO_VERSION}";\n  const heroMobileMp4Src = "${MOBILE_HERO}?v=${HERO_VERSION}";\n  const heroMobile720HlsSrc = "${MOBILE_720_HLS}?v=${HERO_VERSION}";`
  )
  .replace(
    /const heroPosterSrc = [^;]+;/,
    `const heroPosterSrc = "${HERO_POSTER}?v=${HERO_VERSION}";`
  );

const trialPlaybackEffect = `  // Trial hybrid: direct 1080p MP4 first; one 720p fallback only if mobile startup struggles.\n  useEffect(() => {\n    const v = videoRef.current;\n    if (!v) return;\n\n    const isCompactHero =\n      window.matchMedia?.("(max-width: 767px)")?.matches ?? window.innerWidth < 768;\n    const expectedSrc = isCompactHero ? heroMobileMp4Src : heroMp4Src;\n    const canNativeHls = Boolean(v.canPlayType("application/vnd.apple.mpegurl"));\n    let disposed = false;\n    let fallbackUsed = false;\n    let hls: any = null;\n    let firstPlayingAt = 0;\n    let startupTimer: ReturnType<typeof setTimeout> | null = null;\n\n    v.loop = true;\n    v.defaultMuted = true;\n    v.muted = true;\n    v.autoplay = true;\n    v.playsInline = true;\n    v.preload = "auto";\n    v.removeAttribute("poster");\n    v.setAttribute("loop", "");\n    v.setAttribute("muted", "");\n    v.setAttribute("autoplay", "");\n    v.setAttribute("playsinline", "");\n    v.setAttribute("webkit-playsinline", "");\n\n    const tryPlay = () => {\n      if (disposed || document.visibilityState !== "visible") return;\n      const p = v.play?.();\n      if (p && typeof p.catch === "function") p.catch(() => {});\n    };\n\n    const reveal = () => {\n      if (!firstPlayingAt) firstPlayingAt = performance.now();\n      if (startupTimer) {\n        clearTimeout(startupTimer);\n        startupTimer = null;\n      }\n      revealHeroVideo(v);\n    };\n    v.addEventListener("playing", reveal);\n\n    const switchTo720 = () => {\n      if (!isCompactHero || fallbackUsed || disposed) return;\n      fallbackUsed = true;\n      if (startupTimer) {\n        clearTimeout(startupTimer);\n        startupTimer = null;\n      }\n\n      // Cover the one-time source handoff with the existing static poster.\n      v.style.transition = "opacity 120ms ease";\n      v.style.opacity = "0";\n      try { hls?.destroy(); } catch {}\n      hls = null;\n\n      if (canNativeHls) {\n        v.setAttribute("src", heroMobile720HlsSrc);\n        try { v.load(); } catch {}\n        tryPlay();\n        return;\n      }\n\n      import("hls.js")\n        .then(({ default: Hls }) => {\n          if (disposed || !fallbackUsed) return;\n          if (!Hls.isSupported()) {\n            // If HLS is unavailable, keep the original MP4 rather than entering a reload loop.\n            v.setAttribute("src", heroMobileMp4Src);\n            try { v.load(); } catch {}\n            tryPlay();\n            return;\n          }\n          hls = new Hls({\n            enableWorker: true,\n            startLevel: 0,\n            capLevelToPlayerSize: false,\n            maxBufferLength: 20,\n            maxMaxBufferLength: 30,\n          });\n          hls.attachMedia(v);\n          hls.on(Hls.Events.MEDIA_ATTACHED, () => {\n            if (!disposed) hls?.loadSource(heroMobile720HlsSrc);\n          });\n          hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay());\n        })\n        .catch(() => {\n          if (disposed) return;\n          v.setAttribute("src", heroMobileMp4Src);\n          try { v.load(); } catch {}\n          tryPlay();\n        });\n    };\n\n    const earlyBufferFailure = () => {\n      if (!isCompactHero || fallbackUsed || disposed || document.visibilityState !== "visible") return;\n      const beforeStableStart = !firstPlayingAt;\n      const shortlyAfterStart = firstPlayingAt > 0 && performance.now() - firstPlayingAt < 3500;\n      if ((beforeStableStart || shortlyAfterStart) && v.readyState < 3) switchTo720();\n    };\n\n    if (v.getAttribute("src") !== expectedSrc) {\n      v.setAttribute("src", expectedSrc);\n      try { v.load(); } catch {}\n    }\n\n    if (isCompactHero) {\n      // Give the robust 1080p MP4 a fair cold-start window before downgrading.\n      startupTimer = setTimeout(() => {\n        if (!firstPlayingAt && v.readyState < 3) switchTo720();\n      }, 3500);\n      v.addEventListener("waiting", earlyBufferFailure);\n      v.addEventListener("stalled", earlyBufferFailure);\n    }\n\n    tryPlay();\n\n    const onVis = () => {\n      if (document.visibilityState === "visible" && v.paused) tryPlay();\n    };\n    document.addEventListener("visibilitychange", onVis);\n\n    return () => {\n      disposed = true;\n      if (startupTimer) clearTimeout(startupTimer);\n      v.removeEventListener("playing", reveal);\n      v.removeEventListener("waiting", earlyBufferFailure);\n      v.removeEventListener("stalled", earlyBufferFailure);\n      document.removeEventListener("visibilitychange", onVis);\n      try { hls?.destroy(); } catch {}\n    };\n  }, [heroMp4Src, heroMobileMp4Src, heroMobile720HlsSrc]);`;

const playbackBlock = /  \/\/ Use native HLS on iOS\/Safari and direct MP4 everywhere else\.\n  useEffect\(\(\) => \{[\s\S]*?  \}, \[heroMp4Src, heroPosterSrc, heroHlsSrc, heroHlsIos1080Src\]\);/;
if (!playbackBlock.test(source)) {
  throw new Error("Original hero playback controller block not found");
}
source = source.replace(playbackBlock, trialPlaybackEffect);

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
  'className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 transition-opacity duration-[300ms] pointer-events-none"'
);

if (source.includes('import Hls from "hls.js";')) throw new Error("Static hls.js import still present");
if (!source.includes('import("hls.js")')) throw new Error("Emergency hls.js fallback missing");
if (!source.includes(MOBILE_720_HLS)) throw new Error("720p trial fallback missing");
if (!source.includes("switchTo720")) throw new Error("One-time fallback controller missing");
if (!source.includes('v.removeAttribute("poster")')) throw new Error("Single poster layer missing");
if (!source.includes('v.preload = "auto"')) throw new Error("Auto preload missing");
if (source.includes("manualLoopIfNearEnd")) throw new Error("Manual loop seek still present");
if (source.includes('addEventListener("ended"')) throw new Error("Ended restart still present");
if (source.includes("loopVideoRef")) throw new Error("Dual video layer still present");
if (!source.includes("bg-[position:46%_50%] md:bg-center")) throw new Error("Poster focal lock missing");
if (!source.includes("object-[46%_50%] md:object-center")) throw new Error("Video focal lock missing");

await writeFile(pagePath, source);
console.log("V6_3_TRIAL_HYBRID_HERO_PREPARED", {
  productionUntouched: true,
  primary: "1080p60 progressive MP4 ~7.5Mbps",
  mobileFallback: "720p60 single-rendition HLS ~3.8Mbps",
  fallbackPolicy: "one switch only on cold-start timeout or early buffering",
  startupGraceMs: 3500,
  earlyBufferWindowMs: 3500,
  posterCoversFallbackHandoff: true,
  desktopUnchanged: true,
  manualSeek: false,
  focalPosition: "46% 50%",
});