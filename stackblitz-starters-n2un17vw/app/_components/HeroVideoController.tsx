"use client";

import { useEffect } from "react";
import Hls from "hls.js";

// Bunny's native hostname has valid TLS; keep using it until the custom CDN
// hostname certificate is renewed. The v2 ladder is encoded from the cleaner
// high-bitrate source while preserving the existing 2.83-second hero cut.
const CDN = "https://vosko-cdn.b-cdn.net";
const PREMIUM_HLS = `${CDN}/hero_hls_v2/1080p/playlist.m3u8`;
const MASTER_HLS = `${CDN}/hero_hls_v2/master.m3u8`;
const PREMIUM_MP4 = `${CDN}/hero_web_v4.mp4`;
const POSTER = `${CDN}/hero_poster_v2.jpg`;

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

type PlaybackMode = "premium" | "adaptive" | "mp4";

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
    let mode: PlaybackMode = "premium";
    let hasPlayed = false;
    let fatalCount = 0;

    const connection = (navigator as any)
      .connection as NetworkInformationLike | undefined;
    const effectiveType = connection?.effectiveType ?? "";
    const explicitlyConstrained =
      Boolean(connection?.saveData) ||
      effectiveType === "slow-2g" ||
      effectiveType === "2g";

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

    const play = () => {
      if (!video || disposed || document.visibilityState === "hidden") return;
      setFlags(video);
      const result = video.play();
      result?.catch(() => {});
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

    const startMp4 = (resumeAt = 0) => {
      if (!video || disposed) return;
      mode = "mp4";
      video.dataset.heroMode = mode;
      clearStartupTimer();
      clearStallTimer();
      destroyHls();
      setFlags(video);
      restoreTimeWhenReady(resumeAt);
      video.src = PREMIUM_MP4;
      try {
        video.load();
      } catch {}
      play();
    };

    const startHlsJs = (
      source: string,
      nextMode: "premium" | "adaptive",
      resumeAt = 0
    ) => {
      if (!video || disposed) return;
      destroyHls();
      mode = nextMode;
      video.dataset.heroMode = mode;
      const el = video;

      hls = new Hls({
        // Premium mode contains only 1080p, so there is no low rendition to
        // choose accidentally. Adaptive mode is entered only after actual
        // startup/buffering trouble or an explicit Save-Data/2G signal.
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
        play();
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, reveal);
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

        const resume = el.currentTime || resumeAt || 0;
        if (mode === "premium") startAdaptive(resume);
        else startMp4(resume);
      });
    };

    const startAdaptive = (resumeAt = 0) => {
      if (!video || disposed || mode === "adaptive") return;
      clearStartupTimer();
      clearStallTimer();
      hasPlayed = false;
      mode = "adaptive";
      video.dataset.heroMode = mode;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        destroyHls();
        setFlags(video);
        restoreTimeWhenReady(resumeAt);
        video.src = MASTER_HLS;
        try {
          video.load();
        } catch {}
        play();
      } else if (Hls.isSupported()) {
        startHlsJs(MASTER_HLS, "adaptive", resumeAt);
      } else {
        startMp4(resumeAt);
      }
    };

    const startPremium = () => {
      if (!video || disposed) return;
      clearStartupTimer();
      clearStallTimer();
      hasPlayed = false;
      mode = "premium";
      video.dataset.heroMode = mode;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        destroyHls();
        setFlags(video);
        video.src = PREMIUM_HLS;
        try {
          video.load();
        } catch {}
        play();
      } else if (Hls.isSupported()) {
        startHlsJs(PREMIUM_HLS, "premium");
      } else {
        startMp4();
        return;
      }

      // Premium-first: do not downgrade because of a guessed connection speed.
      // Only open the adaptive ladder if 1080p has not actually started.
      startupTimer = window.setTimeout(() => {
        startupTimer = null;
        if (
          disposed ||
          !video ||
          mode !== "premium" ||
          hasPlayed
        ) {
          return;
        }
        startAdaptive(video.currentTime || 0);
      }, 5000);
    };

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

      // The old page effect can try to restore its source. Cancel that race.
      legacyObserver = new MutationObserver(() => {
        if (!disposed && legacyVideo?.getAttribute("src")) stopLegacyVideo();
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
      video.style.transition = "opacity 650ms ease";
      video.style.willChange = "opacity";
      video.style.backfaceVisibility = "hidden";
      video.style.transform = "translateZ(0)";
      video.setAttribute("aria-hidden", "true");
      video.disablePictureInPicture = true;
      video.disableRemotePlayback = true;
      setFlags(video);
      parent.insertBefore(video, legacyVideo.nextSibling);

      const onPlaying = () => {
        hasPlayed = true;
        clearStartupTimer();
        clearStallTimer();
        reveal();
      };

      const onWaiting = () => {
        if (!video || disposed || !hasPlayed || mode !== "premium") return;
        clearStallTimer();
        const resumeAt = video.currentTime || 0;
        stallTimer = window.setTimeout(() => {
          stallTimer = null;
          if (
            !disposed &&
            video &&
            mode === "premium" &&
            video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
          ) {
            startAdaptive(resumeAt);
          }
        }, 1400);
      };

      const onError = () => {
        if (!video || disposed) return;
        const resumeAt = video.currentTime || 0;
        if (mode === "premium") startAdaptive(resumeAt);
        else if (mode === "adaptive") startMp4(resumeAt);
      };

      const onVisibility = () => {
        if (document.visibilityState === "visible") play();
      };

      video.addEventListener("loadeddata", reveal);
      video.addEventListener("canplay", reveal);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("stalled", onWaiting);
      video.addEventListener("error", onError);
      document.addEventListener("visibilitychange", onVisibility);

      if (explicitlyConstrained) startAdaptive();
      else startPremium();

      return () => {
        if (!video) return;
        video.removeEventListener("loadeddata", reveal);
        video.removeEventListener("canplay", reveal);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("stalled", onWaiting);
        video.removeEventListener("error", onError);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    };

    const cleanupListeners = mount();

    return () => {
      disposed = true;
      if (mountTimer !== null) window.clearTimeout(mountTimer);
      if (legacyGuardTimer !== null) window.clearTimeout(legacyGuardTimer);
      clearStartupTimer();
      clearStallTimer();
      cleanupListeners?.();
      legacyObserver?.disconnect();
      destroyHls();
      video?.remove();
      if (legacyVideo) legacyVideo.style.visibility = "";
    };
  }, []);

  return null;
}
