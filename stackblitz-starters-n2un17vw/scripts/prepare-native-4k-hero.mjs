import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const HERO_FILE = "hero_web_v6_3.mp4";
const HERO_VERSION = "20260912-v6-3-internal-loop";
const LOOP_START = 4.25;
const LOOP_END = 11.25;

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

// Keep the established iPhone/Safari recovery controller, but use the matching
// Bunny MP4 until fresh adaptive v6_3 HLS renditions are available.
source = source.replace(
  "    const shouldUseNativeHls = isiOS || isSafariDesktop;",
  "    const shouldUseNativeHls = false;"
);

// Use one video layer only. The stock clip's literal first and last frames are
// too different to loop invisibly, so preview a visually closer internal cycle.
source = source
  .replace("      v.loop = true;", "      v.loop = false;")
  .replace('      v.setAttribute("loop", "");', '      v.removeAttribute("loop");')
  .replace("              loop\n", "");

const restartStart = source.indexOf("    const restart = () => {");
const restartEnd = source.indexOf("\n\n    const manualLoopIfNearEnd = () => {", restartStart);
if (restartStart === -1 || restartEnd === -1) {
  throw new Error("Hero restart block not found");
}
const restartBlock = `    const restart = () => {
      if (destroyed) return;
      manualLooping = false;
      try {
        v.currentTime = ${LOOP_START};
      } catch {}
      play();
    };`;
source = source.slice(0, restartStart) + restartBlock + source.slice(restartEnd);

const loopStart = source.indexOf("    const manualLoopIfNearEnd = () => {");
const loopEnd = source.indexOf("\n\n    applyVideoFlags();", loopStart);
if (loopStart === -1 || loopEnd === -1) {
  throw new Error("Hero near-end loop block not found");
}
const loopBlock = `    const manualLoopIfNearEnd = () => {
      if (destroyed || manualLooping || !Number.isFinite(v.duration)) return;
      if (v.currentTime >= ${LOOP_END}) {
        manualLooping = true;
        try {
          v.currentTime = ${LOOP_START};
        } catch {}
        manualLooping = false;
      }
    };`;
source = source.slice(0, loopStart) + loopBlock + source.slice(loopEnd);

// Start at the internal cycle rather than showing the literal beginning first.
source = source.replace(
  "    applyVideoFlags();\n    ensureSource();",
  `    applyVideoFlags();\n    ensureSource();\n    const startAtInternalLoop = () => {\n      if (!Number.isFinite(v.duration)) return;\n      if (v.currentTime < ${LOOP_START - 0.2}) {\n        try { v.currentTime = ${LOOP_START}; } catch {}\n      }\n    };`
);
source = source.replace(
  '    v.addEventListener("loadeddata", reveal);',
  '    v.addEventListener("loadeddata", startAtInternalLoop);\n    v.addEventListener("loadeddata", reveal);'
);
source = source.replace(
  '      v.removeEventListener("loadeddata", reveal);',
  '      v.removeEventListener("loadeddata", startAtInternalLoop);\n      v.removeEventListener("loadeddata", reveal);'
);

// Reframe the landscape source slightly on narrow phones so the turquoise
// channel sits closer to the visual centre. Desktop framing stays unchanged.
source = source.replace(
  'className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[800ms] pointer-events-none"',
  'className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 transition-opacity duration-[800ms] pointer-events-none"'
);

if (!source.includes(HERO_FILE)) throw new Error("v6_3 source missing");
if (!source.includes(`v.currentTime = ${LOOP_START}`)) throw new Error("Internal loop start missing");
if (!source.includes(`v.currentTime >= ${LOOP_END}`)) throw new Error("Internal loop end missing");
if (!source.includes("object-[46%_50%] md:object-center")) throw new Error("Mobile focal crop missing");
if (source.includes("loopVideoRef")) throw new Error("Dual-video overlap code leaked into single-layer preview");

await writeFile(pagePath, source);
console.log("BUNNY_V6_3_INTERNAL_LOOP_PREVIEW", {
  file: HERO_FILE,
  cdn: "https://vosko-cdn.b-cdn.net",
  sourceFps: 59.94,
  sourceResolution: "3840x2160",
  mobileObjectPosition: "46% 50%",
  loopStartSeconds: LOOP_START,
  loopEndSeconds: LOOP_END,
  singleVideoLayer: true,
  opacityLoopEffect: false,
  adaptiveHlsPendingFinalization: true,
});