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
      // "auto" made Safari keep a full MP4 request alive while HLS was starting.
      // Metadata is enough; play() will fetch what playback actually needs.
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

      // The old React effect can try to restore its source after we mount.
      // Watch that detached/hidden element and immediately cancel any such request.
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
        // Native HLS occasionally gets stuck during startup on iOS. A direct
        // premium H.264 MP4 is the safest last-resort recovery path.
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

      // The original SSR video has a direct MP4 src and preload=auto. Hide it,
      // stop its request, and put the adaptive element in front of it.
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

      if (nativeHls) {
        // iPhone/iPad/macOS Safari: let Apple's HLS engine adapt continuously.
        // Do not force 1080-only: that is exactly what can stall a weaker link.
        video.src = MASTER_HLS;
        try {
          video.load();
        } catch {}
        play();
        armStartupFallback(6500);
      } else if (Hls.isSupported()) {
        const connection = (navigator as any)
          .connection as NetworkInformationLike | undefined;
        const effectiveType = connection?.effectiveType ?? "";
        const clearlyConstrained =
          Boolean(connection?.saveData) ||
          effectiveType === "slow-2g" ||
          effectiveType === "2g";

        hls = new Hls({
          // Bias startup high on normal links, but leave ABR fully enabled so it
          // can step down quickly if real throughput proves lower.
          abrEwmaDefaultEstimate: clearlyConstrained ? 2_500_000 : 20_000_000,
          abrBandWidthFactor: 0.92,
          abrBandWidthUpFactor: 0.82,
          capLevelToPlayerSize: false,
          testBandwidth: false,
          maxBufferLength: clearlyConstrained ? 10 : 24,
          maxMaxBufferLength: clearlyConstrained ? 20 : 45,
          maxStarvationDelay: 3,
          maxLoadingDelay: 3,
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
            hls.nextAutoLevel = hls.levels.length - 1;
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

          usePremiumMp4();
        });
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
