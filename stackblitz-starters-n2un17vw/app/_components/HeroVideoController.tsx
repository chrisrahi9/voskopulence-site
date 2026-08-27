"use client";

import { useEffect } from "react";
import Hls from "hls.js";

const CDN = "https://cdn.voskopulence.com";
const MASTER_HLS = `${CDN}/hero_hls/master.m3u8`;
const PREMIUM_MP4 = `${CDN}/hero_web_v3.mp4`;
const POSTER = `${CDN}/hero_poster.jpg`;

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

export default function HeroVideoController() {
  useEffect(() => {
    let disposed = false;
    let hls: Hls | null = null;
    let adaptiveVideo: HTMLVideoElement | null = null;
    let originalVideo: HTMLVideoElement | null = null;
    let retryTimer: number | null = null;
    let startupTimer: number | null = null;
    let legacyGuardTimer: number | null = null;
    let legacyGuardObserver: MutationObserver | null = null;
    let hlsFatalCount = 0;

    const reveal = () => {
      if (!adaptiveVideo || disposed) return;
      adaptiveVideo.style.opacity = "1";
    };

    const setFlags = (video: HTMLVideoElement) => {
      video.muted = true;
      video.defaultMuted = true;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.poster = POSTER;
      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("loop", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    };

    const stopLegacyDownload = () => {
      const legacy = originalVideo;
      if (!legacy) return;
      try {
        legacy.pause();
      } catch {}
      legacy.preload = "none";
      legacy.removeAttribute("autoplay");
      legacy.removeAttribute("src");
      legacy.querySelectorAll("source").forEach((source) => {
        source.removeAttribute("src");
      });
      try {
        legacy.load();
      } catch {}
    };

    const quarantineLegacyPlayer = () => {
      if (!originalVideo) return;
      stopLegacyDownload();

      legacyGuardObserver = new MutationObserver(() => {
        if (disposed || !originalVideo) return;
        if (originalVideo.getAttribute("src")) {
          stopLegacyDownload();
        }
      });
      legacyGuardObserver.observe(originalVideo, {
        attributes: true,
        attributeFilter: ["src", "autoplay", "preload"],
        subtree: true,
      });

      const started = Date.now();
      const guard = () => {
        if (disposed || !originalVideo) return;
        stopLegacyDownload();
        if (Date.now() - started < 5000) {
          legacyGuardTimer = window.setTimeout(guard, 250);
        }
      };
      guard();
    };

    const play = () => {
      if (!adaptiveVideo || disposed || document.visibilityState === "hidden") return;
      setFlags(adaptiveVideo);
      const promise = adaptiveVideo.play();
      promise?.catch(() => {});
    };

    const clearStartupTimer = () => {
      if (startupTimer !== null) {
        window.clearTimeout(startupTimer);
        startupTimer = null;
      }
    };

    const usePremiumMp4 = () => {
      if (!adaptiveVideo || disposed) return;
      clearStartupTimer();
      try {
        hls?.destroy();
      } catch {}
      hls = null;
      setFlags(adaptiveVideo);
      adaptiveVideo.src = PREMIUM_MP4;
      try {
        adaptiveVideo.load();
      } catch {}
      play();
    };

    const armStartupFallback = (timeoutMs: number) => {
      clearStartupTimer();
      startupTimer = window.setTimeout(() => {
        startupTimer = null;
        if (
          disposed ||
          !adaptiveVideo ||
          adaptiveVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
          return;
        }
        usePremiumMp4();
      }, timeoutMs);
    };

    const mount = () => {
      if (disposed) return;

      originalVideo = document.querySelector(
        "section video[aria-hidden='true']"
      ) as HTMLVideoElement | null;

      if (!originalVideo || !originalVideo.parentElement) {
        retryTimer = window.setTimeout(mount, 50);
        return;
      }

      const parent = originalVideo.parentElement;
      quarantineLegacyPlayer();

      originalVideo.style.opacity = "0";
      originalVideo.style.visibility = "hidden";
      originalVideo.style.pointerEvents = "none";

      const video = document.createElement("video");
      adaptiveVideo = video;
      video.dataset.adaptiveHero = "true";
      video.className =
        "absolute inset-0 w-full h-full object-cover pointer-events-none";
      video.style.opacity = "0";
      video.style.transition = "opacity 650ms ease";
      video.style.willChange = "opacity";
      video.style.backfaceVisibility = "hidden";
      video.style.transform = "translateZ(0)";
      video.setAttribute("aria-hidden", "true");
      video.disablePictureInPicture = true;
      video.disableRemotePlayback = true;
      setFlags(video);
      parent.insertBefore(video, originalVideo.nextSibling);

      const onReady = () => {
        clearStartupTimer();
        reveal();
      };
      const onPlaying = () => {
        clearStartupTimer();
        reveal();
      };
      const onVideoError = () => {
        if (!disposed && adaptiveVideo?.src !== PREMIUM_MP4) {
          usePremiumMp4();
        }
      };
      const onVisibility = () => {
        if (document.visibilityState === "visible") play();
      };

      video.addEventListener("loadeddata", onReady);
      video.addEventListener("canplay", onReady);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("error", onVideoError);
      document.addEventListener("visibilitychange", onVisibility);

      const nativeHls = video.canPlayType("application/vnd.apple.mpegurl");
      const connection = (navigator as any)
        .connection as NetworkInformationLike | undefined;
      const effectiveType = connection?.effectiveType ?? "";
      const clearlyConstrained =
        Boolean(connection?.saveData) ||
        effectiveType === "slow-2g" ||
        effectiveType === "2g";

      // Prefer hls.js whenever the browser exposes MSE/MMS support. This now
      // includes modern iPhones (iOS 17.1+). Native iOS HLS tends to start at a
      // deliberately conservative rendition and does not expose a quality API,
      // which was the cause of the visibly soft first seconds on iPhone.
      if (Hls.isSupported()) {
        hls = new Hls({
          // Start with a premium assumption on normal connections. ABR remains
          // enabled and immediately learns from real fragment throughput, so a
          // genuinely weak connection can still step down before it starves.
          abrEwmaDefaultEstimate: clearlyConstrained ? 2_500_000 : 80_000_000,
          abrBandWidthFactor: clearlyConstrained ? 0.82 : 0.95,
          abrBandWidthUpFactor: clearlyConstrained ? 0.72 : 0.88,
          capLevelToPlayerSize: false,
          testBandwidth: false,
          maxBufferLength: clearlyConstrained ? 10 : 24,
          maxMaxBufferLength: clearlyConstrained ? 20 : 45,
          maxStarvationDelay: clearlyConstrained ? 4 : 3,
          maxLoadingDelay: clearlyConstrained ? 4 : 3,
          enableWorker: true,
          startLevel: -1,
        });

        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          if (!disposed) hls?.loadSource(MASTER_HLS);
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!hls || disposed) return;

          if (!clearlyConstrained && hls.levels.length > 0) {
            // First fragment: explicitly request the highest variant, but keep
            // auto-level mode enabled for every fragment after it.
            const highestLevel = hls.levels.reduce((bestIndex, level, index) => {
              const best = hls!.levels[bestIndex];
              const levelScore = (level.height || 0) * 1_000_000 + (level.bitrate || 0);
              const bestScore = (best?.height || 0) * 1_000_000 + (best?.bitrate || 0);
              return levelScore > bestScore ? index : bestIndex;
            }, 0);

            hls.startLevel = highestLevel;
            hls.nextAutoLevel = highestLevel;
          }

          play();
          armStartupFallback(6500);
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, () => reveal());
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!hls || disposed || !data.fatal) return;
          hlsFatalCount += 1;

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && hlsFatalCount <= 1) {
            try {
              hls.startLoad(-1);
              return;
            } catch {}
          }

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && hlsFatalCount <= 1) {
            try {
              hls.recoverMediaError();
              return;
            } catch {}
          }

          // If MMS/MSE playback is unavailable or unstable on a particular
          // Safari build, fail over to the full-quality MP4 rather than showing
          // a blank/gray hero.
          usePremiumMp4();
        });
      } else if (nativeHls) {
        // Older Apple devices that cannot run hls.js keep native HLS support.
        video.src = MASTER_HLS;
        try {
          video.load();
        } catch {}
        play();
        armStartupFallback(6500);
      } else {
        usePremiumMp4();
      }

      return () => {
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("error", onVideoError);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    };

    const cleanupListeners = mount();

    return () => {
      disposed = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (legacyGuardTimer !== null) window.clearTimeout(legacyGuardTimer);
      clearStartupTimer();
      cleanupListeners?.();
      legacyGuardObserver?.disconnect();
      try {
        hls?.destroy();
      } catch {}
      adaptiveVideo?.remove();
      if (originalVideo) {
        originalVideo.style.visibility = "";
      }
    };
  }, []);

  return null;
}
