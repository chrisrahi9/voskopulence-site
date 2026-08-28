"use client";

import { useEffect } from "react";
import Hls from "hls.js";

const CDN = "https://vosko-cdn.b-cdn.net";

// New premium MP4 ladder. These are deliberately much lighter than the first
// 4K experiment and use normal H.264 High Profile + fast-start MP4.
const FOUR_K_MP4 = `${CDN}/hero_web_4k_v2.mp4`;
const QHD_MP4 = `${CDN}/hero_web_1440_v2.mp4`;

// Keep the proven sharp media as the safety net.
const PREMIUM_HLS = `${CDN}/hero_hls/1080p/playlist.m3u8`;
const MASTER_HLS = `${CDN}/hero_hls/master.m3u8`;
const FALLBACK_MP4 = `${CDN}/hero_web_v3.mp4`;
const POSTER = `${CDN}/hero_poster.jpg`;

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

type PlaybackMode = "fourk" | "qhd" | "premium" | "adaptive" | "mp4";

export default function HeroVideoController() {
  useEffect(() => {
    let disposed = false;
    let hls: Hls | null = null;
    let video: HTMLVideoElement | null = null;
    let legacyVideo: HTMLVideoElement | null = null;
    let mountTimer: number | null = null;
    let startupTimer: number | null = null;
    let stallTimer: number | null = null;
    let legacyGuardTimer: number | null = null;
    let legacyObserver: MutationObserver | null = null;
    let removeListeners: (() => void) | null = null;
    let mode: PlaybackMode = "premium";
    let fatalCount = 0;
    let attemptBaselineTime = 0;
    let hasAdvanced = false;

    const connection = (navigator as any)
      .connection as NetworkInformationLike | undefined;
    const effectiveType = connection?.effectiveType ?? "";
    const explicitlyConstrained =
      Boolean(connection?.saveData) ||
      effectiveType === "slow-2g" ||
      effectiveType === "2g";

    // Do not spend 4K bandwidth on a display that cannot benefit from it.
    // iPhones/Retina displays still qualify because DPR is included.
    const physicalMaxDimension =
      Math.max(window.innerWidth, window.innerHeight) *
      Math.max(1, window.devicePixelRatio || 1);
    const prefers4K = physicalMaxDimension >= 2200;
    const prefersQHD = physicalMaxDimension >= 1400;

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

    const destroyHls = () => {
      try {
        hls?.destroy();
      } catch {}
      hls = null;
      fatalCount = 0;
    };

    const setFlags = (el: HTMLVideoElement) => {
      el.muted = true;
      el.defaultMuted = true;
      el.autoplay = true;
      el.loop = true;
      el.playsInline = true;
      el.preload = "auto";
      el.poster = POSTER;
      el.setAttribute("muted", "");
      el.setAttribute("autoplay", "");
      el.setAttribute("loop", "");
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
    };

    const reveal = () => {
      if (!video || disposed) return;
      video.style.opacity = "1";
    };

    const restoreTimeWhenReady = (resumeAt: number) => {
      if (!video || resumeAt <= 0.15) return;
      const el = video;
      const restore = () => {
        el.removeEventListener("loadedmetadata", restore);
        if (!Number.isFinite(el.duration)) return;
        try {
          el.currentTime = Math.min(resumeAt, Math.max(0, el.duration - 0.1));
        } catch {}
      };
      el.addEventListener("loadedmetadata", restore);
    };

    const fallbackFrom = (failedMode: PlaybackMode, resumeAt = 0) => {
      if (disposed || !video || mode !== failedMode) return;
      if (failedMode === "fourk") startQHD(resumeAt);
      else if (failedMode === "qhd") startPremium1080(resumeAt);
      else if (failedMode === "premium") startAdaptive(resumeAt);
      else if (failedMode === "adaptive") startFallbackMp4(resumeAt);
    };

    const playWithRecovery = (expectedMode: PlaybackMode) => {
      if (!video || disposed || document.visibilityState === "hidden") return;
      setFlags(video);
      let result: Promise<void> | undefined;
      try {
        result = video.play();
      } catch {
        fallbackFrom(expectedMode, video.currentTime || 0);
        return;
      }
      result?.catch(() => {
        if (!disposed && video && mode === expectedMode) {
          fallbackFrom(expectedMode, video.currentTime || 0);
        }
      });
    };

    const armProgressWatchdog = (expectedMode: PlaybackMode, delayMs: number) => {
      clearStartupTimer();
      startupTimer = window.setTimeout(() => {
        startupTimer = null;
        if (disposed || !video || mode !== expectedMode || hasAdvanced) return;
        fallbackFrom(expectedMode, video.currentTime || 0);
      }, delayMs);
    };

    const startDirectSource = (
      src: string,
      nextMode: PlaybackMode,
      resumeAt = 0,
      watchdogMs = 0
    ) => {
      if (!video || disposed) return;
      clearStartupTimer();
      clearStallTimer();
      destroyHls();
      mode = nextMode;
      video.dataset.heroMode = mode;
      hasAdvanced = false;
      attemptBaselineTime = Math.max(0, resumeAt);
      setFlags(video);
      restoreTimeWhenReady(resumeAt);
      video.src = src;
      try {
        video.load();
      } catch {}
      playWithRecovery(nextMode);
      if (watchdogMs > 0 && nextMode !== "mp4") {
        armProgressWatchdog(nextMode, watchdogMs);
      }
    };

    function startFallbackMp4(resumeAt = 0) {
      startDirectSource(FALLBACK_MP4, "mp4", resumeAt, 0);
    }

    const startHlsJs = (
      source: string,
      nextMode: "premium" | "adaptive",
      resumeAt = 0
    ) => {
      if (!video || disposed) return;
      clearStartupTimer();
      clearStallTimer();
      destroyHls();
      mode = nextMode;
      video.dataset.heroMode = mode;
      hasAdvanced = false;
      attemptBaselineTime = Math.max(0, resumeAt);
      const el = video;

      hls = new Hls({
        abrEwmaDefaultEstimate:
          nextMode === "adaptive"
            ? explicitlyConstrained
              ? 2_500_000
              : 5_000_000
            : 20_000_000,
        abrBandWidthFactor: 0.9,
        abrBandWidthUpFactor: 0.8,
        capLevelToPlayerSize: false,
        testBandwidth: false,
        maxBufferLength: nextMode === "adaptive" ? 18 : 30,
        maxMaxBufferLength: nextMode === "adaptive" ? 35 : 60,
        maxStarvationDelay: 3,
        maxLoadingDelay: 3,
        enableWorker: true,
        startLevel: -1,
      });

      hls.attachMedia(el);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        if (!disposed) hls?.loadSource(source);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (disposed) return;
        restoreTimeWhenReady(resumeAt);
        playWithRecovery(nextMode);
        armProgressWatchdog(nextMode, nextMode === "premium" ? 4500 : 5500);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!hls || disposed || !data.fatal) return;
        fatalCount += 1;

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && fatalCount <= 1) {
          try {
            hls.startLoad(-1);
            return;
          } catch {}
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && fatalCount <= 1) {
          try {
            hls.recoverMediaError();
            return;
          } catch {}
        }

        fallbackFrom(nextMode, el.currentTime || resumeAt || 0);
      });
    };

    function startAdaptive(resumeAt = 0) {
      if (!video || disposed) return;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        startDirectSource(MASTER_HLS, "adaptive", resumeAt, 5500);
      } else if (Hls.isSupported()) {
        startHlsJs(MASTER_HLS, "adaptive", resumeAt);
      } else {
        startFallbackMp4(resumeAt);
      }
    }

    function startPremium1080(resumeAt = 0) {
      if (!video || disposed) return;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        startDirectSource(PREMIUM_HLS, "premium", resumeAt, 4500);
      } else if (Hls.isSupported()) {
        startHlsJs(PREMIUM_HLS, "premium", resumeAt);
      } else {
        startFallbackMp4(resumeAt);
      }
    }

    function startQHD(resumeAt = 0) {
      startDirectSource(QHD_MP4, "qhd", resumeAt, 3200);
    }

    function startFourK(resumeAt = 0) {
      startDirectSource(FOUR_K_MP4, "fourk", resumeAt, 3200);
    }

    const stopLegacyVideo = () => {
      if (!legacyVideo) return;
      try {
        legacyVideo.pause();
      } catch {}
      legacyVideo.preload = "none";
      legacyVideo.removeAttribute("autoplay");
      legacyVideo.removeAttribute("src");
      legacyVideo.querySelectorAll("source").forEach((source) => {
        source.removeAttribute("src");
      });
      try {
        legacyVideo.load();
      } catch {}
    };

    const quarantineLegacyVideo = () => {
      if (!legacyVideo) return;
      stopLegacyVideo();
      legacyVideo.style.opacity = "0";
      legacyVideo.style.visibility = "hidden";
      legacyVideo.style.pointerEvents = "none";

      legacyObserver = new MutationObserver(() => {
        if (!disposed) stopLegacyVideo();
      });
      legacyObserver.observe(legacyVideo, {
        attributes: true,
        attributeFilter: ["src", "autoplay", "preload"],
        subtree: true,
      });

      const started = Date.now();
      const guard = () => {
        if (disposed || !legacyVideo) return;
        stopLegacyVideo();
        if (Date.now() - started < 5000) {
          legacyGuardTimer = window.setTimeout(guard, 250);
        }
      };
      guard();
    };

    const mount = () => {
      if (disposed) return;
      legacyVideo = document.querySelector(
        "section video[aria-hidden='true']"
      ) as HTMLVideoElement | null;

      if (!legacyVideo?.parentElement) {
        mountTimer = window.setTimeout(mount, 50);
        return;
      }

      const parent = legacyVideo.parentElement;
      quarantineLegacyVideo();

      video = document.createElement("video");
      video.dataset.adaptiveHero = "true";
      video.dataset.heroMode = "starting";
      video.className =
        "absolute inset-0 w-full h-full object-cover pointer-events-none";
      video.style.opacity = "0";
      video.style.transition = "opacity 450ms ease";
      video.style.willChange = "opacity";
      video.style.backfaceVisibility = "hidden";
      video.style.transform = "translateZ(0)";
      video.setAttribute("aria-hidden", "true");
      video.disablePictureInPicture = true;
      video.disableRemotePlayback = true;
      setFlags(video);
      parent.insertBefore(video, legacyVideo.nextSibling);

      const onTimeUpdate = () => {
        if (!video || disposed) return;
        const delta = Math.abs(video.currentTime - attemptBaselineTime);
        if (!hasAdvanced && (delta >= 0.08 || video.currentTime >= 0.08)) {
          hasAdvanced = true;
          clearStartupTimer();
          reveal();
        }
      };

      const onWaiting = () => {
        if (!video || disposed || !hasAdvanced || mode === "mp4") return;
        clearStallTimer();
        const stalledMode = mode;
        const resumeAt = video.currentTime || 0;
        const delay = stalledMode === "adaptive" ? 4000 : 1700;

        stallTimer = window.setTimeout(() => {
          stallTimer = null;
          if (
            disposed ||
            !video ||
            mode !== stalledMode ||
            video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA
          ) {
            return;
          }
          fallbackFrom(stalledMode, resumeAt);
        }, delay);
      };

      const onError = () => {
        if (!video || disposed || mode === "mp4") return;
        fallbackFrom(mode, video.currentTime || 0);
      };

      const onVisibility = () => {
        if (document.visibilityState === "visible" && video) {
          playWithRecovery(mode);
        }
      };

      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("stalled", onWaiting);
      video.addEventListener("error", onError);
      document.addEventListener("visibilitychange", onVisibility);

      removeListeners = () => {
        if (!video) return;
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("stalled", onWaiting);
        video.removeEventListener("error", onError);
        document.removeEventListener("visibilitychange", onVisibility);
      };

      if (explicitlyConstrained) startAdaptive();
      else if (prefers4K) startFourK();
      else if (prefersQHD) startQHD();
      else startPremium1080();
    };

    mount();

    return () => {
      disposed = true;
      if (mountTimer !== null) window.clearTimeout(mountTimer);
      if (legacyGuardTimer !== null) window.clearTimeout(legacyGuardTimer);
      clearStartupTimer();
      clearStallTimer();
      removeListeners?.();
      legacyObserver?.disconnect();
      destroyHls();
      video?.remove();
      if (legacyVideo) legacyVideo.style.visibility = "";
    };
  }, []);

  return null;
}
