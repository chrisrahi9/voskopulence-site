"use client";

import { useEffect } from "react";
import Hls from "hls.js";

const CDN = "https://vosko-cdn.b-cdn.net";
const PRIMARY_MP4 = `${CDN}/hero_web_v3.mp4?v=20260828-fast-1080`;
const PREMIUM_HLS = `${CDN}/hero_hls/1080p/playlist.m3u8`;
const MASTER_HLS = `${CDN}/hero_hls/master.m3u8`;
const POSTER = `${CDN}/hero_poster.jpg?v=20260828-fast-1080`;

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

type PlaybackMode = "mp4" | "premium" | "adaptive";

export default function HeroVideoController() {
  useEffect(() => {
    let disposed = false;
    let video: HTMLVideoElement | null = null;
    let hls: Hls | null = null;
    let mountTimer: number | null = null;
    let stallTimer: number | null = null;
    let sourceToken = 0;
    let mode: PlaybackMode = "mp4";
    let hasAdvanced = false;
    let mp4RecoveryUsed = false;

    const connection = (navigator as any)
      .connection as NetworkInformationLike | undefined;
    const effectiveType = connection?.effectiveType ?? "";
    const explicitlyConstrained =
      Boolean(connection?.saveData) ||
      effectiveType === "slow-2g" ||
      effectiveType === "2g";

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
      el.style.opacity = "1";
      el.style.visibility = "visible";
    };

    const play = (expectedMode: PlaybackMode, token: number) => {
      if (!video || disposed || document.visibilityState === "hidden") return;
      setFlags(video);
      let result: Promise<void> | undefined;
      try {
        result = video.play();
      } catch {
        if (token === sourceToken) fallbackFrom(expectedMode, video.currentTime || 0);
        return;
      }
      result?.catch(() => {
        if (!disposed && video && token === sourceToken && mode === expectedMode) {
          fallbackFrom(expectedMode, video.currentTime || 0);
        }
      });
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

    const startDirect = (
      src: string,
      nextMode: "mp4" | "premium" | "adaptive",
      resumeAt = 0,
      forceReload = true
    ) => {
      if (!video || disposed) return;
      clearStallTimer();
      destroyHls();
      const token = ++sourceToken;
      mode = nextMode;
      hasAdvanced = false;
      video.dataset.heroMode = mode;
      setFlags(video);
      restoreTimeWhenReady(resumeAt);

      const normalizedCurrent = video.currentSrc || video.src || "";
      const samePrimary =
        nextMode === "mp4" &&
        normalizedCurrent.includes("vosko-cdn.b-cdn.net/hero_web_v3.mp4");

      if (!samePrimary || forceReload) {
        video.src = src;
        try {
          video.load();
        } catch {}
      }
      play(nextMode, token);
    };

    const startHlsJs = (
      source: string,
      nextMode: "premium" | "adaptive",
      resumeAt = 0
    ) => {
      if (!video || disposed) return;
      clearStallTimer();
      destroyHls();
      const token = ++sourceToken;
      mode = nextMode;
      hasAdvanced = false;
      video.dataset.heroMode = mode;
      const el = video;
      setFlags(el);

      hls = new Hls({
        abrEwmaDefaultEstimate: nextMode === "adaptive" ? 5_000_000 : 20_000_000,
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
        if (!disposed && token === sourceToken) hls?.loadSource(source);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (disposed || token !== sourceToken) return;
        restoreTimeWhenReady(resumeAt);
        play(nextMode, token);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (disposed || token !== sourceToken || !data.fatal) return;
        fallbackFrom(nextMode, el.currentTime || resumeAt || 0);
      });
    };

    function startPremiumHls(resumeAt = 0) {
      if (!video || disposed) return;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        startDirect(PREMIUM_HLS, "premium", resumeAt, true);
      } else if (Hls.isSupported()) {
        startHlsJs(PREMIUM_HLS, "premium", resumeAt);
      } else if (!mp4RecoveryUsed) {
        mp4RecoveryUsed = true;
        startDirect(PRIMARY_MP4, "mp4", resumeAt, true);
      }
    }

    function startAdaptive(resumeAt = 0) {
      if (!video || disposed) return;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        startDirect(MASTER_HLS, "adaptive", resumeAt, true);
      } else if (Hls.isSupported()) {
        startHlsJs(MASTER_HLS, "adaptive", resumeAt);
      } else if (!mp4RecoveryUsed) {
        mp4RecoveryUsed = true;
        startDirect(PRIMARY_MP4, "mp4", resumeAt, true);
      }
    }

    function fallbackFrom(failedMode: PlaybackMode, resumeAt = 0) {
      if (!video || disposed || mode !== failedMode) return;
      if (failedMode === "mp4") startPremiumHls(resumeAt);
      else if (failedMode === "premium") startAdaptive(resumeAt);
      else if (!mp4RecoveryUsed) {
        mp4RecoveryUsed = true;
        startDirect(PRIMARY_MP4, "mp4", resumeAt, true);
      }
    }

    const mount = () => {
      if (disposed) return;
      video = document.querySelector(
        "section video[aria-hidden='true']"
      ) as HTMLVideoElement | null;

      if (!video) {
        mountTimer = window.setTimeout(mount, 30);
        return;
      }

      setFlags(video);
      video.dataset.adaptiveHero = "true";
      mode = "mp4";
      video.dataset.heroMode = mode;

      const onPlaying = () => {
        hasAdvanced = true;
        clearStallTimer();
        if (video) video.style.opacity = "1";
      };

      const onTimeUpdate = () => {
        if (!video || disposed) return;
        if (video.currentTime >= 0.06) {
          hasAdvanced = true;
          clearStallTimer();
          video.style.opacity = "1";
        }
      };

      const onWaiting = () => {
        if (!video || disposed || !hasAdvanced) return;
        clearStallTimer();
        const stalledMode = mode;
        const resumeAt = video.currentTime || 0;
        stallTimer = window.setTimeout(() => {
          stallTimer = null;
          if (
            !disposed &&
            video &&
            mode === stalledMode &&
            video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
          ) {
            fallbackFrom(stalledMode, resumeAt);
          }
        }, stalledMode === "adaptive" ? 3500 : 1800);
      };

      const onError = () => {
        if (!video || disposed) return;
        fallbackFrom(mode, video.currentTime || 0);
      };

      const onVisibility = () => {
        if (document.visibilityState === "visible" && video) {
          play(mode, sourceToken);
        }
      };

      video.addEventListener("playing", onPlaying);
      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("stalled", onWaiting);
      video.addEventListener("error", onError);
      document.addEventListener("visibilitychange", onVisibility);

      if (explicitlyConstrained) {
        startAdaptive(video.currentTime || 0);
      } else {
        // Preserve the server-rendered MP4 request. Do not call load() again;
        // this is what lets Safari start fetching before React hydrates.
        const token = ++sourceToken;
        mode = "mp4";
        video.dataset.heroMode = mode;
        play(mode, token);
      }

      return () => {
        if (!video) return;
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("stalled", onWaiting);
        video.removeEventListener("error", onError);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    };

    const cleanup = mount();

    return () => {
      disposed = true;
      if (mountTimer !== null) window.clearTimeout(mountTimer);
      clearStallTimer();
      cleanup?.();
      destroyHls();
    };
  }, []);

  return null;
}
