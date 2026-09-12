import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const HERO_FILE = "hero_web_v6_3.mp4";
const HERO_VERSION = "20260912-v6-3-loop-crop";

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
  .replace(
    'const heroPosterSrc = heroDirectAsset("/hero_poster.jpg");',
    'const heroPosterSrc = "";'
  );

// For this preview, keep the proven Safari/iOS recovery controller but use the
// matching Bunny MP4 instead of the old HLS playlist, which still contains the
// previous hero footage. The final production version will get fresh v6_3 HLS.
source = source.replace(
  "    const shouldUseNativeHls = isiOS || isSafariDesktop;",
  [
    "    // v6_3 refinement preview: same source on all browsers until the new",
    "    // adaptive v6_3 HLS renditions are uploaded.",
    "    const shouldUseNativeHls = false;",
  ].join("\n")
);

// We handle the loop just before the physical end so the browser never performs
// a visually abrupt native end->start cut.
source = source
  .replace("      v.loop = true;", "      v.loop = false;")
  .replace('      v.setAttribute("loop", "");', '      v.removeAttribute("loop");')
  .replace("              loop\n", "");

const restartStart = source.indexOf("    const restart = () => {");
const restartEnd = source.indexOf("\n\n    const manualLoopIfNearEnd = () => {", restartStart);
if (restartStart === -1 || restartEnd === -1) {
  throw new Error("Hero restart block not found");
}
const smoothRestart = `    const restart = () => {
      if (destroyed) return;
      try {
        v.currentTime = 0;
      } catch {}
      play();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (destroyed) return;
          v.style.transition = "opacity 520ms cubic-bezier(0.22, 1, 0.36, 1)";
          v.style.opacity = "1";
        });
      });
      window.setTimeout(() => {
        manualLooping = false;
      }, 560);
    };`;
source = source.slice(0, restartStart) + smoothRestart + source.slice(restartEnd);

const loopStart = source.indexOf("    const manualLoopIfNearEnd = () => {");
const loopEnd = source.indexOf("\n\n    applyVideoFlags();", loopStart);
if (loopStart === -1 || loopEnd === -1) {
  throw new Error("Hero near-end loop block not found");
}
const smoothLoop = `    const manualLoopIfNearEnd = () => {
      if (
        destroyed ||
        manualLooping ||
        !Number.isFinite(v.duration) ||
        v.duration <= 1
      ) {
        return;
      }

      // Soften the transition before seeking back to frame 0. This avoids the
      // hard visual cut while still decoding only one 4K60 stream on mobile.
      if (v.duration - v.currentTime <= 0.48) {
        manualLooping = true;
        v.style.transition = "opacity 360ms cubic-bezier(0.4, 0, 1, 1)";
        v.style.opacity = "0.16";
        window.setTimeout(() => {
          if (!destroyed) restart();
        }, 300);
      }
    };`;
source = source.slice(0, loopStart) + smoothLoop + source.slice(loopEnd);

// Reframe the landscape source slightly on narrow phones. This moves the
// turquoise channel toward the visual centre without altering desktop framing.
source = source.replace(
  'className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[800ms] pointer-events-none"',
  'className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 transition-opacity duration-[800ms] pointer-events-none"'
);

if (!source.includes(HERO_FILE)) {
  throw new Error(`Hero source ${HERO_FILE} was not installed`);
}
if (!source.includes("object-[46%_50%] md:object-center")) {
  throw new Error("Mobile v6_3 focal crop was not installed");
}
if (!source.includes('v.style.opacity = "0.16";')) {
  throw new Error("Soft loop transition was not installed");
}
if (source.includes("hero_web_v6_slow60_seamless.mp4")) {
  throw new Error("Previous processed slow-motion hero is still present");
}
if (source.includes("raw.githubusercontent.com/chrisrahi9/voskopulence-site")) {
  throw new Error("Raw GitHub hero delivery is still present");
}

await writeFile(pagePath, source);
console.log("BUNNY_V6_3_REFINED_PREVIEW", {
  file: HERO_FILE,
  cdn: "https://vosko-cdn.b-cdn.net",
  sourceFps: 59.94,
  sourceResolution: "3840x2160",
  playbackRate: 1,
  mobileObjectPosition: "46% 50%",
  softLoopLeadSeconds: 0.48,
  nativeLoopDisabled: true,
  iosSafariRecoveryController: true,
  freshAdaptiveHlsPendingFinalization: true,
});