"use client";

import { useEffect } from "react";
import Hls from "hls.js";

const CDN = "https://vosko-cdn.b-cdn.net";

// Apple/UHD path. HEVC + hvc1 is the preferred UHD path for Safari/WebKit.
const HEVC_4K = `${CDN}/hero_web_4k_hevc.mp4`;
const HEVC_QHD = `${CDN}/hero_web_1440_hevc.mp4`;

// Optional H.264 UHD path for non-Apple browsers that explicitly report
// smooth support through MediaCapabilities.
const AVC_4K = `${CDN}/hero_web_4k_v2.mp4`;
const AVC_QHD = `${CDN}/hero_web_1440_v2.mp4`;

// Proven safety net. These are the assets that already work reliably on iPhone.
const PREMIUM_HLS = `${CDN}/hero_hls/1080p/playlist.m3u8`;
const MASTER_HLS = `${CDN}/hero_hls/master.m3u8`;
const FALLBACK_MP4 = `${CDN}/hero_web_v3.mp4`;
const POSTER = `${CDN}/hero_poster.jpg`;

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

type PlaybackMode =
  | "hevc4k"
  | "hevcqhd"
  | "avc4k"
  | "avcqhd"
  | "premium"
  | "adaptive"
  | "mp4";

type CapabilityResult = {
  supported?: boolean;
  smooth?: boolean;
  powerEfficient?: boolean;
};

type MediaCapabilitiesLike = {
  decodingInfo?: (config: unknown) => Promise<CapabilityResult>;
};

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
    let sourceToken = 0;
    let attemptBaselineTime = 0;
    let hasAdvanced = false;

    const connection = (navigator as any)
      .connection as NetworkInformationLike | undefined;
    const effectiveType = connection?.effectiveType ?? "";
    const explicitlyConstrained =
      Boolean(connection?.saveData) ||
      effectiveType === "slow-2g" ||
      effectiveType === "2g";

    const physicalMaxDimension =
      Math.max(window.innerWidth, window.innerHeight) *
      Math.max(1, window.devicePixelRatio || 1);
    const wants4K = physicalMaxDimension >= 2200;
    const wantsQHD = physicalMaxDimension >= 1400;

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

    function fallbackFrom(failedMode: PlaybackMode, resumeAt = 0) {
      if (disposed || !video || mode !== failedMode) return;

      if (failedMode === "hevc4k") startHevcQHD(resumeAt);
      else if (failedMode === "hevcqhd") startPremium1080(resumeAt);
      else if (failedMode === "avc4k") startAvcQHD(resumeAt);
      else if (failedMode === "avcqhd") startPremium1080(resumeAt);
      else if (failedMode === "premium") startAdaptive(resumeAt);
      else if (failedMode === "adaptive") startFallbackMp4(resumeAt);
    }

    const playWithRecovery = (expectedMode: PlaybackMode, token: number) => {
      if (!video || disposed || document.visibilityState === "hidden") return;
      setFlags(video);

      let result: Promise<void> | undefined;
      try {
        result = video.play();
      } catch {
        if (token === sourceToken) {
          fallbackFrom(expectedMode, video.currentTime || 0);
        }
        return;
      }

      result?.catch(() => {
        if (
          !disposed &&
          video &&
          token === sourceToken &&
          mode === expectedMode
        ) {
          fallbackFrom(expectedMode, video.currentTime || 0);
        }
      });
    };

    const armProgressWatchdog = (
      expectedMode: PlaybackMode,
      token: number,
      delayMs: number
    ) => {
      clearStartupTimer();
      startupTimer = window.setTimeout(() => {
        startupTimer = null;
        if (
          disposed ||
          !video ||
          token !== sourceToken ||
          mode !== expectedMode ||
          hasAdvanced
        ) {
          return;
        }
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

      const token = ++sourceToken;
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

      playWithRecovery(nextMode, token);
      if (watchdogMs > 0 && nextMode !== "mp4") {
        armProgressWatchdog(nextMode, token, watchdogMs);
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

      const token = ++sourceToken;
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
        if (!disposed && token === sourceToken) hls?.loadSource(source);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (disposed || token !== sourceToken) return;
        restoreTimeWhenReady(resumeAt);
        playWithRecovery(nextMode, token);
        armProgressWatchdog(
          nextMode,
          token,
          nextMode === "premium" ? 4500 : 5500
        );
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!hls || disposed || token !== sourceToken || !data.fatal) return;
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

    function startHevcQHD(resumeAt = 0) {
      startDirectSource(HEVC_QHD, "hevcqhd", resumeAt, 3200);
    }

    function startHevc4K(resumeAt = 0) {
      startDirectSource(HEVC_4K, "hevc4k", resumeAt, 3200);
    }

    function startAvcQHD(resumeAt = 0) {
      startDirectSource(AVC_QHD, "avcqhd", resumeAt, 3200);
    }

    function startAvc4K(resumeAt = 0) {
      startDirectSource(AVC_4K, "avc4k", resumeAt, 3200);
    }

    const avcCapability = async (
      width: number,
      height: number,
      bitrate: number,
      codec: string
    ) => {
      const caps = (navigator as any).mediaCapabilities as
        | MediaCapabilitiesLike
        | undefined;
      if (!caps?.decodingInfo) return false;

      try {
        const result = await caps.decodingInfo({
          type: "file",
          video: {
            contentType: `video/mp4; codecs="${codec}"`,
            width,
            height,
            bitrate,
            framerate: 30,
          },
        });
        return Boolean(result.supported && result.smooth !== false);
      } catch {
        return false;
      }
    };

    const chooseInitialSource = async () => {
      if (!video || disposed) return;

      if (explicitlyConstrained) {
        startAdaptive();
        return;
      }

      // Safari/WebKit and any browser with HEVC support get the proper UHD
      // codec. If HEVC isn't reported as playable, we do not attempt it.
      const hevcSupport = video.canPlayType('video/mp4; codecs="hvc1"');
      if (hevcSupport) {
        if (wants4K) startHevc4K();
        else if (wantsQHD) startHevcQHD();
        else startPremium1080();
        return;
      }

      // On other platforms, only use the uploaded H.264 UHD files after the
      // browser explicitly reports smooth decode support. No guessing.
      if (wants4K) {
        const can4K = await avcCapability(
          3840,
          2160,
          15_200_000,
          "avc1.640033"
        );
        if (disposed || !video) return;
        if (can4K) {
          startAvc4K();
          return;
        }
      }

      if (wantsQHD) {
        const canQHD = await avcCapability(
          2560,
          1440,
          10_100_000,
          "avc1.640032"
        );
        if (disposed || !video) return;
        if (canQHD) {
          startAvcQHD();
          return;
        }
      }

      startPremium1080();
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
          const token = sourceToken;
          playWithRecovery(mode, token);
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

      void chooseInitialSource();
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
