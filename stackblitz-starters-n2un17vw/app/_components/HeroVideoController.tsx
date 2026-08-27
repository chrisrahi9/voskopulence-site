"use client";

import { useEffect } from "react";
import Hls from "hls.js";

const CDN = "https://cdn.voskopulence.com";
const PREMIUM_HLS = `${CDN}/hero_hls/1080p/playlist.m3u8`;
const MASTER_HLS = `${CDN}/hero_hls/master.m3u8`;
const PREMIUM_MP4 = `${CDN}/hero_web_v3.mp4`;
const POSTER = `${CDN}/hero_poster.jpg`;

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

type PlaybackMode = "premium" | "adaptive" | "mp4";

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
    let currentMode: PlaybackMode = "premium";
    let hasPlayed = false;
    let hlsFatalCount = 0;

    const connection = (navigator as any)
      .connection as NetworkInformationLike | undefined;
    const effectiveType = connection?.effectiveType ?? "";
    const explicitlyConstrained =
      Boolean(connection?.saveData) ||
      effectiveType === "slow-2g" ||
      effectiveType === "2g";

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
      video.preload = "auto";
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

    const destroyHls = () => {
      try {
        hls?.destroy();
      } catch {}
      hls = null;
      hlsFatalCount = 0;
    };

    const usePremiumMp4 = (resumeAt = 0) => {
      if (!adaptiveVideo || disposed) return;
      currentMode = "mp4";
      clearStartupTimer();
      clearStallTimer();
      destroyHls();

      const video = adaptiveVideo;
      setFlags(video);
      video.src = PREMIUM_MP4;

      const restore = () => {
        video.removeEventListener("loadedmetadata", restore);
        if (resumeAt > 0.15 && Number.isFinite(video.duration)) {
          try {
            video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 0.1));
          } catch {}
        }
        play();
      };
      video.addEventListener("loadedmetadata", restore);

      try {
        video.load();
      } catch {}
      play();
    };

    const configureHlsJs = (source: string, mode: PlaybackMode, resumeAt = 0) => {
      if (!adaptiveVideo || disposed) return;
      destroyHls();
      currentMode = mode;

      const video = adaptiveVideo;
      const adaptive = mode === "adaptive";

      hls = new Hls({
        // Premium mode is a single 1080p playlist, so ABR cannot silently pick
        // a lower rendition. Adaptive mode uses the master only after real
        // startup/buffering trouble (or when Save-Data/2G is explicitly set).
        abrEwmaDefaultEstimate: adaptive ? 8_000_000 : 20_000_000,
        abrBandWidthFactor: 0.9,
        abrBandWidthUpFactor: 0.8,
        capLevelToPlayerSize: false,
        testBandwidth: false,
        maxBufferLength: adaptive ? 18 : 30,
        maxMaxBufferLength: adaptive ? 35 : 60,
        maxStarvationDelay: 3,
        maxLoadingDelay: 3,
        enableWorker: true,
        startLevel: adaptive ? -1 : 0,
      });

      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        if (!disposed) hls?.loadSource(source);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!hls || disposed) return;

        if (adaptive && !explicitlyConstrained && hls.levels.length > 0) {
          // Even after falling back to ABR, recover upward aggressively instead
          // of getting stuck on the conservative bottom rendition.
          hls.nextAutoLevel = hls.levels.length - 1;
        }

        if (resumeAt > 0.15) {
          try {
            video.currentTime = resumeAt;
          } catch {}
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

        if (currentMode === "premium") {
          startAdaptive(resumeAt || video.currentTime || 0);
        } else {
          usePremiumMp4(video.currentTime || 0);
        }
      });
    };

    const startAdaptive = (resumeAt = 0) => {
      if (!adaptiveVideo || disposed || currentMode === "adaptive") return;
      clearStartupTimer();
      clearStallTimer();
      hasPlayed = false;

      const video = adaptiveVideo;
      const nativeHls = Boolean(video.canPlayType("application/vnd.apple.mpegurl"));
      currentMode = "adaptive";

      if (nativeHls) {
        destroyHls();
        setFlags(video);
        video.src = MASTER_HLS;

        const restore = () => {
          video.removeEventListener("loadedmetadata", restore);
          if (resumeAt > 0.15 && Number.isFinite(video.duration)) {
            try {
              video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 0.1));
            } catch {}
          }
          play();
        };
        video.addEventListener("loadedmetadata", restore);

        try {
          video.load();
        } catch {}
        play();
        return;
      }

      if (Hls.isSupported()) {
        configureHlsJs(MASTER_HLS, "adaptive", resumeAt);
        return;
      }

      usePremiumMp4(resumeAt);
    };

    const startPremium = () => {
      if (!adaptiveVideo || disposed) return;
      clearStartupTimer();
      clearStallTimer();
      hasPlayed = false;

      const video = adaptiveVideo;
      const nativeHls = Boolean(video.canPlayType("application/vnd.apple.mpegurl"));
      currentMode = "premium";

      if (nativeHls) {
        destroyHls();
        setFlags(video);
        video.src = PREMIUM_HLS;
        try {
          video.load();
        } catch {}
        play();
      } else if (Hls.isSupported()) {
        configureHlsJs(PREMIUM_HLS, "premium");
      } else {
        usePremiumMp4();
        return;
      }

      // Do not downgrade because of a browser/network guess. Only if premium
      // 1080p fails to produce playable data within this real startup window.
      startupTimer = window.setTimeout(() => {
        startupTimer = null;
        if (
          disposed ||
          !adaptiveVideo ||
          currentMode !== "premium" ||
          hasPlayed
        ) {
          return;
        }
        startAdaptive(adaptiveVideo.currentTime || 0);
      }, 5000);
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
      video.dataset.heroMode = "starting";
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

      const syncModeMarker = () => {
        if (adaptiveVideo) adaptiveVideo.dataset.heroMode = currentMode;
      };

      const onReady = () => reveal();
      const onPlaying = () => {
        hasPlayed = true;
        clearStartupTimer();
        clearStallTimer();
        syncModeMarker();
        reveal();
      };
      const onWaiting = () => {
        if (disposed || !hasPlayed || currentMode !== "premium") return;
        clearStallTimer();
        const resumeAt = video.currentTime || 0;

        stallTimer = window.setTimeout(() => {
          stallTimer = null;
          if (
            !disposed &&
            currentMode === "premium" &&
            video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
          ) {
            startAdaptive(resumeAt);
          }
        }, 1400);
      };
      const onVideoError = () => {
        if (disposed) return;
        if (currentMode === "premium") {
          startAdaptive(video.currentTime || 0);
        } else if (currentMode === "adaptive") {
          usePremiumMp4(video.currentTime || 0);
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

      if (explicitlyConstrained) {
        startAdaptive();
      } else {
        startPremium();
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
      destroyHls();
      adaptiveVideo?.remove();
      if (originalVideo) originalVideo.style.visibility = "";
    };
  }, []);

  return null;
}
