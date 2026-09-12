import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const DESKTOP_HERO = "/hero_web_v6_3_seamless.mp4";
const MOBILE_HERO = "/hero_web_v6_3_mobile.mp4";
const HERO_POSTER = "/hero_web_v6_3_poster.jpg";
const HERO_VERSION = "20260912-v6-3-native-safari";

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

const simplePlaybackEffect = `  // Native, single-source hero playback. Safari manages its own buffering.\n  useEffect(() => {\n    const v = videoRef.current;\n    if (!v) return;\n\n    const isCompactHero =\n      window.matchMedia?.("(max-width: 767px)")?.matches ?? window.innerWidth < 768;\n    const expectedSrc = isCompactHero ? heroMobileMp4Src : heroMp4Src;\n\n    v.loop = true;\n    v.defaultMuted = true;\n    v.muted = true;\n    v.autoplay = true;\n    v.playsInline = true;\n    v.preload = isCompactHero ? "metadata" : "auto";\n    v.poster = heroPosterSrc;\n    v.setAttribute("loop", "");\n    v.setAttribute("muted", "");\n    v.setAttribute("autoplay", "");\n    v.setAttribute("playsinline", "");\n    v.setAttribute("webkit-playsinline", "");\n\n    // Assign the source exactly once. No stalled/waiting recovery seeks and no\n    // source reassignment while Safari is buffering.\n    if (v.getAttribute("src") !== expectedSrc) {\n      v.setAttribute("src", expectedSrc);\n      try { v.load(); } catch {}\n    }\n\n    const reveal = () => revealHeroVideo(v);\n    v.addEventListener("playing", reveal);\n\n    const tryPlay = () => {\n      if (document.visibilityState !== "visible") return;\n      const p = v.play?.();\n      if (p && typeof p.catch === "function") p.catch(() => {});\n    };\n\n    tryPlay();\n\n    // Only resume after returning to the tab. Never seek or reload.\n    const onVis = () => {\n      if (document.visibilityState === "visible" && v.paused) tryPlay();\n    };\n    document.addEventListener("visibilitychange", onVis);\n\n    return () => {\n      v.removeEventListener("playing", reveal);\n      document.removeEventListener("visibilitychange", onVis);\n    };\n  }, [heroMp4Src, heroMobileMp4Src, heroPosterSrc]);`;

const playbackBlock = /  \/\/ Use native HLS on iOS\/Safari and direct MP4 everywhere else\.\n  useEffect\(\(\) => \{[\s\S]*?  \}, \[heroMp4Src, heroPosterSrc, heroHlsSrc, heroHlsIos1080Src\]\);/;
if (!playbackBlock.test(source)) {
  throw new Error("Original hero playback controller block not found");
}
source = source.replace(playbackBlock, simplePlaybackEffect);

// Do not let markup preload the desktop rendition before JS selects mobile vs desktop.
source = source
  .replace("              src={heroMp4Src}\n", "")
  .replace('              preload="auto"\n', '              preload="metadata"\n');

// Poster and video use identical focal framing, eliminating handoff motion.
source = source.replace(
  'className="absolute inset-0 bg-cover bg-center"',
  'className="absolute inset-0 bg-cover bg-[position:46%_50%] md:bg-center"'
);
source = source.replace(
  'className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[800ms] pointer-events-none"',
  'className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 transition-opacity duration-[800ms] pointer-events-none"'
);

if (!source.includes(MOBILE_HERO)) throw new Error("Mobile hero source missing");
if (!source.includes("isCompactHero ? heroMobileMp4Src : heroMp4Src")) throw new Error("Responsive source selection missing");
if (source.includes('addEventListener("waiting"')) throw new Error("Waiting recovery still present");
if (source.includes('addEventListener("stalled"')) throw new Error("Stalled recovery still present");
if (source.includes('addEventListener("pause"')) throw new Error("Pause recovery still present");
if (source.includes("manualLoopIfNearEnd")) throw new Error("Manual loop seek still present");
if (source.includes('addEventListener("ended"')) throw new Error("Ended restart still present");
if (source.includes("loopVideoRef")) throw new Error("Dual video layer still present");
if (!source.includes("bg-[position:46%_50%] md:bg-center")) throw new Error("Poster focal lock missing");
if (!source.includes("object-[46%_50%] md:object-center")) throw new Error("Video focal lock missing");

await writeFile(pagePath, source);
console.log("V6_3_NATIVE_SAFARI_HERO_PREPARED", {
  mobile: MOBILE_HERO,
  mobileResolution: "1920x1080",
  mobileFps: 59.94,
  mobileBitrateMbps: 7.5,
  nativeLoop: true,
  waitingRecovery: false,
  stalledRecovery: false,
  pauseRecovery: false,
  manualSeek: false,
  sourceReassignmentDuringPlayback: false,
  focalPosition: "46% 50%",
});