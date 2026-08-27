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
    let stallTimer: number | null = null;
    let legacyGuardTimer: number | null = null;
    let legacyGuardObserver: MutationObserver | null = null;
    let hlsFatalCount = 0;
    let iosAdaptiveFallbackActive = false;

    const ua = navigator.userAgent || "";
    const isiOS =
      /iP(hone|od|ad)/.test(ua) ||
      (/\bMac\b/.test(ua) && "ontouchend" in window);

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
      // On iPhone we deliberately begin with the premium MP4, so allow Safari
      // to buffer it aggressively. Other browsers can stay lighter at startup.
      video.preload = isiOS ? "auto" : "metadata";
      video.poster = POSTER;
      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("loop", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    };

    const clearStartupTimer = () => {
      if (startupTimer !== null) {
        window.clearTimeout(startupTimer);
        startupTimer = null;
      }
    };

    const clearStallTimer = () => {
      if (stallTimer !== null) {
        window.clearTimeout(stallTimer);
        stallTimer = null;
      }
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
        if (originalVideo.getAttribute("src")) stopLegacyDownload();
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

    const usePremiumMp4 = () => {
      if (!adaptiveVideo || disposed) return;
      clearStartupTimer();
      clearStallTimer();
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

    const useNativeAdaptiveHls = (resumeAt = 0) => {
      if (!adaptiveVideo || disposed || iosAdaptiveFallbackActive) return;
      iosAdaptiveFallbackActive = true;
      clearStartupTimer();
      clearStallTimer();

      try {
        hls?.destroy();
      } catch {}
      hls = null;

      const video = adaptiveVideo;
      setFlags(video);
      video.src = MASTER_HLS;

      const restoreTime = () => {
        video.removeEventListener("loadedmetadata", restoreTime);
        if (resumeAt > 0.2 && Number.isFinite(video.duration)) {
          try {
            video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 0.2));
          } catch {}
        }
        play();
      };
      video.addEventListener("loadedmetadata", restoreTime);

      try {
        video.load();
      } catch {}
      play();
    };

    const armIosStartupFallback = () => {
      clearStartupTimer();
      startupTimer = window.setTimeout(() => {
        startupTimer = null;
        if (disposed || !adaptiveVideo || iosAdaptiveFallbackActive) return;

        // If the premium MP4 has not produced playable data promptly, the real
        // connection is not sustaining premium startup. Hand control to Apple's
        // native adaptive HLS instead of leaving the visitor on the poster.
        if (
          adaptiveVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
          adaptiveVideo.paused
        ) {
          useNativeAdaptiveHls(adaptiveVideo.currentTime || 0);
        }
      }, 4500);
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
        clearStallTimer();
        reveal();
      };
      const onWaiting = () => {
        if (!isiOS || iosAdaptiveFallbackActive || disposed) return;
        clearStallTimer();
        const resumeAt = video.currentTime || 0;
        stallTimer = window.setTimeout(() => {
          stallTimer = null;
          if (
            !disposed &&
            !iosAdaptiveFallbackActive &&
            video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
          ) {
            // A sustained stall is stronger evidence than a guessed connection
            // type. Only now allow iPhone to step down through native HLS.
            useNativeAdaptiveHls(resumeAt);
          }
        }, 1200);
      };
      const onVideoError = () => {
        if (disposed) return;
        if (isiOS && !iosAdaptiveFallbackActive) {
          useNativeAdaptiveHls(video.currentTime || 0);
        } else if (video.src !== PREMIUM_MP4) {
          usePremiumMp4();
        }
      };
      const onVisibility = () => {
        if (document.visibilityState === "visible") play();
      };

      video.addEventListener("loadeddata", onReady);
      video.addEventListener("canplay", onReady);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("stalled", onWaiting);
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

      if (isiOS) {
        // iPhone quality policy: premium first. The direct H.264 MP4 cannot be
        // silently downgraded by Safari, so the first visible frames stay sharp.
        // Only measured startup trouble or a sustained stall activates HLS ABR.
        usePremiumMp4();
        armIosStartupFallback();
      } else if (Hls.isSupported()) {
        hls = new Hls({
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
      } else if (nativeHls) {
        video.src = MASTER_HLS;
        try {
          video.load();
        } catch {}
        play();
      } else {
        usePremiumMp4();
      }

      return () => {
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("stalled", onWaiting);
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
      clearStallTimer();
      cleanupListeners?.();
      legacyGuardObserver?.disconnect();
      try {
        hls?.destroy();
      } catch {}
      adaptiveVideo?.remove();
      if (originalVideo) originalVideo.style.visibility = "";
    };
  }, []);

  return null;
}
