import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pagePath, "utf8");

const HERO_FILE = "hero_web_v6_3.mp4";
const HERO_VERSION = "20260912-v6-3-overlap-loop";

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
  )
  .replace(
    '  const videoRef = useRef<HTMLVideoElement | null>(null);',
    '  const videoRef = useRef<HTMLVideoElement | null>(null);\n  const loopVideoRef = useRef<HTMLVideoElement | null>(null);'
  );

const effectStart =
  "  // Use native HLS on iOS/Safari and direct MP4 everywhere else.\n  useEffect(() => {";
const effectEnd =
  "  }, [heroMp4Src, heroPosterSrc, heroHlsSrc, heroHlsIos1080Src]);\n";
const effectStartIndex = source.indexOf(effectStart);
const effectEndIndex = source.indexOf(effectEnd, effectStartIndex);
if (effectStartIndex === -1 || effectEndIndex === -1) {
  throw new Error("Hero playback effect markers not found");
}

const overlapEffect = `  // Seamless v6_3 preview: the bridge video starts before the primary video ends,
  // then both streams are synchronized while the primary is reset underneath it.
  // This prevents a blank/white frame from ever being exposed during the loop.
  useEffect(() => {
    const primary = videoRef.current;
    const bridge = loopVideoRef.current;
    if (!primary || !bridge) return;

    let destroyed = false;
    let isHeroVisible = true;
    let crossing = false;
    let handoffTimer: number | null = null;
    let bridgeResetTimer: number | null = null;
    let recoveryTimer: number | null = null;

    const clearTimers = () => {
      if (handoffTimer != null) window.clearTimeout(handoffTimer);
      if (bridgeResetTimer != null) window.clearTimeout(bridgeResetTimer);
      if (recoveryTimer != null) window.clearTimeout(recoveryTimer);
      handoffTimer = null;
      bridgeResetTimer = null;
      recoveryTimer = null;
    };

    const configure = (v: HTMLVideoElement) => {
      v.loop = false;
      v.defaultMuted = true;
      v.muted = true;
      v.autoplay = false;
      v.playsInline = true;
      v.preload = "auto";
      v.removeAttribute("loop");
      v.setAttribute("muted", "");
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
      if (v.src !== heroMp4Src && v.currentSrc !== heroMp4Src) {
        v.src = heroMp4Src;
        try { v.load(); } catch {}
      }
    };

    configure(primary);
    configure(bridge);
    bridge.style.opacity = "0";
    bridge.style.transition = "none";

    const playPrimary = () => {
      if (destroyed || !isHeroVisible || document.visibilityState === "hidden") return;
      configure(primary);
      const p = primary.play?.();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    const reveal = () => revealHeroVideo(primary);

    const startOverlap = () => {
      if (
        destroyed || crossing || !isHeroVisible ||
        !Number.isFinite(primary.duration) || primary.duration <= 1 ||
        primary.duration - primary.currentTime > 0.78
      ) return;

      crossing = true;
      configure(bridge);
      try { bridge.currentTime = 0.03; } catch {}
      bridge.style.transition = "none";
      bridge.style.opacity = "0";

      const bridgePlay = bridge.play?.();
      if (bridgePlay && typeof bridgePlay.catch === "function") {
        bridgePlay.catch(() => { crossing = false; });
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (destroyed) return;
          bridge.style.transition = "opacity 520ms cubic-bezier(0.33, 1, 0.68, 1)";
          bridge.style.opacity = "1";
        });
      });

      handoffTimer = window.setTimeout(() => {
        if (destroyed) return;
        const bridgeTime = Math.max(0.03, bridge.currentTime || 0.03);
        try { primary.currentTime = bridgeTime; } catch {}
        const primaryPlay = primary.play?.();
        if (primaryPlay && typeof primaryPlay.catch === "function") {
          primaryPlay.catch(() => {});
        }

        // Both elements now show almost the same frame, so removing the bridge
        // is visually invisible and the next cycle continues on the primary.
        bridge.style.transition = "opacity 140ms linear";
        bridge.style.opacity = "0";

        bridgeResetTimer = window.setTimeout(() => {
          if (destroyed) return;
          try { bridge.pause(); } catch {}
          try { bridge.currentTime = 0.03; } catch {}
          bridge.style.transition = "none";
          crossing = false;
        }, 180);
      }, 560);
    };

    const scheduleRecovery = () => {
      if (destroyed || !isHeroVisible || document.visibilityState === "hidden") return;
      if (recoveryTimer != null) window.clearTimeout(recoveryTimer);
      recoveryTimer = window.setTimeout(() => {
        recoveryTimer = null;
        if (!destroyed && !crossing && primary.paused) playPrimary();
      }, 220);
    };

    primary.addEventListener("loadeddata", reveal);
    primary.addEventListener("canplay", reveal);
    primary.addEventListener("playing", reveal);
    primary.addEventListener("timeupdate", startOverlap);
    primary.addEventListener("pause", scheduleRecovery);
    primary.addEventListener("stalled", scheduleRecovery);
    primary.addEventListener("waiting", scheduleRecovery);

    playPrimary();

    const onVis = () => {
      if (document.visibilityState === "visible") playPrimary();
      else clearTimers();
    };
    document.addEventListener("visibilitychange", onVis);

    const io = new IntersectionObserver(
      ([entry]) => {
        isHeroVisible = entry.intersectionRatio > 0.03;
        if (isHeroVisible) playPrimary();
        else {
          try { primary.pause(); } catch {}
          try { bridge.pause(); } catch {}
        }
      },
      { threshold: [0, 0.03, 0.1, 0.25, 0.5, 1] }
    );
    io.observe(primary);

    const revealTimeout = window.setTimeout(reveal, 1200);

    return () => {
      destroyed = true;
      clearTimers();
      window.clearTimeout(revealTimeout);
      primary.removeEventListener("loadeddata", reveal);
      primary.removeEventListener("canplay", reveal);
      primary.removeEventListener("playing", reveal);
      primary.removeEventListener("timeupdate", startOverlap);
      primary.removeEventListener("pause", scheduleRecovery);
      primary.removeEventListener("stalled", scheduleRecovery);
      primary.removeEventListener("waiting", scheduleRecovery);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
    };
  }, [heroMp4Src]);
`;

source =
  source.slice(0, effectStartIndex) +
  overlapEffect +
  source.slice(effectEndIndex + effectEnd.length);

// Keep the channel centred on narrow phones while desktop uses the stock frame.
source = source.replace(
  'className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[800ms] pointer-events-none"',
  'className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 transition-opacity duration-[800ms] pointer-events-none"'
);

// Native looping must be off because the overlap controller performs the handoff.
source = source.replace("              loop\n", "");

const primaryVideoEndMarker = "              />";
const primaryVideoStart = source.indexOf("            <video\n              ref={videoRef}");
const primaryVideoEnd = source.indexOf(primaryVideoEndMarker, primaryVideoStart);
if (primaryVideoStart === -1 || primaryVideoEnd === -1) {
  throw new Error("Primary hero video markup not found");
}

const bridgeVideo = `

            <video
              ref={loopVideoRef}
              className="absolute inset-0 w-full h-full object-cover object-[46%_50%] md:object-center opacity-0 pointer-events-none"
              src={heroMp4Src}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noplaybackrate"
              style={{
                willChange: "opacity, transform",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
            />`;

source =
  source.slice(0, primaryVideoEnd + primaryVideoEndMarker.length) +
  bridgeVideo +
  source.slice(primaryVideoEnd + primaryVideoEndMarker.length);

if (!source.includes(HERO_FILE)) {
  throw new Error(`Hero source ${HERO_FILE} was not installed`);
}
if (!source.includes("loopVideoRef")) {
  throw new Error("Bridge video ref was not installed");
}
if (!source.includes("opacity 520ms")) {
  throw new Error("Overlap loop transition was not installed");
}
if (!source.includes("object-[46%_50%] md:object-center")) {
  throw new Error("Mobile v6_3 focal crop was not installed");
}
if (source.includes('v.style.opacity = "0.16"')) {
  throw new Error("Previous fade-to-background loop is still present");
}
if (source.includes("hero_web_v6_slow60_seamless.mp4")) {
  throw new Error("Previous processed slow-motion hero is still present");
}

await writeFile(pagePath, source);
console.log("BUNNY_V6_3_OVERLAP_LOOP_PREVIEW", {
  file: HERO_FILE,
  cdn: "https://vosko-cdn.b-cdn.net",
  sourceFps: 59.94,
  sourceResolution: "3840x2160",
  playbackRate: 1,
  mobileObjectPosition: "46% 50%",
  overlapLeadSeconds: 0.78,
  crossfadeMilliseconds: 520,
  blankFrameExposure: false,
  adaptiveHlsPendingFinalization: true,
});